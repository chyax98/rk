/**
 * RenderKit DSL parser — main entry point.
 * Parses .rk.md source into a validated RenderKit model.
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
  normalizeBlockWidth,
} from '@renderkit/shared/contracts';
import type { SourceRange, Diagnostic, RenderKitModel } from '@renderkit/shared';
import type { RemarkNode, BlockAttrs, CompileContext } from './types';
import {
  pos,
  excerpt,
  rangeFromOffsets,
  plainText,
  collectDirectiveIds,
  walkNodes,
  firstHeading,
  diag,
} from './helpers';
import { generatedBlockId, slugId, ID_FORMAT } from './id';
import { resolveDirective } from './alias';
import { BLOCK_COMPILERS, KNOWN_BLOCK_TYPES, compileBlock } from './compilers';

// Re-export for consumers that import from the package root
export { parseRK };

const VALID_THEMES = new Set(THEME_NAMES);
const VALID_SURFACES = new Set(SURFACE_NAMES);

/**
 * Parse a RenderKit .rk.md source string into a validated model.
 */
function parseRK(
  source: string,
  file = '<source>',
): { ok: boolean; model: RenderKitModel | null; errors: Diagnostic[]; warnings: Diagnostic[] } {
  const errors: Diagnostic[] = [];
  const warnings: Diagnostic[] = [];
    let frontmatter: Record<string, unknown> = {};

    const fm = source.match(/^---\n([\s\S]*?)\n---\n?/);
    if (fm) {
      try {
        frontmatter = (yaml.load(fm[1]) || {}) as Record<string, unknown>;
      } catch (e: unknown) {
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
      .parse(source) as unknown as RemarkNode;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, model: null, errors: [diag('RK_PARSE_ERROR', msg, file)], warnings };
  }

  const blocks: any[] = [];
  const ids = new Map<string, unknown>();
  const explicitDirectiveIds = collectDirectiveIds(tree);
  const generatedDirectiveIds = new Set<string>();
  const ctx: CompileContext = { source, file, errors, warnings };

  let paraN = 0;
  let headingN = 0;

  for (const node of tree.children || []) {
    // Skip YAML frontmatter node
    if (node.type === 'yaml') continue;

    // Headings
    if (node.type === 'heading') {
      headingN++;
      blocks.push({
        id: `heading-${headingN}`,
        type: 'heading',
        props: { level: node.depth || 1, text: plainText(node) },
        sourceRange: pos(node),
        sourceExcerpt: excerpt(source, node.position),
      });
      continue;
    }

    // Paragraphs
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

    // Directives (containerDirective or leafDirective)
    if (node.type === 'containerDirective' || node.type === 'leafDirective') {
      const originalName = node.name!;
      const resolved = resolveDirective(originalName, node.attributes || {});
      const name = resolved.name;
      let attrs = resolved.attrs;
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

  // Duplicate ID check
  for (const block of blocks) {
    const bid = block.id as string;
    if (ids.has(bid)) {
      errors.push(diag('RK_DUPLICATE_BLOCK_ID', `Duplicate block id: ${bid}`, file, block.sourceRange as SourceRange));
    } else {
      ids.set(bid, block);
    }
  }

  // Theme and surface validation
  let effectiveTheme = (frontmatter.theme as string | null) || null;
  let effectiveSurface = (frontmatter.surface as string | null) || null;

  if (effectiveTheme && !VALID_THEMES.has(effectiveTheme as any)) {
    warnings.push(diag('RK_THEME_UNKNOWN', `Unknown theme "${effectiveTheme}", falling back to "${DEFAULT_THEME}"`, file));
    effectiveTheme = DEFAULT_THEME;
  }
  if (effectiveSurface && !VALID_SURFACES.has(effectiveSurface as any)) {
    warnings.push(diag('RK_SURFACE_UNKNOWN', `Unknown surface "${effectiveSurface}", using as-is but may not render as expected`, file));
  }

  const model: RenderKitModel = {
    rk: '1.0' as const,
    title: (frontmatter.title as string | undefined) || firstHeading(blocks) || 'Untitled Artifact',
    template: frontmatter.template as string | undefined,
    theme: (effectiveTheme || DEFAULT_THEME) as any,
    surface: effectiveSurface as any,
    blocks: blocks as any,
  };

  const contractIssues = validateRenderKitModel(model);
  for (const issue of contractIssues) {
    errors.push(diag('RK_MODEL_CONTRACT_INVALID', `${issue.path}: ${issue.message}`, file));
  }

  return { ok: errors.length === 0, model, errors, warnings };
}
