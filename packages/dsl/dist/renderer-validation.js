/**
 * Renderer and profile validation.
 * Checks block renderer/profile attrs against allowlists.
 */
import { CHART_TYPES, CHART_TEMPLATES, TABLE_PROFILES, TABLE_RENDERERS, CODE_FRAMES, CODE_RENDERERS, CODE_COPY_MODES, } from './types.js';
import { coerceEnum } from './attrs.js';
export function validateTableProfile(profile, columns) {
    if (columns > 6) {
        return { profile: 'cards', forced: true };
    }
    const resolved = coerceEnum(profile, TABLE_PROFILES, 'matrix');
    return { profile: resolved, forced: false };
}
export function validateTableRenderer(renderer) {
    return coerceEnum(renderer, TABLE_RENDERERS, 'default');
}
export function validateCodeRenderer(renderer) {
    return coerceEnum(renderer, CODE_RENDERERS, 'shiki');
}
export function validateCodeFrame(frame) {
    return coerceEnum(frame, CODE_FRAMES, 'none');
}
export function validateCodeCopyMode(mode) {
    return coerceEnum(mode, CODE_COPY_MODES, 'code');
}
export function validateChartType(chartType) {
    return coerceEnum(chartType, CHART_TYPES, 'bar');
}
export function validateChartTemplate(template) {
    return coerceEnum(template, CHART_TEMPLATES, 'default');
}
//# sourceMappingURL=renderer-validation.js.map