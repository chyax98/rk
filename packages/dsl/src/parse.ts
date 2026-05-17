/**
 * Core parser for RenderKit .rk.md documents.
 * Orchestrates frontmatter parsing, tree walking, and block compilation.
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import yaml from 'js-yaml';
import {
  DEFAULT_THEME,
  THEME_NAMES,
  SURFACE_NAMES,
  validateRenderKitModel,
} from '@renderkit/shared/contracts';

import type { RemarkNode, CompileContext, BlockAttrs } from './types';
import { BLOCK_COMPILERS, KNOWN_BLOCK_TYPES, compileBlock } from './compilers';
import { resolveDirective } from './alias';
import { ID_FORMAT, generatedBlockId } from './id';
import {
  pos,
  excerpt,
  plainText,
  firstHeading,
  diag,
  rangeFromOffsets,
  collectDirectiveIds,
} from './helpers';

const VALID_THEMES = new Set(THEME_NAMES);
const VALID_SURFACES = new Set(SURFACE_NAMES);

export function parseRK(
  source: string,
  file = '<source>',
): import('@renderkit/shared').ParseResult {
  const errors: import('@renderkit/shared').Diagnostic[] = [];
  const warnings: import('@renderkit/shared').Diagnostic[] = [];
  let frontmatter: Record<string, unknown> = {};

  const fm = source.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fm) {
    try { frontmatter = (yaml.load(fm[1]) || {}) as Record<string, unknown>; }
    catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(diag('RK_FRONTMATTER_INVALID', msg, file, rangeFromOffsets(source, 0, fm[0].length)));
    }
  }

  let tree: RemarkNode;
  try {
    tree = unified()
      .use(remarkParse)
      .use(remarkFrontmatter, ['yaml'])
      .use(remarkGfm)
      .use(remarkDirective)
      .parse(source) as RemarkNode;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, model: null, errors: [diag('RK_PARSE_ERROR', msg, file)], warnings };
  }

  const blocks: import('@renderkit/shared').RenderKitBlock[] = [];
  const ids = new Map<string, boolean>();
  const explicitDirectiveIds = collectDirectiveIds(tree);
  const generatedDirectiveIds = new Set<string>();
  const ctx: CompileContext = { source, file, errors, warnings };
  let paraN = 0;
  let headingN = 0;

  for (const node of (tree.children || []) as RemarkNode[]) {
    if (node.type === 'yaml') continue;

    if (node.type === 'heading') {
      headingN++;
      blocks.push({
        id: `heading-${headingN}`,
        type: 'heading',
        props: { level: node.depth!, text: plainText(node) },
        sourceRange: pos(node),
        sourceExcerpt: excerpt(source, node.position),
      });
      continue;
    }

    if (node.type === 'paragraph') {
      const text = plainText(node).trim();
      if (!text) continue;
      paraN++;
      blocks.push({
        id: `paragraph-${paraN}`,
        type: 'paragraph',
        props: { markdown: text },
        sourceRange: pos(node),
        sourceExcerpt: excerpt(source, node.position),
      });
      continue;
    }

    if (node.type === 'containerDirective' || node.type === 'leafDirective') {
      const originalName = node.name!;
      const resolved = resolveDirective(originalName, node.attributes || {});
      const name = resolved.name;
      let attrs: BlockAttrs = resolved.attrs;
      const r = pos(node);

      if (!KNOWN_BLOCK_TYPES.has(name)) {
        errors.push(diag('RK_UNKNOWN_BLOCK_TYPE', `Unknown block type: ${originalName}`, file, r));
        continue;
      }
      if (!attrs.id) {
        attrs = { ...attrs, id: generatedBlockId(name, node, source, explicitDirectiveIds, generatedDirectiveIds) };
      }
      if (!ID_FORMAT.test(attrs.id!)) {
        errors.push(diag('RK_BLOCK_ID_INVALID', `${originalName} block id "${attrs.id}" does not match [a-zA-Z0-9_-]+`, file, r));
        continue;
      }

      const patched = { ...node, name, attributes: attrs };
      let block;
      if (name === 'tab') {
        errors.push(diag('RK_TAB_PARENT_REQUIRED', 'tab directive is only valid inside tabs', file, r));
      } else {
        block = compileBlock(patched, attrs, ctx);
      }
      if (block) blocks.push(block);
      continue;
    }
  }

  for (const block of blocks) {
    if (ids.has(block.id)) {
      errors.push(diag('RK_DUPLICATE_BLOCK_ID', `Duplicate block id: ${block.id}`, file, block.sourceRange));
    } else {
      ids.set(block.id, true);
    }
  }

  let effectiveTheme: string = DEFAULT_THEME;
  let effectiveSurface: string | undefined = frontmatter.surface || undefined;

  if (frontmatter.theme) {
    if (VALID_THEMES.has(frontmatter.theme)) {
      effectiveTheme = frontmatter.theme;
    } else {
      warnings.push(diag('RK_THEME_UNKNOWN', `Unknown theme "${frontmatter.theme}", falling back to "${DEFAULT_THEME}"`, file));
    }
  }
  if (effectiveSurface && !VALID_SURFACES.has(effectiveSurface)) {
    warnings.push(diag('RK_SURFACE_UNKNOWN', `Unknown surface "${effectiveSurface}", using as-is but may not render as expected`, file));
  }

  const model: import('@renderkit/shared').RenderKitModel = {
    rk: '1.0',
    title: (frontmatter.title as string | undefined) || firstHeading(blocks) || 'Untitled Artifact',
    template: frontmatter.template as string | undefined,
    theme: effectiveTheme as import('@renderkit/shared').ThemeName,
    surface: effectiveSurface as import('@renderkit/shared').SurfaceName | undefined,
    blocks,
  };

  const contractIssues = validateRenderKitModel(model);
  for (const issue of contractIssues) {
    errors.push(diag('RK_MODEL_CONTRACT_INVALID', `${issue.path}: ${issue.message}`, file));
  }

  return { ok: errors.length === 0, model, errors, warnings };
}
