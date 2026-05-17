import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import { coerceBool, coerceEnum, parseHighlightRanges } from '../attrs';
import { validateCodeRenderer, validateCodeFrame, validateCodeCopyMode } from '../renderer-validation';
import { CODE_RENDERERS, CODE_FRAMES, CODE_COPY_MODES } from '../types';
import type { RemarkNode, BlockAttrs, CompileContext, CompiledBlock } from '../types';
import { pos, excerpt, findCode, diag } from '../helpers';

export function compileCode(
  node: RemarkNode,
  attrs: BlockAttrs,
  source: string,
  errors: CompileContext['errors'],
  file: string,
): CompiledBlock {
  const code = findCode(node);
  if (!code || !code.value) {
    errors.push(diag('RK_CODE_BODY_REQUIRED', 'code directive requires a fenced code block', file, pos(node)));
  }

  // Extended attrs for Shiki/Expressive Code style rendering
  const renderer = validateCodeRenderer(attrs.renderer);
  const frame = validateCodeFrame(attrs.frame);
  const showLineNumbers = coerceBool(attrs.showLineNumbers);
  const highlight = parseHighlightRanges(attrs.highlight);
  const diff = coerceBool(attrs.diff);
  const copyMode = validateCodeCopyMode(attrs.copyMode);

  return {
    id: attrs.id!,
    type: 'code',
    props: {
      language: attrs.language || code?.lang || '',
      title: attrs.title || '',
      code: code?.value || '',
      width: normalizeBlockWidth(attrs.width || attrs.span),
      // Extended props
      filename: attrs.filename || '',
      renderer,
      frame,
      showLineNumbers,
      highlight,
      diff,
      copyMode,
    },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position),
  };
}
