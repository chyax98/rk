import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import { validateTableProfile, validateTableRenderer } from '../renderer-validation.ts';
import type { RemarkNode, BlockAttrs, CompileContext, CompiledBlock } from '../types.ts';
import { pos, excerpt, rawDirectiveBody, directiveBodyText, parsePipeTable, diag } from '../helpers.ts';

export function compileTable(
  node: RemarkNode,
  attrs: BlockAttrs,
  source: string,
  errors: CompileContext['errors'],
  file: string,
): CompiledBlock {
  const body = rawDirectiveBody(source, node) || directiveBodyText(node);
  const parsed = parsePipeTable(body);
  if (!parsed.headers.length || !parsed.rows.length) {
    errors.push(diag('RK_TABLE_BODY_REQUIRED', 'table directive requires a GitHub-flavored Markdown table body', file, pos(node)));
  }

  // Profile and renderer validation
  const { profile: resolvedProfile, forced } = validateTableProfile(attrs.profile, parsed.headers.length);
  const renderer = validateTableRenderer(attrs.renderer);

  if (forced) {
    // Emit warning when columns exceed limit and profile is forced to cards
    // Note: we use the errors array as warnings for now; proper warning support
    // would use ctx.warnings
  }

  return {
    id: attrs.id!,
    type: 'table',
    props: {
      title: attrs.title || '',
      caption: attrs.caption || '',
      width: normalizeBlockWidth(attrs.width || attrs.span || 'wide'),
      columns: parsed.headers,
      rows: parsed.rows,
      align: parsed.align,
      // Extended props
      profile: resolvedProfile,
      renderer,
    },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position),
  };
}
