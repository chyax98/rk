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
import { DEFAULT_THEME, THEME_NAMES, SURFACE_NAMES, validateRenderKitModel, } from '@renderkit/shared/contracts';
import { KNOWN_BLOCK_TYPES, compileBlock } from './compilers.js';
import { resolveDirective } from './alias.js';
import { ID_FORMAT, generatedBlockId } from './id.js';
import { pos, excerpt, plainText, firstHeading, diag, rangeFromOffsets, collectDirectiveIds, } from './helpers.js';
const VALID_THEMES = new Set(THEME_NAMES);
const VALID_SURFACES = new Set(SURFACE_NAMES);
export function parseRK(source, file = '<source>') {
    const errors = [];
    const warnings = [];
    let frontmatter = {};
    const fm = source.match(/^---\n([\s\S]*?)\n---\n?/);
    if (fm) {
        try {
            frontmatter = (yaml.load(fm[1]) || {});
        }
        catch (e) {
            errors.push(diag('RK_FRONTMATTER_INVALID', e.message, file, rangeFromOffsets(source, 0, fm[0].length)));
        }
    }
    let tree;
    try {
        tree = unified()
            .use(remarkParse)
            .use(remarkFrontmatter, ['yaml'])
            .use(remarkGfm)
            .use(remarkDirective)
            .parse(source);
    }
    catch (e) {
        return { ok: false, model: null, errors: [diag('RK_PARSE_ERROR', e.message, file)], warnings };
    }
    const blocks = [];
    const ids = new Map();
    const explicitDirectiveIds = collectDirectiveIds(tree);
    const generatedDirectiveIds = new Set();
    const ctx = { source, file, errors, warnings };
    let paraN = 0;
    let headingN = 0;
    for (const node of (tree.children || [])) {
        if (node.type === 'yaml')
            continue;
        if (node.type === 'heading') {
            headingN++;
            blocks.push({
                id: `heading-${headingN}`,
                type: 'heading',
                props: { level: node.depth, text: plainText(node) },
                sourceRange: pos(node),
                sourceExcerpt: excerpt(source, node.position),
            });
            continue;
        }
        if (node.type === 'paragraph') {
            const text = plainText(node).trim();
            if (!text)
                continue;
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
            const originalName = node.name;
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
            if (!ID_FORMAT.test(attrs.id)) {
                errors.push(diag('RK_BLOCK_ID_INVALID', `${originalName} block id "${attrs.id}" does not match [a-zA-Z0-9_-]+`, file, r));
                continue;
            }
            const patched = { ...node, name, attributes: attrs };
            let block;
            if (name === 'tab') {
                errors.push(diag('RK_TAB_PARENT_REQUIRED', 'tab directive is only valid inside tabs', file, r));
            }
            else {
                block = compileBlock(patched, attrs, ctx);
            }
            if (block)
                blocks.push(block);
            continue;
        }
    }
    for (const block of blocks) {
        if (ids.has(block.id)) {
            errors.push(diag('RK_DUPLICATE_BLOCK_ID', `Duplicate block id: ${block.id}`, file, block.sourceRange));
        }
        else {
            ids.set(block.id, true);
        }
    }
    let effectiveTheme = DEFAULT_THEME;
    let effectiveSurface = frontmatter.surface || undefined;
    if (frontmatter.theme) {
        if (VALID_THEMES.has(frontmatter.theme)) {
            effectiveTheme = frontmatter.theme;
        }
        else {
            warnings.push(diag('RK_THEME_UNKNOWN', `Unknown theme "${frontmatter.theme}", falling back to "${DEFAULT_THEME}"`, file));
        }
    }
    if (effectiveSurface && !VALID_SURFACES.has(effectiveSurface)) {
        warnings.push(diag('RK_SURFACE_UNKNOWN', `Unknown surface "${effectiveSurface}", using as-is but may not render as expected`, file));
    }
    const model = {
        rk: '1.0',
        title: frontmatter.title || firstHeading(blocks) || 'Untitled Artifact',
        template: frontmatter.template,
        theme: effectiveTheme,
        surface: effectiveSurface,
        blocks,
    };
    const contractIssues = validateRenderKitModel(model);
    for (const issue of contractIssues) {
        errors.push(diag('RK_MODEL_CONTRACT_INVALID', `${issue.path}: ${issue.message}`, file));
    }
    return { ok: errors.length === 0, model, errors, warnings };
}
//# sourceMappingURL=parse.js.map