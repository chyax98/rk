import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import yaml from 'js-yaml';

const KNOWN = new Set(['callout', 'decision-card', 'diagram', 'code', 'summary', 'subdocument', 'grid']);
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
      const name = node.name;
      const attrs = node.attributes || {};
      const r = pos(node);
      if (!KNOWN.has(name)) {
        errors.push(diag('RK_UNKNOWN_BLOCK_TYPE', `Unknown block type: ${name}`, file, r));
        continue;
      }
      if (!attrs.id) {
        errors.push(diag('RK_BLOCK_ID_REQUIRED', `${name} block requires id`, file, r));
        continue;
      }
      if (!ID_FORMAT.test(attrs.id)) {
        errors.push(diag('RK_BLOCK_ID_INVALID', `${name} block id "${attrs.id}" does not match [a-zA-Z0-9_-]+`, file, r));
        continue;
      }
      let block;
      if (name === 'callout') block = compileCallout(node, attrs, source);
      if (name === 'decision-card') block = compileDecision(node, attrs, source, errors, file);
      if (name === 'diagram') block = compileDiagram(node, attrs, source, errors, file);
      if (name === 'code') block = compileCode(node, attrs, source, errors, file);
      if (name === 'summary') block = compileSummary(node, attrs, source);
      if (name === 'subdocument') block = compileSubdocument(node, attrs, source);
      if (name === 'grid') block = compileGrid(node, attrs, source, errors, file);
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
  try { data = yaml.load(body) || {}; }
  catch (e) { errors.push(diag('RK_DECISION_YAML_INVALID', e.message, file, pos(node))); }

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
      status: data.status || 'draft',
      rationale: data.rationale || [],
      alternatives: data.alternatives || []
    },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position)
  };
}

function compileDiagram(node, attrs, source, errors, file) {
  const code = findCode(node);
  const engine = String(attrs.engine || code?.lang || 'mermaid').toLowerCase();
  const supported = new Set(['mermaid', 'svg', 'plantuml', 'd2', 'echarts', 'infographic']);
  if (!supported.has(engine)) errors.push(diag('RK_UNSUPPORTED_DIAGRAM_ENGINE', `Unsupported diagram engine: ${engine}`, file, pos(node)));
  if (!code?.value) errors.push(diag('RK_DIAGRAM_CODE_REQUIRED', 'diagram requires a fenced code block', file, pos(node)));
  return {
    id: attrs.id,
    type: 'diagram',
    props: { engine, code: code?.value || '', caption: attrs.caption || '', width: normalizeWidth(attrs.width || attrs.span) },
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
    if (!KNOWN.has(child.name) || child.name === 'grid') {
      errors.push(diag('RK_GRID_CHILD_UNSUPPORTED', `grid child must be a supported non-grid block, got ${child.name}`, file, pos(child)));
      continue;
    }
    const childAttrs = child.attributes || {};
    const childId = childAttrs.id || `${attrs.id || 'grid'}-${children.length + 1}`;
    const patched = { ...child, attributes: { ...childAttrs, id: childId } };
    let block;
    if (child.name === 'callout') block = compileCallout(patched, patched.attributes, source);
    if (child.name === 'decision-card') block = compileDecision(patched, patched.attributes, source, errors, file);
    if (child.name === 'diagram') block = compileDiagram(patched, patched.attributes, source, errors, file);
    if (child.name === 'code') block = compileCode(patched, patched.attributes, source, errors, file);
    if (child.name === 'summary') block = compileSummary(patched, patched.attributes, source);
    if (child.name === 'subdocument') block = compileSubdocument(patched, patched.attributes, source);
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

function rawDirectiveBody(source, node) {
  const raw = excerpt(source, node.position);
  const lines = raw.split('\n');
  if (lines.length <= 2) return '';
  return lines.slice(1, -1).join('\n').trim();
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
