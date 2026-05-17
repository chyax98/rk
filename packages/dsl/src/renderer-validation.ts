/**
 * Renderer and profile validation.
 * Checks block renderer/profile attrs against allowlists.
 */
import {
  CHART_TYPES,
  CHART_TEMPLATES,
  TABLE_PROFILES,
  TABLE_RENDERERS,
  CODE_FRAMES,
  CODE_RENDERERS,
  CODE_COPY_MODES,
} from './types.ts';
import { coerceEnum } from './attrs.ts';

export function validateTableProfile(
  profile: string | undefined,
  columns: number,
): { profile: string; forced: boolean } {
  if (columns > 6) {
    return { profile: 'cards', forced: true };
  }
  const resolved = coerceEnum(profile, TABLE_PROFILES, 'matrix');
  return { profile: resolved, forced: false };
}

export function validateTableRenderer(renderer: string | undefined): string {
  return coerceEnum(renderer, TABLE_RENDERERS, 'default');
}

export function validateCodeRenderer(renderer: string | undefined): string {
  return coerceEnum(renderer, CODE_RENDERERS, 'shiki');
}

export function validateCodeFrame(frame: string | undefined): string {
  return coerceEnum(frame, CODE_FRAMES, 'none');
}

export function validateCodeCopyMode(mode: string | undefined): string {
  return coerceEnum(mode, CODE_COPY_MODES, 'code');
}

export function validateChartType(chartType: string | undefined): string {
  return coerceEnum(chartType, CHART_TYPES, 'bar');
}

export function validateChartTemplate(template: string | undefined): string {
  return coerceEnum(template, CHART_TEMPLATES, 'default');
}
