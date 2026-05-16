export const RK_SCHEMA_VERSION = '1.0';

export const BLOCK_TYPES = Object.freeze([
  'heading',
  'paragraph',
  'summary',
  'callout',
  'decision-card',
  'code',
  'diagram',
  'subdocument',
  'grid',
  'table',
  'image',
  'tabs',
  'stat',
  'checklist',
  'quote',
  'comparison',
  'timeline',
]);

export const THEME_NAMES = Object.freeze(['paper-light', 'editorial-kami', 'dark-pro', 'amber-terminal']);
export const SURFACE_NAMES = Object.freeze(['engineering-plan', 'decision-brief', 'review-report', 'runbook', 'data-report-lite']);
export const COMMENT_STATUSES = Object.freeze(['open', 'resolved', 'orphaned']);
export const DIAGRAM_ENGINES = Object.freeze(['mermaid', 'svg', 'echarts', 'echarts-bar', 'echarts-line', 'echarts-pie', 'infographic', 'plantuml', 'd2']);
export const SERVER_RENDERED_DIAGRAM_ENGINES = Object.freeze(['plantuml', 'd2']);
export const BLOCK_WIDTHS = Object.freeze(['full', 'wide', 'half', 'third', 'two-third']);
export const CALLOUT_TONES = Object.freeze(['info', 'warning', 'danger', 'success', 'neutral']);

export const DEFAULT_THEME = 'paper-light';
export const WIDE_REVIEW_SURFACES = Object.freeze(['engineering-plan', 'review-report', 'data-report-lite']);

export const BLOCK_ALIASES = Object.freeze({
  sum: { name: 'summary' },
  note: { name: 'callout', attrs: { tone: 'info' } },
  warn: { name: 'callout', attrs: { tone: 'warning' } },
  alert: { name: 'callout', attrs: { tone: 'danger' } },
  ok: { name: 'callout', attrs: { tone: 'success' } },
  dec: { name: 'decision-card' },
  fig: { name: 'diagram' },
  src: { name: 'code' },
  metric: { name: 'stat' },
  todo: { name: 'checklist' },
  compare: { name: 'comparison' },
  roadmap: { name: 'timeline' },
});

export const ERROR_CODES = Object.freeze({
  RK_FRONTMATTER_INVALID: 'RK_FRONTMATTER_INVALID',
  RK_PARSE_ERROR: 'RK_PARSE_ERROR',
  RK_UNKNOWN_BLOCK_TYPE: 'RK_UNKNOWN_BLOCK_TYPE',
  RK_BLOCK_ID_REQUIRED: 'RK_BLOCK_ID_REQUIRED',
  RK_BLOCK_ID_INVALID: 'RK_BLOCK_ID_INVALID',
  RK_TAB_PARENT_REQUIRED: 'RK_TAB_PARENT_REQUIRED',
  RK_PROP_REQUIRED: 'RK_PROP_REQUIRED',
  RK_UNSUPPORTED_DIAGRAM_ENGINE: 'RK_UNSUPPORTED_DIAGRAM_ENGINE',
  RK_DIAGRAM_CODE_REQUIRED: 'RK_DIAGRAM_CODE_REQUIRED',
  RK_CODE_BODY_REQUIRED: 'RK_CODE_BODY_REQUIRED',
  RK_MODEL_CONTRACT_INVALID: 'RK_MODEL_CONTRACT_INVALID',
  RK_ARTIFACT_NOT_FOUND: 'RK_ARTIFACT_NOT_FOUND',
});

const BLOCK_TYPE_SET = new Set(BLOCK_TYPES);
const THEME_SET = new Set(THEME_NAMES);
const SURFACE_SET = new Set(SURFACE_NAMES);
const COMMENT_STATUS_SET = new Set(COMMENT_STATUSES);
const DIAGRAM_ENGINE_SET = new Set(DIAGRAM_ENGINES);
const BLOCK_WIDTH_SET = new Set(BLOCK_WIDTHS);
const WIDE_REVIEW_SURFACE_SET = new Set(WIDE_REVIEW_SURFACES);

export function isKnownBlockType(type) { return BLOCK_TYPE_SET.has(type); }
export function isKnownThemeName(theme) { return THEME_SET.has(theme); }
export function isKnownSurfaceName(surface) { return SURFACE_SET.has(surface); }
export function isKnownCommentStatus(status) { return COMMENT_STATUS_SET.has(status); }
export function isKnownDiagramEngine(engine) { return DIAGRAM_ENGINE_SET.has(engine); }
export function normalizeBlockWidth(value) {
  if (!value) return 'full';
  const v = String(value).trim().toLowerCase();
  return BLOCK_WIDTH_SET.has(v) ? v : 'full';
}
export function isWideReviewSurface(surface) { return WIDE_REVIEW_SURFACE_SET.has(surface); }
export function resolveBlockAlias(name, attrs = {}) {
  const alias = BLOCK_ALIASES[name];
  if (!alias) return { name, attrs };
  return { name: alias.name, attrs: { ...(alias.attrs || {}), ...attrs } };
}

export function validateRenderKitModel(model) {
  const issues = [];
  if (!isObject(model)) return [{ path: '$', message: 'model must be an object' }];
  if (model.rk !== RK_SCHEMA_VERSION) issues.push(issue('$.rk', `expected ${RK_SCHEMA_VERSION}`));
  if (!nonEmptyString(model.title)) issues.push(issue('$.title', 'title must be a non-empty string'));
  if (!isKnownThemeName(model.theme)) issues.push(issue('$.theme', `unknown theme ${JSON.stringify(model.theme)}`));
  if (model.surface != null && typeof model.surface !== 'string') issues.push(issue('$.surface', 'surface must be a string when present'));
  if (!Array.isArray(model.blocks)) issues.push(issue('$.blocks', 'blocks must be an array'));
  else model.blocks.forEach((block, index) => validateBlock(block, `$.blocks[${index}]`, issues));
  return issues;
}

export function validateBlock(block, path = '$', issues = []) {
  if (!isObject(block)) {
    issues.push(issue(path, 'block must be an object'));
    return issues;
  }
  if (!nonEmptyString(block.id)) issues.push(issue(`${path}.id`, 'block id must be a non-empty string'));
  if (!isKnownBlockType(block.type)) issues.push(issue(`${path}.type`, `unknown block type ${JSON.stringify(block.type)}`));
  if (!isObject(block.props)) issues.push(issue(`${path}.props`, 'props must be an object'));
  if (!isSourceRange(block.sourceRange)) issues.push(issue(`${path}.sourceRange`, 'sourceRange must include startLine/endLine numbers'));
  if (typeof block.sourceExcerpt !== 'string') issues.push(issue(`${path}.sourceExcerpt`, 'sourceExcerpt must be a string'));

  const children = block.props?.children;
  if (children !== undefined) {
    if (!Array.isArray(children)) issues.push(issue(`${path}.props.children`, 'children must be an array'));
    else children.forEach((child, index) => validateBlock(child, `${path}.props.children[${index}]`, issues));
  }

  const tabs = block.props?.tabs;
  if (tabs !== undefined) {
    if (!Array.isArray(tabs)) issues.push(issue(`${path}.props.tabs`, 'tabs must be an array'));
    else tabs.forEach((tab, tabIndex) => {
      const tabPath = `${path}.props.tabs[${tabIndex}]`;
      if (!isObject(tab)) issues.push(issue(tabPath, 'tab must be an object'));
      if (!nonEmptyString(tab?.label)) issues.push(issue(`${tabPath}.label`, 'tab label must be a non-empty string'));
      if (!Array.isArray(tab?.blocks)) issues.push(issue(`${tabPath}.blocks`, 'tab blocks must be an array'));
      else tab.blocks.forEach((child, blockIndex) => validateBlock(child, `${tabPath}.blocks[${blockIndex}]`, issues));
    });
  }

  return issues;
}

export function validateTextQuoteSelector(selector) {
  const issues = [];
  if (selector == null) return issues;
  if (!isObject(selector)) return [issue('$', 'selector must be an object')];
  if (selector.type !== 'TextQuoteSelector') issues.push(issue('$.type', 'selector type must be TextQuoteSelector'));
  if (!nonEmptyString(selector.exact)) issues.push(issue('$.exact', 'selector exact must be a non-empty string'));
  for (const field of ['prefix', 'suffix']) {
    if (selector[field] != null && typeof selector[field] !== 'string') issues.push(issue(`$.${field}`, `${field} must be a string when present`));
  }
  return issues;
}

function isObject(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function nonEmptyString(value) { return typeof value === 'string' && value.trim().length > 0; }
function isSourceRange(value) {
  return isObject(value) && Number.isFinite(value.startLine) && Number.isFinite(value.endLine);
}
function issue(path, message) { return { path, message }; }
