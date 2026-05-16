#!/usr/bin/env node
/**
 * pnpm verify:contracts — runtime drift gate for RenderKit shared contracts.
 *
 * This intentionally avoids a full repo TS migration. Stage 1 contract safety is:
 * - a typed @renderkit/shared declaration surface (.d.ts),
 * - runtime constants/validators,
 * - drift checks across DSL compilers, renderer registry, and fixtures.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BLOCK_TYPES, THEME_NAMES, SURFACE_NAMES, COMMENT_STATUSES, DIAGRAM_ENGINES, BLOCK_ALIASES, WIDE_REVIEW_SURFACES, validateRenderKitModel } from '../packages/shared/src/contracts.mjs';
import { parseRK } from '../packages/dsl/src/index.mjs';

const root = resolve(import.meta.dirname, '..');
let pass = 0;
let fail = 0;

function assert(label, ok, detail = '') {
  if (ok) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); }
}
function read(path) { return readFileSync(resolve(root, path), 'utf8'); }
function unique(values) { return [...new Set(values)].sort(); }
function arrayEq(a, b) { return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort()); }
function objectKeysFromConst(source, constName) {
  const match = source.match(new RegExp(`const\\s+${constName}\\s*=\\s*\\{([\\s\\S]*?)\\n\\};`));
  if (!match) return [];
  return unique([...match[1].matchAll(/^\s*'([^']+)'\s*:/gm)].map(m => m[1]));
}

console.log('\n== Shared contract surface ==');
const sharedPkg = JSON.parse(read('packages/shared/package.json'));
const contractsDts = read('packages/shared/src/contracts.d.ts');
const contractsMjs = read('packages/shared/src/contracts.mjs');
assert('@renderkit/shared exposes package types', sharedPkg.types === './src/contracts.d.ts');
assert('@renderkit/shared exports ./contracts', Boolean(sharedPkg.exports?.['./contracts']));
for (const symbol of ['RenderKitModel', 'RenderKitBlock', 'SourceRange', 'Diagnostic', 'ArtifactComment', 'FeedbackPayload', 'TextQuoteSelector']) {
  assert(`contracts.d.ts declares ${symbol}`, contractsDts.includes(symbol));
}
for (const list of [BLOCK_TYPES, THEME_NAMES, SURFACE_NAMES, COMMENT_STATUSES, DIAGRAM_ENGINES, WIDE_REVIEW_SURFACES]) {
  assert(`contract list has unique values (${list[0]}...)`, list.length === new Set(list).size);
}
assert('runtime validator is exported', contractsMjs.includes('export function validateRenderKitModel'));
assert('shared aliases include Agent shorthand metric→stat', BLOCK_ALIASES.metric?.name === 'stat');
assert('shared diagram engines include ECharts shorthand variants', ['echarts-bar', 'echarts-line', 'echarts-pie'].every(x => DIAGRAM_ENGINES.includes(x)));

console.log('\n== DSL / renderer drift ==');
const dslSource = read('packages/dsl/src/index.mjs');
const rendererSource = read('packages/blocks/src/registry.jsx');
const compilerTypes = objectKeysFromConst(dslSource, 'BLOCK_COMPILERS');
const rendererTypes = unique([...rendererSource.matchAll(/^\s*'([^']+)'\s*:/gm)].map(m => m[1]));
const authoredDirectiveTypes = BLOCK_TYPES.filter(t => !['heading', 'paragraph'].includes(t)).sort();
assert('DSL compiler keys match authorable block contracts', arrayEq(compilerTypes, authoredDirectiveTypes), `compiler=${compilerTypes.join(',')} contract=${authoredDirectiveTypes.join(',')}`);
assert('Renderer registry keys match block contracts', arrayEq(rendererTypes, BLOCK_TYPES), `renderer=${rendererTypes.join(',')} contract=${BLOCK_TYPES.join(',')}`);
assert('DSL imports shared theme/surface contracts', dslSource.includes("@renderkit/shared/contracts"));
assert('DSL resolves aliases through shared contracts', dslSource.includes('resolveBlockAlias(name, attrs)'));
assert('DSL validates diagram engines through shared contracts', dslSource.includes('isKnownDiagramEngine(engine)'));
assert('DSL validates model against shared contract', dslSource.includes('validateRenderKitModel(model)'));
const artifactViewSource = read('apps/web/app/a/[id]/ArtifactView.jsx');
assert('Web review surface logic imports shared contract helper', artifactViewSource.includes("@renderkit/shared/contracts") && artifactViewSource.includes('isWideReviewSurface(surface)'));
const storeSource = read('apps/web/lib/store.mjs');
assert('Store comment lifecycle imports shared status contracts', storeSource.includes('COMMENT_STATUSES') && storeSource.includes("@renderkit/shared/contracts"));
assert('Store selector normalization uses shared selector contract', storeSource.includes('validateTextQuoteSelector'));

console.log('\n== Example model contract validation ==');
const examples = [
  'examples/alpha-showcase.rk.md',
  'examples/capabilities/product-system.rk.md',
  'examples/capabilities/rich-media-tabs.rk.md',
  'examples/capabilities/editorial-components.rk.md',
  'examples/capabilities/narrative-blocks.rk.md',
  'examples/capabilities/diagram-visual-language.rk.md',
];
for (const file of examples) {
  const result = parseRK(read(file), file);
  assert(`${file}: parses`, result.ok === true, result.errors?.map(e => e.code).join(','));
  const issues = validateRenderKitModel(result.model);
  assert(`${file}: model satisfies shared contract`, issues.length === 0, issues.map(i => `${i.path} ${i.message}`).join('; '));
}

console.log('\n== Fixture coverage signal ==');
const fixtureSources = examples.map(read).join('\n');
const coverageAliases = {
  'summary': ['sum'],
  'callout': ['note', 'warn', 'alert', 'ok'],
  'decision-card': ['dec'],
  'diagram': ['fig'],
  'code': ['src'],
  'stat': ['metric'],
  'checklist': ['todo'],
  'comparison': ['compare'],
  'timeline': ['roadmap'],
};
for (const type of authoredDirectiveTypes) {
  const aliases = coverageAliases[type] || [];
  const covered = [type, ...aliases].some(name => new RegExp(`:{3,5}${name}(?:[\\{\\n])`).test(fixtureSources));
  assert(`fixtures cover authorable block ${type}`, covered);
}

console.log('\n========================================');
console.log(`Results: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
console.log('ALL GOOD');
