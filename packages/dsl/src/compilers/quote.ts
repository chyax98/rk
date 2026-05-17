import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import type { RemarkNode, BlockAttrs, CompileContext, CompiledBlock } from '../types.ts';
import { pos, excerpt, rawDirectiveBody, directiveBodyText, diag } from '../helpers.ts';

export function compileQuote(
  node: RemarkNode,
  attrs: BlockAttrs,
  source: string,
  errors: CompileContext['errors'],
  file: string,
): CompiledBlock {
  const body = rawDirectiveBody(source, node) || directiveBodyText(node);
  if (!body) errors.push(diag('RK_QUOTE_BODY_REQUIRED', 'quote directive requires body text', file, pos(node)));
  return {
    id: attrs.id!,
    type: 'quote',
    props: {
      quote: body,
      cite: attrs.cite || attrs.by || '',
      role: attrs.role || '',
      width: normalizeBlockWidth(attrs.width || attrs.span),
    },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position),
  };
}
