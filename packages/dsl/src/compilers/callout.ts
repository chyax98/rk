import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import type { RemarkNode, BlockAttrs, CompileContext, CompiledBlock } from '../types.ts';
import { pos, excerpt, rawDirectiveBody, directiveBodyText } from '../helpers.ts';

export function compileCallout(
  node: RemarkNode,
  attrs: BlockAttrs,
  source: string,
): CompiledBlock {
  return {
    id: attrs.id!,
    type: 'callout',
    props: {
      tone: attrs.tone || 'info',
      title: attrs.title || '',
      width: normalizeBlockWidth(attrs.width || attrs.span),
      content: rawDirectiveBody(source, node) || directiveBodyText(node),
    },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position),
  };
}
