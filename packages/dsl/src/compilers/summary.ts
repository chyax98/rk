import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import type { RemarkNode, BlockAttrs, CompileContext, CompiledBlock } from '../types.ts';
import { pos, excerpt, rawDirectiveBody, directiveBodyText } from '../helpers.ts';

export function compileSummary(
  node: RemarkNode,
  attrs: BlockAttrs,
  source: string,
): CompiledBlock {
  return {
    id: attrs.id!,
    type: 'summary',
    props: {
      title: attrs.title || '',
      width: normalizeBlockWidth(attrs.width || attrs.span),
      content: rawDirectiveBody(source, node) || directiveBodyText(node),
    },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position),
  };
}
