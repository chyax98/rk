export const RK_SCHEMA_VERSION = '1.0';
// ─── Block types ───
export const BLOCK_TYPES = Object.freeze([
    'heading',
    'paragraph',
    'summary',
    'callout',
    'decision-card',
    'code',
    'diagram',
    'grid',
    'table',
    'image',
    'tabs',
    'stat',
    'checklist',
    'quote',
    'comparison',
    'timeline',
    'chart',
]);
// ─── Themes ───
export const THEME_NAMES = Object.freeze(['paper-light', 'editorial-kami', 'dark-pro', 'amber-terminal']);
// ─── Surfaces ───
export const SURFACE_NAMES = Object.freeze(['engineering-plan', 'decision-brief', 'review-report', 'runbook', 'data-report-lite', 'proposal', 'documentation']);
// ─── Comment statuses ───
export const COMMENT_STATUSES = Object.freeze(['open', 'resolved', 'orphaned']);
// ─── Diagram engines ───
export const DIAGRAM_ENGINES = Object.freeze(['mermaid', 'svg', 'echarts', 'echarts-bar', 'echarts-line', 'echarts-pie', 'infographic', 'plantuml', 'd2']);
export const SERVER_RENDERED_DIAGRAM_ENGINES = Object.freeze(['plantuml', 'd2']);
// ─── Block widths ───
export const BLOCK_WIDTHS = Object.freeze(['full', 'wide', 'half', 'third', 'two-third']);
// ─── Callout tones ───
export const CALLOUT_TONES = Object.freeze(['info', 'warning', 'danger', 'success', 'neutral']);
// ─── Defaults ───
export const DEFAULT_THEME = 'paper-light';
export const WIDE_REVIEW_SURFACES = Object.freeze(['engineering-plan', 'review-report', 'data-report-lite']);
// ─── Table profiles & renderers (renderer schema) ───
export const TABLE_PROFILES = Object.freeze(['matrix', 'status', 'key-value', 'cards', 'compact']);
export const TABLE_RENDERERS = Object.freeze(['default', 'tanstack']);
// ─── Code frames & renderers (renderer schema) ───
export const CODE_FRAMES = Object.freeze(['editor', 'terminal', 'none']);
export const CODE_RENDERERS = Object.freeze(['shiki', 'hljs']);
export const CODE_COPY_MODES = Object.freeze(['code', 'all']);
// ─── Chart types & templates (renderer schema) ───
export const CHART_TYPES = Object.freeze(['bar', 'line', 'pie', 'scatter', 'kpi']);
export const CHART_TEMPLATES = Object.freeze(['default', 'minimal', 'report']);
// ─── Renderer schema ───
export const RENDERER_SCHEMA = {
    table: {
        profiles: TABLE_PROFILES,
        renderers: TABLE_RENDERERS,
        defaultProfile: 'matrix',
        defaultRenderer: 'default',
        maxColumns: 6,
    },
    code: {
        frames: CODE_FRAMES,
        renderers: CODE_RENDERERS,
        defaultRenderer: 'shiki',
        copyModes: CODE_COPY_MODES,
    },
    chart: {
        types: CHART_TYPES,
        templates: CHART_TEMPLATES,
        maxSeries: 5,
        maxLabels: 12,
    },
};
// ─── Block aliases ───
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
// ─── Error codes ───
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
    RK_DUPLICATE_BLOCK_ID: 'RK_DUPLICATE_BLOCK_ID',
    RK_GRID_CHILD_UNSUPPORTED: 'RK_GRID_CHILD_UNSUPPORTED',
    RK_TABS_CHILD_UNSUPPORTED: 'RK_TABS_CHILD_UNSUPPORTED',
    RK_TABS_BLOCK_UNSUPPORTED: 'RK_TABS_BLOCK_UNSUPPORTED',
    RK_DECISION_YAML_INVALID: 'RK_DECISION_YAML_INVALID',
    RK_TABLE_BODY_REQUIRED: 'RK_TABLE_BODY_REQUIRED',
    RK_IMAGE_SRC_REQUIRED: 'RK_IMAGE_SRC_REQUIRED',
    RK_STAT_VALUE_REQUIRED: 'RK_STAT_VALUE_REQUIRED',
    RK_CHECKLIST_BODY_REQUIRED: 'RK_CHECKLIST_BODY_REQUIRED',
    RK_QUOTE_BODY_REQUIRED: 'RK_QUOTE_BODY_REQUIRED',
    RK_COMPARISON_BODY_REQUIRED: 'RK_COMPARISON_BODY_REQUIRED',
    RK_TIMELINE_BODY_REQUIRED: 'RK_TIMELINE_BODY_REQUIRED',
    RK_TABS_CHILD_REQUIRED: 'RK_TABS_CHILD_REQUIRED',
    RK_TABLE_TOO_MANY_COLUMNS: 'RK_TABLE_TOO_MANY_COLUMNS',
    RK_RENDERER_UNKNOWN: 'RK_RENDERER_UNKNOWN',
    RK_PROFILE_UNKNOWN: 'RK_PROFILE_UNKNOWN',
    RK_CHART_BODY_REQUIRED: 'RK_CHART_BODY_REQUIRED',
});
// ─── Internal sets (non-exported) ───
const BLOCK_TYPE_SET = new Set(BLOCK_TYPES);
const THEME_SET = new Set(THEME_NAMES);
const SURFACE_SET = new Set(SURFACE_NAMES);
const COMMENT_STATUS_SET = new Set(COMMENT_STATUSES);
const DIAGRAM_ENGINE_SET = new Set(DIAGRAM_ENGINES);
const BLOCK_WIDTH_SET = new Set(BLOCK_WIDTHS);
const WIDE_REVIEW_SURFACE_SET = new Set(WIDE_REVIEW_SURFACES);
// ─── Runtime validators ───
export function isKnownBlockType(type) { return BLOCK_TYPE_SET.has(type); }
export function isKnownThemeName(theme) { return THEME_SET.has(theme); }
export function isKnownSurfaceName(surface) { return SURFACE_SET.has(surface); }
export function isKnownCommentStatus(status) { return COMMENT_STATUS_SET.has(status); }
export function isKnownDiagramEngine(engine) { return DIAGRAM_ENGINE_SET.has(engine); }
export function normalizeBlockWidth(value) {
    if (!value)
        return 'full';
    const v = String(value).trim().toLowerCase();
    return BLOCK_WIDTH_SET.has(v) ? v : 'full';
}
export function isWideReviewSurface(surface) { return WIDE_REVIEW_SURFACE_SET.has(surface); }
export function resolveBlockAlias(name, attrs = {}) {
    const alias = BLOCK_ALIASES[name];
    if (!alias)
        return { name, attrs };
    return { name: alias.name, attrs: { ...(alias.attrs || {}), ...attrs } };
}
// ─── Model validation ───
export function validateRenderKitModel(model) {
    const issues = [];
    if (!isObject(model))
        return [{ path: '$', message: 'model must be an object' }];
    const m = model;
    if (m.rk !== RK_SCHEMA_VERSION)
        issues.push(issue('$.rk', `expected ${RK_SCHEMA_VERSION}`));
    if (!nonEmptyString(m.title))
        issues.push(issue('$.title', 'title must be a non-empty string'));
    if (typeof m.theme !== 'string' || !isKnownThemeName(m.theme))
        issues.push(issue('$.theme', `unknown theme ${JSON.stringify(m.theme)}`));
    if (m.surface != null && typeof m.surface !== 'string')
        issues.push(issue('$.surface', 'surface must be a string when present'));
    if (!Array.isArray(m.blocks))
        issues.push(issue('$.blocks', 'blocks must be an array'));
    else
        m.blocks.forEach((block, index) => validateBlock(block, `$.blocks[${index}]`, issues));
    return issues;
}
export function validateBlock(block, path = '$', issues = []) {
    if (!isObject(block)) {
        issues.push(issue(path, 'block must be an object'));
        return issues;
    }
    const b = block;
    if (!nonEmptyString(b.id))
        issues.push(issue(`${path}.id`, 'block id must be a non-empty string'));
    if (typeof b.type !== 'string' || !isKnownBlockType(b.type))
        issues.push(issue(`${path}.type`, `unknown block type ${JSON.stringify(b.type)}`));
    if (!isObject(b.props))
        issues.push(issue(`${path}.props`, 'props must be an object'));
    if (!isSourceRange(b.sourceRange))
        issues.push(issue(`${path}.sourceRange`, 'sourceRange must include startLine/endLine numbers'));
    if (typeof b.sourceExcerpt !== 'string')
        issues.push(issue(`${path}.sourceExcerpt`, 'sourceExcerpt must be a string'));
    const children = b.props?.children;
    if (children !== undefined) {
        if (!Array.isArray(children))
            issues.push(issue(`${path}.props.children`, 'children must be an array'));
        else
            children.forEach((child, index) => validateBlock(child, `${path}.props.children[${index}]`, issues));
    }
    const tabs = b.props?.tabs;
    if (tabs !== undefined) {
        if (!Array.isArray(tabs))
            issues.push(issue(`${path}.props.tabs`, 'tabs must be an array'));
        else
            tabs.forEach((tab, tabIndex) => {
                const tabPath = `${path}.props.tabs[${tabIndex}]`;
                const t = tab;
                if (!isObject(tab))
                    issues.push(issue(tabPath, 'tab must be an object'));
                if (!nonEmptyString(t.label))
                    issues.push(issue(`${tabPath}.label`, 'tab label must be a non-empty string'));
                if (!Array.isArray(t.blocks))
                    issues.push(issue(`${tabPath}.blocks`, 'tab blocks must be an array'));
                else
                    t.blocks.forEach((child, blockIndex) => validateBlock(child, `${tabPath}.blocks[${blockIndex}]`, issues));
            });
    }
    return issues;
}
export function validateTextQuoteSelector(selector) {
    const issues = [];
    if (selector == null)
        return issues;
    if (!isObject(selector))
        return [issue('$', 'selector must be an object')];
    const s = selector;
    if (s.type !== 'TextQuoteSelector')
        issues.push(issue('$.type', 'selector type must be TextQuoteSelector'));
    if (!nonEmptyString(s.exact))
        issues.push(issue('$.exact', 'selector exact must be a non-empty string'));
    for (const field of ['prefix', 'suffix']) {
        if (s[field] != null && typeof s[field] !== 'string')
            issues.push(issue(`$.${field}`, `${field} must be a string when present`));
    }
    return issues;
}
// ─── Internal helpers ───
function isObject(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function nonEmptyString(value) { return typeof value === 'string' && value.trim().length > 0; }
function isSourceRange(value) {
    if (!isObject(value))
        return false;
    const obj = value;
    return typeof obj.startLine === 'number' && Number.isFinite(obj.startLine) &&
        typeof obj.endLine === 'number' && Number.isFinite(obj.endLine);
}
function issue(path, message) { return { path, message }; }
