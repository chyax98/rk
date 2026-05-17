import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import type { RemarkNode, BlockAttrs, CompileContext, CompiledBlock } from '../types';
import { pos, excerpt, rawDirectiveBody, directiveBodyText, parseChecklistItems, diag } from '../helpers';

export function compileChecklist(
  node: RemarkNode,
  attrs: BlockAttrs,
  source: string,
  errors: CompileContext['errors'],
  file: string,
): CompiledBlock {
  const body = rawDirectiveBody(source, node) || directiveBodyText(node);
  const items = parseChecklistItems(body);
  if (!items.length) errors.push(diag('RK_CHECKLIST_BODY_REQUIRED', 'checklist directive requires list items', file, pos(node)));
  return {
    id: attrs.id!,
    type: 'checklist',
    props: { title: attrs.title || '', items, width: normalizeBlockWidth(attrs.width || attrs.span) },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position),
  };
}
