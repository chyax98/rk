/**
 * Block ID generation utilities.
 */
import type { RemarkNode } from './types.ts';
import { plainText, rawDirectiveBody, directiveBodyText } from './helpers.ts';

export function generatedBlockId(
  name: string,
  node: RemarkNode,
  source: string,
  explicitIds: Set<string>,
  generatedIds: Set<string>,
): string {
  const base = slugId(`auto-${name}-${autoIdSeed(node, source)}`);
  let id = base;
  let n = 2;
  while (explicitIds.has(id) || generatedIds.has(id)) id = `${base}-${n++}`;
  generatedIds.add(id);
  return id;
}

function autoIdSeed(node: RemarkNode, source: string): string {
  const attrs = node.attributes || {};
  const attrSeed = attrs.title || attrs.label || attrs.q || attrs.question || attrs.chosen || attrs.source || '';
  const bodySeed = attrSeed || plainText(node) || rawDirectiveBody(source, node) || directiveBodyText(node) || 'block';
  return String(bodySeed).slice(0, 64);
}

export function slugId(value: string | undefined): string {
  const slug = String(value || 'block')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return slug || 'auto-block';
}

export const ID_FORMAT = /^[a-zA-Z0-9_-]+$/;
