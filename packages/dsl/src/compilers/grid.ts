import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import { resolveDirective } from '../alias.ts';
import { diag, excerpt, pos } from '../helpers.ts';
import type {
  BlockAttrs,
  ChildCompileOptions,
  CompileContext,
  CompiledBlock,
  RemarkNode,
} from '../types.ts';
import { compileBlock } from './index.ts';

export function compileGrid(
  node: RemarkNode,
  attrs: BlockAttrs,
  ctx: CompileContext,
): CompiledBlock {
  const children: CompiledBlock[] = [];
  for (const child of node.children || []) {
    if (child.type !== 'containerDirective' && child.type !== 'leafDirective') continue;
    const block = compileChildBlock(child, attrs, ctx, {
      index: children.length + 1,
      disallow: new Set(['grid']),
      errorCode: 'RK_GRID_CHILD_UNSUPPORTED',
      message: (name) => `grid child must be a supported non-grid block, got ${name}`,
      idFor: (parentAttrs, index) => `${parentAttrs.id || 'grid'}-${index}`,
    });
    if (block) children.push(block);
  }
  return {
    id: attrs.id!,
    type: 'grid',
    props: {
      columns: Number(attrs.columns || attrs.cols || 2),
      gap: attrs.gap || 'normal',
      title: attrs.title || '',
      children,
    },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(ctx.source, node.position),
  };
}

export function compileChildBlock(
  child: RemarkNode,
  attrs: BlockAttrs,
  ctx: CompileContext,
  options: ChildCompileOptions,
): CompiledBlock | null {
  const resolved = resolveDirective(child.name!, child.attributes || {});
  const name = resolved.name;
  const KNOWN = new Set([
    'callout',
    'decision-card',
    'diagram',
    'code',
    'summary',
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
  if (!KNOWN.has(name) || options.disallow?.has(name)) {
    ctx.errors.push(diag(options.errorCode, options.message(child.name!), ctx.file, pos(child)));
    return null;
  }
  const id = resolved.attrs.id || options.idFor(attrs, options.index);
  const patched = { ...child, name, attributes: { ...resolved.attrs, id } };
  return compileBlock(patched, patched.attributes, ctx);
}
