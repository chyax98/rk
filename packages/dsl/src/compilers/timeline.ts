import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import {
  diag,
  directiveBodyText,
  excerpt,
  parseTimelineItems,
  pos,
  rawDirectiveBody,
} from '../helpers.ts';
import type { BlockAttrs, CompileContext, CompiledBlock, RemarkNode } from '../types.ts';

export function compileTimeline(
  node: RemarkNode,
  attrs: BlockAttrs,
  source: string,
  errors: CompileContext['errors'],
  file: string,
): CompiledBlock {
  const body = rawDirectiveBody(source, node) || directiveBodyText(node);
  const items = parseTimelineItems(body);
  if (!items.length)
    errors.push(
      diag('RK_TIMELINE_BODY_REQUIRED', 'timeline directive requires list items', file, pos(node)),
    );
  return {
    id: attrs.id!,
    type: 'timeline',
    props: {
      title: attrs.title || '',
      items,
      width: normalizeBlockWidth(attrs.width || attrs.span || 'wide'),
    },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position),
  };
}
