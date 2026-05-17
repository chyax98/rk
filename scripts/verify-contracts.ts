#!/usr/bin/env node
/**
 * pnpm verify:contracts — runtime drift gate for RenderKit shared contracts.
 *
 * This intentionally avoids a full repo TS migration. Stage 1 contract safety is:
 * - a typed @renderkit/shared declaration surface (.ts),
 * - runtime constants/validators,
 * - drift checks across DSL compilers, renderer registry, and fixtures.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseRK } from '../packages/dsl/src/index.ts';
import {
  BLOCK_ALIASES,
  BLOCK_TYPES,
  COMMENT_STATUSES,
  DIAGRAM_ENGINES,
  SURFACE_NAMES,
  THEME_NAMES,
  validateRenderKitModel,
  WIDE_REVIEW_SURFACES,
} from '../packages/shared/src/contracts.ts';

const root = resolve(import.meta.dirname, '..');
let pass = 0;
let fail = 0;

function assert(label, ok, detail = '') {
  if (ok) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`);
  }
}
function read(path) {
  return readFileSync(resolve(root, path), 'utf8');
}
function unique(values) {
  return [...new Set(values)].sort();
}
function arrayEq(a, b) {
  return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
}
function objectKeysFromConst(source, constName) {
  // strip type annotation before matching
  const norm = source.replace(new RegExp(`const ${constName}:[^=]+=`), `const ${constName} =`);
  const match = norm.match(new RegExp(`const\\s+${constName}\\s*=\\s*\\{([\\s\\S]*?)\\n\\};`));
  if (!match) return [];
  // match both quoted ('key':) and unquoted (key:) object keys
  const quoted = [...match[1].matchAll(/^\s*'([^']+)'\s*:/gm)].map((m) => m[1]);
  const unquoted = [...match[1].matchAll(/^\s+([a-zA-Z][a-zA-Z0-9-]*)\s*:/gm)].map((m) => m[1]);
  return unique([...quoted, ...unquoted]);
}

console.log('\n== Shared contract surface ==');
const sharedPkg = JSON.parse(read('packages/shared/package.json'));
const dslPkg = JSON.parse(read('packages/dsl/package.json'));
const blocksPkg = JSON.parse(read('packages/blocks/package.json'));
const contractsDts = read('packages/shared/src/contracts.ts');
const dslDts = read('packages/dsl/src/index.ts');
const blocksDts = read('packages/blocks/src/index.tsx');
const storeDts = read('apps/web/lib/store.ts');
const apiDts = read('apps/web/lib/api-contracts.d.ts');
const contractsMjs = read('packages/shared/src/contracts.ts');
assert('@renderkit/shared exposes package types', sharedPkg.types === './src/contracts.ts');
assert('@renderkit/shared exports ./contracts', Boolean(sharedPkg.exports?.['./contracts']));
assert('@renderkit/dsl exposes package types', dslPkg.types === './src/index.ts');
assert(
  '@renderkit/dsl exports typed parseRK',
  dslDts.includes('parseRK') && dslDts.includes('source: string'),
);
assert(
  '@renderkit/blocks exposes package types',
  ['./src/index.ts', './src/index.tsx'].includes(blocksPkg.types),
);
assert(
  '@renderkit/blocks exports typed root entry',
  ['./src/index.ts', './src/index.tsx'].includes(blocksPkg.exports?.['.']?.types),
);
assert(
  '@renderkit/blocks declares renderer registry boundary',
  ['RenderBlockProps', 'RenderKitRegistry', 'registry', 'RenderBlock'].every((name) =>
    blocksDts.includes(name),
  ),
);
assert(
  '@renderkit/blocks typed boundary uses shared block contract',
  blocksDts.includes('RenderKitBlock') && blocksDts.includes('BlockType'),
);
assert(
  'Store exposes typed boundary for artifact/comment/feedback functions',
  ['createArtifact', 'addRevision', 'addComment', 'updateCommentStatus', 'getFeedback'].every(
    (name) => storeDts.includes(`function ${name}`),
  ),
);
// store.ts uses its own interface names: ArtifactMeta, Comment, TextQuoteSelector
assert(
  'Store typed boundary uses shared contracts',
  ['ArtifactMeta', 'Comment', 'TextQuoteSelector', 'validateTextQuoteSelector'].every((name) =>
    storeDts.includes(name),
  ),
);
assert(
  'API contracts declare core request/response payloads',
  ['CreateArtifactRequest', 'AddRevisionRequest', 'AddCommentRequest', 'FeedbackResponse'].every(
    (name) => apiDts.includes(name),
  ),
);
for (const symbol of [
  'RenderKitModel',
  'RenderKitBlock',
  'SourceRange',
  'Diagnostic',
  'ArtifactComment',
  'FeedbackPayload',
  'TextQuoteSelector',
]) {
  assert(`contracts.ts declares ${symbol}`, contractsDts.includes(symbol));
}
for (const list of [
  BLOCK_TYPES,
  THEME_NAMES,
  SURFACE_NAMES,
  COMMENT_STATUSES,
  DIAGRAM_ENGINES,
  WIDE_REVIEW_SURFACES,
]) {
  assert(`contract list has unique values (${list[0]}...)`, list.length === new Set(list).size);
}
assert(
  'runtime validator is exported',
  contractsMjs.includes('export function validateRenderKitModel'),
);
assert('shared aliases include Agent shorthand metric→stat', BLOCK_ALIASES.metric?.name === 'stat');
assert(
  'shared diagram engines include ECharts shorthand variants',
  ['echarts-bar', 'echarts-line', 'echarts-pie'].every((x) => DIAGRAM_ENGINES.includes(x)),
);

console.log('\n== DSL / renderer drift ==');
const dslSource = read('packages/dsl/src/index.ts');
const dslParseSource = read('packages/dsl/src/parse.ts');
const dslCompilersSource = read('packages/dsl/src/compilers/index.ts');
const dslAliasSource = read('packages/dsl/src/alias.ts');
const dslDiagramSource = read('packages/dsl/src/compilers/diagram.ts');
const dslAllSource = dslSource + dslParseSource + dslCompilersSource + dslAliasSource + dslDiagramSource;
const rendererSource = read('packages/blocks/src/registry.tsx');
const compilerTypes = objectKeysFromConst(dslCompilersSource, 'BLOCK_COMPILERS');
const rendererTypes = unique([
  ...[...rendererSource.matchAll(/^\s*'([^']+)'\s*:/gm)].map(m => m[1]),
  ...[...rendererSource.matchAll(/^\s+([a-zA-Z][a-zA-Z0-9-]*)\s*:/gm)].map(m => m[1]).filter(k => !['import','export','const','let','var','type','return','default'].includes(k)),
]);
const authoredDirectiveTypes = BLOCK_TYPES.filter(
  (t) => !['heading', 'paragraph'].includes(t),
).sort();
assert(
  'DSL compiler keys match authorable block contracts',
  arrayEq(compilerTypes, authoredDirectiveTypes),
  `compiler=${compilerTypes.join(',')} contract=${authoredDirectiveTypes.join(',')}`,
);
assert(
  'Renderer registry keys match block contracts',
  arrayEq(rendererTypes, BLOCK_TYPES),
  `renderer=${rendererTypes.join(',')} contract=${BLOCK_TYPES.join(',')}`,
);
assert(
  'DSL imports shared theme/surface contracts',
  dslAllSource.includes('@renderkit/shared/contracts'),
);
assert(
  'DSL resolves aliases through shared contracts',
  dslAllSource.includes('resolveBlockAlias(name, attrs)'),
);
assert(
  'DSL validates diagram engines through shared contracts',
  dslAllSource.includes('isKnownDiagramEngine(engine)'),
);
assert(
  'DSL validates model against shared contract',
  dslAllSource.includes('validateRenderKitModel(model)'),
);
const artifactViewSource = read('apps/web/app/a/[id]/ArtifactView.tsx');
assert(
  'Web review surface logic imports shared contract helper',
  artifactViewSource.includes('@renderkit/shared/contracts') &&
    artifactViewSource.includes('isWideReviewSurface(surface)'),
);
const gallery = JSON.parse(read('examples/gallery.json'));
const gallerySurfaces = unique((gallery.surfaces || []).map((s) => s.id));
assert('Gallery surfaces match shared surface contracts', arrayEq(gallerySurfaces, SURFACE_NAMES));
const recipes = await import('../packages/shared/src/index.ts');
assert(
  'Every shared surface has a recipe',
  SURFACE_NAMES.every((surface) => Boolean(recipes.getRecipe(surface))),
);
const storeSource = read('apps/web/lib/store.ts');
assert(
  'Store comment lifecycle imports shared status contracts',
  storeSource.includes('COMMENT_STATUSES') && storeSource.includes('@renderkit/shared/contracts'),
);
assert(
  'Store selector normalization uses shared selector contract',
  storeSource.includes('validateTextQuoteSelector'),
);
const artifactRouteSource = read('apps/web/app/api/artifacts/[id]/route.ts');
assert(
  'Artifact status route uses shared comment status contracts',
  artifactRouteSource.includes('COMMENT_STATUSES') && artifactRouteSource.includes('COMMENT_OPEN'),
);

console.log('\n== Example model contract validation ==');
const examples = [
  'examples/alpha-showcase.rk.md',
  'examples/capabilities/product-system.rk.md',
  'examples/capabilities/rich-media-tabs.rk.md',
  'examples/capabilities/editorial-components.rk.md',
  'examples/capabilities/narrative-blocks.rk.md',
  'examples/capabilities/diagram-visual-language.rk.md',
  'examples/surfaces/proposal.rk.md',
  'examples/surfaces/documentation.rk.md',
];
for (const file of examples) {
  const result = parseRK(read(file), file);
  assert(`${file}: parses`, result.ok === true, result.errors?.map((e) => e.code).join(','));
  const issues = validateRenderKitModel(result.model);
  assert(
    `${file}: model satisfies shared contract`,
    issues.length === 0,
    issues.map((i) => `${i.path} ${i.message}`).join('; '),
  );
}

console.log('\n== Fixture coverage signal ==');
const fixtureSources = examples.map(read).join('\n');
const coverageAliases = {
  summary: ['sum'],
  callout: ['note', 'warn', 'alert', 'ok'],
  'decision-card': ['dec'],
  diagram: ['fig'],
  code: ['src'],
  stat: ['metric'],
  checklist: ['todo'],
  comparison: ['compare'],
  timeline: ['roadmap'],
};
for (const type of authoredDirectiveTypes) {
  const aliases = coverageAliases[type] || [];
  const covered = [type, ...aliases].some((name) =>
    new RegExp(`:{3,5}${name}(?:[\\{\\n])`).test(fixtureSources),
  );
  assert(`fixtures cover authorable block ${type}`, covered);
}

console.log('\n========================================');
console.log(`Results: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
console.log('ALL GOOD');
