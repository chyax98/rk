import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import type { RemarkNode, BlockAttrs, CompileContext, CompiledBlock } from '../types';
import { pos, excerpt, rawDirectiveBody, directiveBodyText, diag } from '../helpers';

export function compileStat(
  node: RemarkNode,
  attrs: BlockAttrs,
  source: string,
  errors: CompileContext['errors'],
  file: string,
): CompiledBlock {
  const body = rawDirectiveBody(source, node) || directiveBodyText(node);
  const value = attrs.value || attrs.metric || '';
  if (!value) errors.push(diag('RK_STAT_VALUE_REQUIRED', 'stat directive requires value', file, pos(node)));
  return {
    id: attrs.id!,
    type: 'stat',
    props: {
      label: attrs.label || attrs.title || '',
      value,
      delta: attrs.delta || '',
      tone: attrs.tone || 'neutral',
      caption: attrs.caption || body,
      width: normalizeBlockWidth(attrs.width || attrs.span),
    },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position),
  };
}
