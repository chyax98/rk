/**
 * Alias resolution — delegates to shared contracts.
 */
import { resolveBlockAlias } from '@renderkit/shared/contracts';
import type { BlockAttrs } from './types.ts';

export function resolveDirective(
  name: string,
  attrs: BlockAttrs,
): { name: string; attrs: BlockAttrs } {
  return resolveBlockAlias(name, attrs as Record<string, string>) as {
    name: string;
    attrs: BlockAttrs;
  };
}
