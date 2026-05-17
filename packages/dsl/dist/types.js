// ── Chart types ──
export const CHART_TYPES = ['bar', 'line', 'pie', 'scatter', 'kpi'];
export const CHART_TEMPLATES = ['default', 'minimal', 'report'];
// ── Table profiles ──
export const TABLE_PROFILES = ['matrix', 'status', 'key-value', 'cards', 'compact'];
export const TABLE_RENDERERS = ['default', 'tanstack'];
// ── Code frame types ──
export const CODE_FRAMES = ['editor', 'terminal', 'none'];
export const CODE_RENDERERS = ['shiki', 'hljs'];
export const CODE_COPY_MODES = ['code', 'all'];
// ── Error codes (extensions) ──
export const DSL_ERROR_CODES = {
    RK_TABLE_TOO_MANY_COLUMNS: 'RK_TABLE_TOO_MANY_COLUMNS',
    RK_RENDERER_UNKNOWN: 'RK_RENDERER_UNKNOWN',
    RK_PROFILE_UNKNOWN: 'RK_PROFILE_UNKNOWN',
    RK_CHART_TYPE_REQUIRED: 'RK_CHART_TYPE_REQUIRED',
    RK_CHART_BODY_REQUIRED: 'RK_CHART_BODY_REQUIRED',
};
//# sourceMappingURL=types.js.map