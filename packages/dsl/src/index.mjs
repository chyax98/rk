import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import yaml from 'js-yaml';

const KNOWN = new Set(['callout', 'decision-card', 'diagram', 'code', 'summary', 'subdocument', 'grid', 'table', 'image', 'tabs', 'tab', 'stat', 'checklist', 'quote']);
const ALIASES = new Map([
  ['sum', { name: 'summary' }],
  ['note', { name: 'callout', attrs: { tone: 'info' } }],
  ['warn', { name: 'callout', attrs: { tone: 'warning' } }],
  ['alert', { name: 'callout', attrs: { tone: 'danger' } }],
  ['ok', { name: 'callout', attrs: { tone: 'success' } }],
  ['dec', { name: 'decision-card' }],
  ['fig', { name: 'diagram' }],
  ['src', { name: 'code' }],
  ['metric', { name: 'stat' }],
  ['todo', { name: 'checklist' }],
]);
const DEFAULT_THEME = 'paper-light';
const VALID_THEMES = new Set(['paper-light', 'editorial-kami', 'dark-pro', 'amber-terminal']);
const VALID_SURFACES = new Set(['engineering-plan', 'decision-brief', 'review-report', 'runbook', 'data-report-lite']);
const ID_FORMAT = /^[a-zA-Z0-9_-]+$/;

export function parseRK(source, file = '<source>') {
  const errors = [];
  const warnings = [];
  let frontmatter = {};
  const fm = source.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fm) {
    try { frontmatter = yaml.load(fm[1]) || {}; }
    catch (e) { errors.push(diag('RK_FRONTMATTER_INVALID', e.message, file, rangeFromOffsets(source, 0, fm[0].length))); }
  }

  let tree;
  try {
    tree = unified().use(remarkParse).use(remarkFrontmatter, ['yaml']).use(remarkGfm).use(remarkDirective).parse(source);
  } catch (e) {
    return { ok: false, model: null, errors: [diag('RK_PARSE_ERROR', e.message, file)], warnings };
  }

  const blocks = [];
  const ids = new Map();
  let paraN = 0;
  let headingN = 0;

  for (const node of tree.children || []) {
    if (node.type === 'yaml') continue;
    if (node.type === 'heading') {
      headingN++;
      blocks.push({
        id: `heading-${headingN}`,
        type: 'heading',
        props: { level: node.depth, text: plainText(node) },
        sourceRange: pos(node),
        sourceExcerpt: excerpt(source, node.position)
      });
      continue;
    }
    if (node.type === 'paragraph') {
      const text = plainText(node).trim();
      if (!text) continue;
      paraN++;
      blocks.push({
        id: `paragraph-${paraN}`,
        type: 'paragraph',
        props: { markdown: text },
        sourceRange: pos(node),
        sourceExcerpt: excerpt(source, node.position)
      });
      continue;
    }
    if (node.type === 'containerDirective' || node.type === 'leafDirective') {
      const originalName = node.name;
      const resolved = resolveDirective(originalName, node.attributes || {});
      const name = resolved.name;
      const attrs = resolved.attrs;
      const r = pos(node);
      if (!KNOWN.has(name)) {
        errors.push(diag('RK_UNKNOWN_BLOCK_TYPE', `Unknown block type: ${originalName}`, file, r));
        continue;
      }
      if (!attrs.id) {
        errors.push(diag('RK_BLOCK_ID_REQUIRED', `${originalName} block requires id`, file, r));
        continue;
      }
      if (!ID_FORMAT.test(attrs.id)) {
        errors.push(diag('RK_BLOCK_ID_INVALID', `${originalName} block id "${attrs.id}" does not match [a-zA-Z0-9_-]+`, file, r));
        continue;
      }
      const patched = resolved.name === originalName ? node : { ...node, name, attributes: attrs };
      let block;
      if (name === 'callout') block = compileCallout(patched, attrs, source);
      if (name === 'decision-card') block = compileDecision(patched, attrs, source, errors, file);
      if (name === 'diagram') block = compileDiagram(patched, attrs, source, errors, file);
      if (name === 'code') block = compileCode(patched, attrs, source, errors, file);
      if (name === 'summary') block = compileSummary(patched, attrs, source);
      if (name === 'subdocument') block = compileSubdocument(patched, attrs, source);
      if (name === 'grid') block = compileGrid(patched, attrs, source, errors, file);
      if (name === 'table') block = compileTable(patched, attrs, source, errors, file);
      if (name === 'image') block = compileImage(patched, attrs, source, errors, file);
      if (name === 'tabs') block = compileTabs(patched, attrs, source, errors, file);
      if (name === 'stat') block = compileStat(patched, attrs, source, errors, file);
      if (name === 'checklist') block = compileChecklist(patched, attrs, source, errors, file);
      if (name === 'quote') block = compileQuote(patched, attrs, source, errors, file);
      if (name === 'tab') errors.push(diag('RK_TAB_PARENT_REQUIRED', 'tab directive is only valid inside tabs', file, r));
      if (block) blocks.push(block);
      continue;
    }
  }

  for (const block of blocks) {
    if (ids.has(block.id)) {
      errors.push(diag('RK_DUPLICATE_BLOCK_ID', `Duplicate block id: ${block.id}`, file, block.sourceRange));
    } else ids.set(block.id, block);
  }

  let effectiveTheme = frontmatter.theme || null;
  let effectiveSurface = frontmatter.surface || null;

  if (effectiveTheme && !VALID_THEMES.has(effectiveTheme)) {
    warnings.push(diag('RK_THEME_UNKNOWN', `Unknown theme "${effectiveTheme}", falling back to "${DEFAULT_THEME}"`, file));
    effectiveTheme = DEFAULT_THEME;
  }
  if (effectiveSurface && !VALID_SURFACES.has(effectiveSurface)) {
    warnings.push(diag('RK_SURFACE_UNKNOWN', `Unknown surface "${effectiveSurface}", using as-is but may not render as expected`, file));
  }

  const model = {
    rk: '1.0',
    title: frontmatter.title || firstHeading(blocks) || 'Untitled Artifact',
    template: frontmatter.template,
    theme: effectiveTheme || DEFAULT_THEME,
    surface: effectiveSurface,
    blocks
  };
  return { ok: errors.length === 0, model, errors, warnings };
}


function resolveDirective(name, attrs) {
  const alias = ALIASES.get(name);
  if (!alias) return { name, attrs };
  return { name: alias.name, attrs: { ...(alias.attrs || {}), ...attrs } };
}

function normalizeWidth(value) {
  if (!value) return 'full';
  const v = String(value).trim().toLowerCase();
  if (['full', 'wide', 'half', 'third', 'two-third'].includes(v)) return v;
  return 'full';
}

function compileCallout(node, attrs, source) {
  return {
    id: attrs.id,
    type: 'callout',
    props: {
      tone: attrs.tone || 'info',
      title: attrs.title || '',
      width: normalizeWidth(attrs.width || attrs.span),
      content: rawDirectiveBody(source, node) || directiveBodyText(node)
    },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position)
  };
}

function compileDecision(node, attrs, source, errors, file) {
  const body = rawDirectiveBody(source, node) || directiveBodyText(node);
  let data = {};
  if (attrs.q || attrs.question || attrs.chosen) {
    data = {
      question: attrs.q || attrs.question || '',
      chosen: attrs.chosen || '',
      status: attrs.status || 'draft',
      rationale: markdownBullets(body),
      alternatives: []
    };
  } else {
    try { data = yaml.load(body) || {}; }
    catch (e) { errors.push(diag('RK_DECISION_YAML_INVALID', e.message, file, pos(node))); }
  }

  for (const k of ['question', 'chosen']) {
    if (!data[k]) errors.push(diag('RK_PROP_REQUIRED', `decision-card requires ${k}`, file, pos(node)));
  }
  return {
    id: attrs.id,
    type: 'decision-card',
    props: {
      question: data.question || '',
      chosen: data.chosen || '',
      width: normalizeWidth(attrs.width || attrs.span),
      status: data.status || attrs.status || 'draft',
      rationale: data.rationale || [],
      alternatives: data.alternatives || []
    },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position)
  };
}

function compileDiagram(node, attrs, source, errors, file) {
  const code = findCode(node);
  const body = rawDirectiveBody(source, node) || directiveBodyText(node);
  const engine = String(attrs.engine || code?.lang || 'mermaid').toLowerCase();
  const supported = new Set(['mermaid', 'svg', 'plantuml', 'd2', 'echarts', 'echarts-bar', 'echarts-line', 'echarts-pie', 'infographic']);
  if (!supported.has(engine)) errors.push(diag('RK_UNSUPPORTED_DIAGRAM_ENGINE', `Unsupported diagram engine: ${engine}`, file, pos(node)));
  const diagramCode = code?.value || stripFenceLikeBody(body);
  if (!diagramCode) errors.push(diag('RK_DIAGRAM_CODE_REQUIRED', 'diagram requires a fenced code block or inline diagram body', file, pos(node)));
  return {
    id: attrs.id,
    type: 'diagram',
    props: { engine, code: diagramCode, caption: attrs.caption || '', width: normalizeWidth(attrs.width || attrs.span) },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position)
  };
}

function compileCode(node, attrs, source, errors, file) {
  const code = findCode(node);
  if (!code || !code.value) {
    errors.push(diag('RK_CODE_BODY_REQUIRED', 'code directive requires a fenced code block', file, pos(node)));
  }
  return {
    id: attrs.id,
    type: 'code',
    props: { language: attrs.language || code?.lang || '', title: attrs.title || '', code: code?.value || '', width: normalizeWidth(attrs.width || attrs.span) },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position)
  };
}



function compileGrid(node, attrs, source, errors, file) {
  const children = [];
  for (const child of node.children || []) {
    if (child.type !== 'containerDirective' && child.type !== 'leafDirective') continue;
    const resolved = resolveDirective(child.name, child.attributes || {});
    if (!KNOWN.has(resolved.name) || resolved.name === 'grid') {
      errors.push(diag('RK_GRID_CHILD_UNSUPPORTED', `grid child must be a supported non-grid block, got ${child.name}`, file, pos(child)));
      continue;
    }
    const childId = resolved.attrs.id || `${attrs.id || 'grid'}-${children.length + 1}`;
    const patched = { ...child, name: resolved.name, attributes: { ...resolved.attrs, id: childId } };
    let block;
    if (resolved.name === 'callout') block = compileCallout(patched, patched.attributes, source);
    if (resolved.name === 'decision-card') block = compileDecision(patched, patched.attributes, source, errors, file);
    if (resolved.name === 'diagram') block = compileDiagram(patched, patched.attributes, source, errors, file);
    if (resolved.name === 'code') block = compileCode(patched, patched.attributes, source, errors, file);
    if (resolved.name === 'summary') block = compileSummary(patched, patched.attributes, source);
    if (resolved.name === 'subdocument') block = compileSubdocument(patched, patched.attributes, source);
    if (resolved.name === 'table') block = compileTable(patched, patched.attributes, source, errors, file);
    if (resolved.name === 'image') block = compileImage(patched, patched.attributes, source, errors, file);
    if (resolved.name === 'tabs') block = compileTabs(patched, patched.attributes, source, errors, file);
    if (resolved.name === 'stat') block = compileStat(patched, patched.attributes, source, errors, file);
    if (resolved.name === 'checklist') block = compileChecklist(patched, patched.attributes, source, errors, file);
    if (resolved.name === 'quote') block = compileQuote(patched, patched.attributes, source, errors, file);
    if (block) children.push(block);
  }
  return {
    id: attrs.id,
    type: 'grid',
    props: {
      columns: Number(attrs.columns || attrs.cols || 2),
      gap: attrs.gap || 'normal',
      title: attrs.title || '',
      children,
    },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position)
  };
}

function compileSubdocument(node, attrs, source) {
  const body = rawDirectiveBody(source, node) || directiveBodyText(node);
  return {
    id: attrs.id,
    type: 'subdocument',
    props: {
      title: attrs.title || attrs.source || attrs.artifactId || 'Untitled subdocument',
      source: attrs.source || '',
      artifactId: attrs.artifactId || '',
      revision: attrs.revision || '',
      surface: attrs.surface || '',
      status: attrs.status || 'linked',
      width: normalizeWidth(attrs.width || attrs.span),
      summary: body.trim()
    },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position)
  };
}

function compileSummary(node, attrs, source) {
  return {
    id: attrs.id,
    type: 'summary',
    props: { title: attrs.title || '', width: normalizeWidth(attrs.width || attrs.span), content: rawDirectiveBody(source, node) || directiveBodyText(node) },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position)
  };
}

function compileTable(node, attrs, source, errors, file) {
  const body = rawDirectiveBody(source, node) || directiveBodyText(node);
  const parsed = parsePipeTable(body);
  if (!parsed.headers.length || !parsed.rows.length) {
    errors.push(diag('RK_TABLE_BODY_REQUIRED', 'table directive requires a GitHub-flavored Markdown table body', file, pos(node)));
  }
  return {
    id: attrs.id,
    type: 'table',
    props: {
      title: attrs.title || '',
      caption: attrs.caption || '',
      width: normalizeWidth(attrs.width || attrs.span || 'wide'),
      columns: parsed.headers,
      rows: parsed.rows,
      align: parsed.align
    },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position)
  };
}

function compileImage(node, attrs, source, errors, file) {
  if (!attrs.src) errors.push(diag('RK_IMAGE_SRC_REQUIRED', 'image directive requires src', file, pos(node)));
  const body = rawDirectiveBody(source, node) || directiveBodyText(node);
  return {
    id: attrs.id,
    type: 'image',
    props: {
      src: attrs.src || '',
      alt: attrs.alt || attrs.title || '',
      title: attrs.title || '',
      caption: attrs.caption || body,
      aspect: attrs.aspect || '',
      width: normalizeWidth(attrs.width || attrs.span || 'wide')
    },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position)
  };
}

function compileStat(node, attrs, source, errors, file) {
  const body = rawDirectiveBody(source, node) || directiveBodyText(node);
  const value = attrs.value || attrs.metric || '';
  if (!value) errors.push(diag('RK_STAT_VALUE_REQUIRED', 'stat directive requires value', file, pos(node)));
  return {
    id: attrs.id,
    type: 'stat',
    props: {
      label: attrs.label || attrs.title || '',
      value,
      delta: attrs.delta || '',
      tone: attrs.tone || 'neutral',
      caption: attrs.caption || body,
      width: normalizeWidth(attrs.width || attrs.span)
    },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position)
  };
}

function compileChecklist(node, attrs, source, errors, file) {
  const body = rawDirectiveBody(source, node) || directiveBodyText(node);
  const items = parseChecklistItems(body);
  if (!items.length) errors.push(diag('RK_CHECKLIST_BODY_REQUIRED', 'checklist directive requires list items', file, pos(node)));
  return {
    id: attrs.id,
    type: 'checklist',
    props: { title: attrs.title || '', items, width: normalizeWidth(attrs.width || attrs.span) },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position)
  };
}

function compileQuote(node, attrs, source, errors, file) {
  const body = rawDirectiveBody(source, node) || directiveBodyText(node);
  if (!body) errors.push(diag('RK_QUOTE_BODY_REQUIRED', 'quote directive requires body text', file, pos(node)));
  return {
    id: attrs.id,
    type: 'quote',
    props: { quote: body, cite: attrs.cite || attrs.by || '', role: attrs.role || '', width: normalizeWidth(attrs.width || attrs.span) },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position)
  };
}

function compileTabs(node, attrs, source, errors, file) {
  const tabs = [];
  for (const child of node.children || []) {
    if (child.type !== 'containerDirective' && child.type !== 'leafDirective') continue;
    if (child.name !== 'tab') {
      errors.push(diag('RK_TABS_CHILD_UNSUPPORTED', `tabs child must be tab, got ${child.name}`, file, pos(child)));
      continue;
    }
    const tabAttrs = child.attributes || {};
    const tabId = tabAttrs.id || `${attrs.id || 'tabs'}-${tabs.length + 1}`;
    tabs.push({
      id: tabId,
      label: tabAttrs.label || tabAttrs.title || `Tab ${tabs.length + 1}`,
      blocks: compileNestedBlocks(child, tabId, source, errors, file)
    });
  }
  if (!tabs.length) errors.push(diag('RK_TABS_CHILD_REQUIRED', 'tabs directive requires at least one tab child', file, pos(node)));
  return {
    id: attrs.id,
    type: 'tabs',
    props: { title: attrs.title || '', width: normalizeWidth(attrs.width || attrs.span || 'wide'), tabs },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position)
  };
}

function compileNestedBlocks(node, prefix, source, errors, file) {
  const out = [];
  let paraN = 0;
  let headingN = 0;
  for (const child of node.children || []) {
    if (child.type === 'heading') {
      headingN++;
      out.push({ id: `${prefix}-heading-${headingN}`, type: 'heading', props: { level: child.depth, text: plainText(child) }, sourceRange: pos(child), sourceExcerpt: excerpt(source, child.position) });
      continue;
    }
    if (child.type === 'paragraph') {
      const text = plainText(child).trim();
      if (text) { paraN++; out.push({ id: `${prefix}-paragraph-${paraN}`, type: 'paragraph', props: { markdown: text }, sourceRange: pos(child), sourceExcerpt: excerpt(source, child.position) }); }
      continue;
    }
    if (child.type !== 'containerDirective' && child.type !== 'leafDirective') continue;
    const resolved = resolveDirective(child.name, child.attributes || {});
    if (resolved.name === 'tab' || !KNOWN.has(resolved.name)) {
      errors.push(diag('RK_TABS_BLOCK_UNSUPPORTED', `unsupported block inside tab: ${child.name}`, file, pos(child)));
      continue;
    }
    const nestedId = resolved.attrs.id || `${prefix}-${out.length + 1}`;
    const patched = { ...child, name: resolved.name, attributes: { ...resolved.attrs, id: nestedId } };
    let block;
    if (resolved.name === 'callout') block = compileCallout(patched, patched.attributes, source);
    if (resolved.name === 'decision-card') block = compileDecision(patched, patched.attributes, source, errors, file);
    if (resolved.name === 'diagram') block = compileDiagram(patched, patched.attributes, source, errors, file);
    if (resolved.name === 'code') block = compileCode(patched, patched.attributes, source, errors, file);
    if (resolved.name === 'summary') block = compileSummary(patched, patched.attributes, source);
    if (resolved.name === 'subdocument') block = compileSubdocument(patched, patched.attributes, source);
    if (resolved.name === 'table') block = compileTable(patched, patched.attributes, source, errors, file);
    if (resolved.name === 'image') block = compileImage(patched, patched.attributes, source, errors, file);
    if (resolved.name === 'grid') block = compileGrid(patched, patched.attributes, source, errors, file);
    if (resolved.name === 'stat') block = compileStat(patched, patched.attributes, source, errors, file);
    if (resolved.name === 'checklist') block = compileChecklist(patched, patched.attributes, source, errors, file);
    if (resolved.name === 'quote') block = compileQuote(patched, patched.attributes, source, errors, file);
    if (block) out.push(block);
  }
  return out;
}

function rawDirectiveBody(source, node) {
  const raw = excerpt(source, node.position);
  const lines = raw.split('\n');
  if (lines.length <= 2) return '';
  return lines.slice(1, -1).join('\n').trim();
}

function parseChecklistItems(body) {
  return String(body || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const m = line.match(/^[-*]\s+\[(x|X| |-)\]\s+(.+)$/);
      if (m) return { checked: m[1].toLowerCase() === 'x', text: m[2].trim() };
      return { checked: false, text: line.replace(/^[-*]\s+/, '').trim() };
    })
    .filter(item => item.text);
}

function markdownBullets(body) {
  return String(body || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.replace(/^[-*]\s+/, ''));
}

function stripFenceLikeBody(body) {
  const text = String(body || '').trim();
  if (!text) return '';
  return text.replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/\n?```$/, '').trim();
}

function parsePipeTable(body) {
  const lines = String(body || '').split('\n').map(l => l.trim()).filter(Boolean);
  const tableLines = lines.filter(l => l.includes('|'));
  if (tableLines.length < 2) return { headers: [], rows: [], align: [] };
  const header = splitTableRow(tableLines[0]);
  const sep = splitTableRow(tableLines[1]);
  if (!header.length || !sep.every(isSeparatorCell)) return { headers: [], rows: [], align: [] };
  const align = sep.map(cell => {
    const t = cell.trim();
    if (t.startsWith(':') && t.endsWith(':')) return 'center';
    if (t.endsWith(':')) return 'right';
    return 'left';
  });
  const rows = tableLines.slice(2).map(splitTableRow).filter(r => r.length).map(r => header.map((_, i) => r[i] || ''));
  return { headers: header, rows, align };
}

function splitTableRow(line) {
  return String(line || '').replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
}

function isSeparatorCell(cell) {
  return /^:?-{3,}:?$/.test(String(cell || '').trim());
}

function findCode(node) {
  const stack = [...(node.children || [])];
  while (stack.length) {
    const n = stack.shift();
    if (n.type === 'code') return n;
    if (n.children) stack.push(...n.children);
  }
  return null;
}

function directiveBodyText(node) {
  const parts = [];
  for (const child of node.children || []) {
    if (child.type === 'paragraph') parts.push(plainText(child));
    else if (child.type === 'code') parts.push(child.value || '');
    else if (child.type === 'list') parts.push(listText(child));
    else parts.push(plainText(child));
  }
  return parts.join('\n\n').trim();
}

function listText(node) {
  return (node.children || []).map(item => '- ' + plainText(item)).join('\n');
}

function plainText(node) {
  if (!node) return '';
  if (typeof node.value === 'string') return node.value;
  return (node.children || []).map(plainText).join('');
}

function firstHeading(blocks) {
  return blocks.find(b => b.type === 'heading')?.props?.text;
}

function pos(node) {
  const p = node.position || {};
  return {
    startLine: p.start?.line || 1,
    startColumn: p.start?.column || 1,
    endLine: p.end?.line || p.start?.line || 1,
    endColumn: p.end?.column || p.start?.column || 1,
    startOffset: p.start?.offset,
    endOffset: p.end?.offset
  };
}

function rangeFromOffsets(source, start, end) {
  const before = source.slice(0, start).split('\n');
  const body = source.slice(start, end).split('\n');
  return { startLine: before.length, startColumn: before.at(-1).length + 1, endLine: before.length + body.length - 1, endColumn: body.at(-1).length + 1, startOffset: start, endOffset: end };
}

function excerpt(source, position) {
  if (!position?.start || !position?.end) return '';
  if (typeof position.start.offset === 'number' && typeof position.end.offset === 'number') return source.slice(position.start.offset, position.end.offset);
  const lines = source.split('\n');
  return lines.slice(position.start.line - 1, position.end.line).join('\n');
}

function diag(code, message, file, range = null) {
  return { code, message, file, ...(range || {}) };
}
