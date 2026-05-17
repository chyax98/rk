import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import { resolveDirective } from '../alias.ts';
import { diag, excerpt, plainText, pos } from '../helpers.ts';
import type { BlockAttrs, CompileContext, CompiledBlock, RemarkNode } from '../types.ts';
import { compileBlock } from './index.ts';

export function compileTabs(
  node: RemarkNode,
  attrs: BlockAttrs,
  ctx: CompileContext,
): CompiledBlock {
  const tabs: Array<{ id: string; label: string; blocks: CompiledBlock[] }> = [];
  for (const child of node.children || []) {
    if (child.type !== 'containerDirective' && child.type !== 'leafDirective') continue;
    if (child.name !== 'tab') {
      ctx.errors.push(
        diag(
          'RK_TABS_CHILD_UNSUPPORTED',
          `tabs child must be tab, got ${child.name}`,
          ctx.file,
          pos(child),
        ),
      );
      continue;
    }
    const tabAttrs = child.attributes || {};
    const tabId = tabAttrs.id || `${attrs.id || 'tabs'}-${tabs.length + 1}`;
    tabs.push({
      id: tabId,
      label: tabAttrs.label || tabAttrs.title || `Tab ${tabs.length + 1}`,
      blocks: compileNestedBlocks(child, tabId, ctx),
    });
  }
  if (!tabs.length)
    ctx.errors.push(
      diag(
        'RK_TABS_CHILD_REQUIRED',
        'tabs directive requires at least one tab child',
        ctx.file,
        pos(node),
      ),
    );
  return {
    id: attrs.id!,
    type: 'tabs',
    props: {
      title: attrs.title || '',
      width: normalizeBlockWidth(attrs.width || attrs.span || 'wide'),
      tabs,
    },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(ctx.source, node.position),
  };
}

function compileNestedBlocks(
  node: RemarkNode,
  prefix: string,
  ctx: CompileContext,
): CompiledBlock[] {
  const out: CompiledBlock[] = [];
  let paraN = 0;
  let headingN = 0;
  for (const child of node.children || []) {
    if (child.type === 'heading') {
      headingN++;
      out.push({
        id: `${prefix}-heading-${headingN}`,
        type: 'heading',
        props: { level: child.depth!, text: plainText(child) },
        sourceRange: pos(child),
        sourceExcerpt: excerpt(ctx.source, child.position),
      });
      continue;
    }
    if (child.type === 'paragraph') {
      const text = plainText(child).trim();
      if (text) {
        paraN++;
        out.push({
          id: `${prefix}-paragraph-${paraN}`,
          type: 'paragraph',
          props: { markdown: text },
          sourceRange: pos(child),
          sourceExcerpt: excerpt(ctx.source, child.position),
        });
      }
      continue;
    }
    if (child.type !== 'containerDirective' && child.type !== 'leafDirective') continue;

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
      'stat',
      'checklist',
      'quote',
      'comparison',
      'timeline',
      'chart',
    ]);
    if (!KNOWN.has(name) || name === 'tab') {
      ctx.errors.push(
        diag(
          'RK_TABS_BLOCK_UNSUPPORTED',
          `unsupported block inside tab: ${child.name}`,
          ctx.file,
          pos(child),
        ),
      );
      continue;
    }
    const id = resolved.attrs.id || `${prefix}-${out.length + 1}`;
    const patched = { ...child, name, attributes: { ...resolved.attrs, id } };
    const block = compileBlock(patched, patched.attributes, ctx);
    if (block) out.push(block);
  }
  return out;
}
