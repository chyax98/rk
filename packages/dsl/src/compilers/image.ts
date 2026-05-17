import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import type { RemarkNode, BlockAttrs, CompileContext, CompiledBlock } from '../types.ts';
import { pos, excerpt, rawDirectiveBody, directiveBodyText, diag } from '../helpers.ts';

export function compileImage(
  node: RemarkNode,
  attrs: BlockAttrs,
  source: string,
  errors: CompileContext['errors'],
  file: string,
): CompiledBlock {
  if (!attrs.src) errors.push(diag('RK_IMAGE_SRC_REQUIRED', 'image directive requires src', file, pos(node)));
  const body = rawDirectiveBody(source, node) || directiveBodyText(node);
  return {
    id: attrs.id!,
    type: 'image',
    props: {
      src: attrs.src || '',
      alt: attrs.alt || attrs.title || '',
      title: attrs.title || '',
      caption: attrs.caption || body,
      aspect: attrs.aspect || '',
      width: normalizeBlockWidth(attrs.width || attrs.span || 'wide'),
    },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position),
  };
}
