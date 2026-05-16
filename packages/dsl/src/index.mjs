import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import yaml from 'js-yaml';
import { DEFAULT_THEME, THEME_NAMES, SURFACE_NAMES, validateRenderKitModel, resolveBlockAlias, normalizeBlockWidth, isKnownDiagramEngine } from '@renderkit/shared/contracts';

// Single source of truth for block compilation. To add a block:
// 1. Add a compiler entry here.
// 2. Add the React renderer in packages/blocks/src/registry.jsx.
// 3. Add a capability fixture and verifier coverage.
const BLOCK_COMPILERS = {
  'callout': (node, attrs, ctx) => compileCallout(node, attrs, ctx.source),
  'decision-card': (node, attrs, ctx) => compileDecision(node, attrs, ctx.source, ctx.errors, ctx.file),
  'diagram': (node, attrs, ctx) => compileDiagram(node, attrs, ctx.source, ctx.errors, ctx.file),
  'code': (node, attrs, ctx) => compileCode(node, attrs, ctx.source, ctx.errors, ctx.file),
  'summary': (node, attrs, ctx) => compileSummary(node, attrs, ctx.source),
  'subdocument': (node, attrs, ctx) => compileSubdocument(node, attrs, ctx.source),
  'grid': (node, attrs, ctx) => compileGrid(node, attrs, ctx),
  'table': (node, attrs, ctx) => compileTable(node, attrs, ctx.source, ctx.errors, ctx.file),
  'image': (node, attrs, ctx) => compileImage(node, attrs, ctx.source, ctx.errors, ctx.file),
  'tabs': (node, attrs, ctx) => compileTabs(node, attrs, ctx),
  'stat': (node, attrs, ctx) => compileStat(node, attrs, ctx.source, ctx.errors, ctx.file),
  'checklist': (node, attrs, ctx) => compileChecklist(node, attrs, ctx.source, ctx.errors, ctx.file),
  'quote': (node, attrs, ctx) => compileQuote(node, attrs, ctx.source, ctx.errors, ctx.file),
  'comparison': (node, attrs, ctx) => compileComparison(node, attrs, ctx.source, ctx.errors, ctx.file),
  'timeline': (node, attrs, ctx) => compileTimeline(node, attrs, ctx.source, ctx.errors, ctx.file),
};
const KNOWN = new Set([...Object.keys(BLOCK_COMPILERS), 'tab']);
const VALID_THEMES = new Set(THEME_NAMES);
const VALID_SURFACES = new Set(SURFACE_NAMES);
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
  const explicitDirectiveIds = collectDirectiveIds(tree);
  const generatedDirectiveIds = new Set();
  const ctx = { source, file, errors, warnings };
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
      let attrs = resolved.attrs;
      const r = pos(node);
      if (!KNOWN.has(name)) {
        errors.push(diag('RK_UNKNOWN_BLOCK_TYPE', `Unknown block type: ${originalName}`, file, r));
        continue;
      }
      if (!attrs.id) {
        attrs = { ...attrs, id: generatedBlockId(name, node, source, explicitDirectiveIds, generatedDirectiveIds) };
      }
      if (!ID_FORMAT.test(attrs.id)) {
        errors.push(diag('RK_BLOCK_ID_INVALID', `${originalName} block id "${attrs.id}" does not match [a-zA-Z0-9_-]+`, file, r));
        continue;
      }
      const patched = { ...node, name, attributes: attrs };
      let block;
      if (name === 'tab') errors.push(diag('RK_TAB_PARENT_REQUIRED', 'tab directive is only valid inside tabs', file, r));
      else block = compileBlock(patched, attrs, ctx);
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
  const contractIssues = validateRenderKitModel(model);
  for (const issue of contractIssues) {
    errors.push(diag('RK_MODEL_CONTRACT_INVALID', `${issue.path}: ${issue.message}`, file));
  }
  return { ok: errors.length === 0, model, errors, warnings };
}


function resolveDirective(name, attrs) {
  return resolveBlockAlias(name, attrs);
}

function collectDirectiveIds(tree) {
  const ids = new Set();
  walkNodes(tree, node => {
    if ((node.type === 'containerDirective' || node.type === 'leafDirective') && node.attributes?.id) ids.add(String(node.attributes.id));
  });
  return ids;
}

function walkNodes(node, visit) {
  if (!node) return;
  visit(node);
  for (const child of node.children || []) walkNodes(child, visit);
}

function generatedBlockId(name, node, source, explicitIds, generatedIds) {
  const base = slugId(`auto-${name}-${autoIdSeed(node, source)}`);
  let id = base;
  let n = 2;
  while (explicitIds.has(id) || generatedIds.has(id)) id = `${base}-${n++}`;
  generatedIds.add(id);
  return id;
}

function autoIdSeed(node, source) {
  const attrs = node.attributes || {};
  const attrSeed = attrs.title || attrs.label || attrs.q || attrs.question || attrs.chosen || attrs.source || '';
  const bodySeed = attrSeed || plainText(node) || rawDirectiveBody(source, node) || directiveBodyText(node) || 'block';
  return String(bodySeed).slice(0, 64);
}

function slugId(value) {
  const slug = String(value || 'block')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return slug || 'auto-block';
}

function normalizeWidth(value) {
  return normalizeBlockWidth(value);
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
  if (!isKnownDiagramEngine(engine)) errors.push(diag('RK_UNSUPPORTED_DIAGRAM_ENGINE', `Unsupported diagram engine: ${engine}`, file, pos(node)));
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



function compileBlock(node, attrs, ctx) {
  return BLOCK_COMPILERS[node.name]?.(node, attrs, ctx) || null;
}

function compileChildBlock(child, attrs, ctx, options) {
  const resolved = resolveDirective(child.name, child.attributes || {});
  const name = resolved.name;
  if (!KNOWN.has(name) || options.disallow?.has(name)) {
    ctx.errors.push(diag(options.errorCode, options.message(child.name), ctx.file, pos(child)));
    return null;
  }
  const id = resolved.attrs.id || options.idFor(attrs, options.index);
  const patched = { ...child, name, attributes: { ...resolved.attrs, id } };
  return compileBlock(patched, patched.attributes, ctx);
}

function compileGrid(node, attrs, ctx) {
  const children = [];
  for (const child of node.children || []) {
    if (child.type !== 'containerDirective' && child.type !== 'leafDirective') continue;
    const block = compileChildBlock(child, attrs, ctx, {
      index: children.length + 1,
      disallow: new Set(['grid']),
      errorCode: 'RK_GRID_CHILD_UNSUPPORTED',
      message: name => `grid child must be a supported non-grid block, got ${name}`,
      idFor: (parentAttrs, index) => `${parentAttrs.id || 'grid'}-${index}`
    });
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
    sourceExcerpt: excerpt(ctx.source, node.position)
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

function compileComparison(node, attrs, source, errors, file) {
  const body = rawDirectiveBody(source, node) || directiveBodyText(node);
  const parsed = parsePipeTable(body);
  if (parsed.headers.length < 2 || !parsed.rows.length) {
    errors.push(diag('RK_COMPARISON_BODY_REQUIRED', 'comparison directive requires a Markdown table with at least two columns and one row', file, pos(node)));
  }
  return {
    id: attrs.id,
    type: 'comparison',
    props: {
      title: attrs.title || '',
      caption: attrs.caption || '',
      columns: parsed.headers,
      rows: parsed.rows,
      width: normalizeWidth(attrs.width || attrs.span || 'wide')
    },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position)
  };
}

function compileTimeline(node, attrs, source, errors, file) {
  const body = rawDirectiveBody(source, node) || directiveBodyText(node);
  const items = parseTimelineItems(body);
  if (!items.length) errors.push(diag('RK_TIMELINE_BODY_REQUIRED', 'timeline directive requires list items', file, pos(node)));
  return {
    id: attrs.id,
    type: 'timeline',
    props: { title: attrs.title || '', items, width: normalizeWidth(attrs.width || attrs.span || 'wide') },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position)
  };
}

function compileTabs(node, attrs, ctx) {
  const tabs = [];
  for (const child of node.children || []) {
    if (child.type !== 'containerDirective' && child.type !== 'leafDirective') continue;
    if (child.name !== 'tab') {
      ctx.errors.push(diag('RK_TABS_CHILD_UNSUPPORTED', `tabs child must be tab, got ${child.name}`, ctx.file, pos(child)));
      continue;
    }
    const tabAttrs = child.attributes || {};
    const tabId = tabAttrs.id || `${attrs.id || 'tabs'}-${tabs.length + 1}`;
    tabs.push({
      id: tabId,
      label: tabAttrs.label || tabAttrs.title || `Tab ${tabs.length + 1}`,
      blocks: compileNestedBlocks(child, tabId, ctx)
    });
  }
  if (!tabs.length) ctx.errors.push(diag('RK_TABS_CHILD_REQUIRED', 'tabs directive requires at least one tab child', ctx.file, pos(node)));
  return {
    id: attrs.id,
    type: 'tabs',
    props: { title: attrs.title || '', width: normalizeWidth(attrs.width || attrs.span || 'wide'), tabs },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(ctx.source, node.position)
  };
}

function compileNestedBlocks(node, prefix, ctx) {
  const out = [];
  let paraN = 0;
  let headingN = 0;
  for (const child of node.children || []) {
    if (child.type === 'heading') {
      headingN++;
      out.push({ id: `${prefix}-heading-${headingN}`, type: 'heading', props: { level: child.depth, text: plainText(child) }, sourceRange: pos(child), sourceExcerpt: excerpt(ctx.source, child.position) });
      continue;
    }
    if (child.type === 'paragraph') {
      const text = plainText(child).trim();
      if (text) { paraN++; out.push({ id: `${prefix}-paragraph-${paraN}`, type: 'paragraph', props: { markdown: text }, sourceRange: pos(child), sourceExcerpt: excerpt(ctx.source, child.position) }); }
      continue;
    }
    if (child.type !== 'containerDirective' && child.type !== 'leafDirective') continue;
    const block = compileChildBlock(child, { id: prefix }, ctx, {
      index: out.length + 1,
      disallow: new Set(['tab']),
      errorCode: 'RK_TABS_BLOCK_UNSUPPORTED',
      message: name => `unsupported block inside tab: ${name}`,
      idFor: (parentAttrs, index) => `${parentAttrs.id}-${index}`
    });
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

function parseTimelineItems(body) {
  return String(body || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const cleaned = line.replace(/^[-*]\s+/, '').trim();
      const m = cleaned.match(/^\[([^\]]+)\]\s*(.+)$/);
      const status = (m?.[1] || 'next').trim().toLowerCase();
      const rest = (m?.[2] || cleaned).trim();
      const split = rest.indexOf(':');
      return {
        status,
        label: split >= 0 ? rest.slice(0, split).trim() : rest,
        body: split >= 0 ? rest.slice(split + 1).trim() : ''
      };
    })
    .filter(item => item.label);
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
