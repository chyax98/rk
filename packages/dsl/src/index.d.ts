import type { ParseResult } from '@renderkit/shared';

/**
 * Parse a RenderKit `.rk.md` source document into the shared RenderKit model.
 *
 * The runtime implementation remains `index.mjs`; this declaration is the Stage 2
 * typed boundary so CLI/Web/Agents can consume `parseRK()` without guessing the
 * model, diagnostic, warning, and block shapes.
 */
export function parseRK(source: string, file?: string): ParseResult;
