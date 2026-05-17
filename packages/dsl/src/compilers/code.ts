import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import { coerceBool, coerceEnum, parseHighlightRanges } from '../attrs.ts';
import { diag, excerpt, findCode, pos } from '../helpers.ts';
import {
  validateCodeCopyMode,
  validateCodeFrame,
  validateCodeRenderer,
} from '../renderer-validation.ts';
import type { BlockAttrs, CompileContext, CompiledBlock, RemarkNode } from '../types.ts';
import { CODE_COPY_MODES, CODE_FRAMES, CODE_RENDERERS } from '../types.ts';

export function compileCode(
  node: RemarkNode,
  attrs: BlockAttrs,
  source: string,
  errors: CompileContext['errors'],
  file: string,
): CompiledBlock {
  const code = findCode(node);
  if (!code || !code.value) {
    errors.push(
      diag('RK_CODE_BODY_REQUIRED', 'code directive requires a fenced code block', file, pos(node)),
    );
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
