#!/usr/bin/env node
/**
 * pnpm verify:agent — Agent-facing CLI and authoring skill regression checks.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
let pass = 0;
let fail = 0;

function runJson(cmd) {
  const stdout = execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return JSON.parse(stdout);
}
function read(path) {
  return readFileSync(resolve(root, path), 'utf8');
}
function assert(label, ok, detail = '') {
  if (ok) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`);
  }
}

console.log('\n== Recipe CLI ==');
const recipes = runJson('node packages/cli/bin/renderkit.mjs recipes list --json');
assert('recipes list ok=true', recipes.ok === true);
assert(
  'recipes list exposes seven surfaces',
  recipes.surfaces?.length === 7,
  `got ${recipes.surfaces?.length}`,
);
assert(
  'recipes include engineering-plan',
  recipes.surfaces?.some((r) => r.surface === 'engineering-plan'),
);
const engineering = runJson(
  'node packages/cli/bin/renderkit.mjs recipes show engineering-plan --json',
);
assert('recipe show engineering-plan ok=true', engineering.ok === true);
assert(
  'engineering-plan recommends rich reviewable blocks',
  ['summary', 'stat', 'checklist', 'code', 'diagram', 'table', 'timeline'].every((b) =>
    engineering.recipe?.recommendedBlocks?.includes(b),
  ),
);
const surfaces = runJson('node packages/cli/bin/renderkit.mjs surfaces --json');
assert(
  'surfaces command exposes seven supported surfaces',
  surfaces.surfaces?.length === 7,
  `got ${surfaces.surfaces?.length}`,
);
assert(
  'surfaces include proposal and documentation recipes',
  ['proposal', 'documentation'].every((s) =>
    surfaces.surfaces?.some((x) => x.surface === s && x.recipe),
  ),
);
const themes = runJson('node packages/cli/bin/renderkit.mjs themes --json');
assert(
  'themes command exposes four themes',
  themes.themes?.length === 4,
  `got ${themes.themes?.length}`,
);
assert('themes command has no duplicates', new Set(themes.themes).size === themes.themes.length);
const blocks = runJson('node packages/cli/bin/renderkit.mjs blocks --json');
assert(
  'blocks command exposes block types',
  blocks.blocks?.includes('summary') && blocks.blocks?.includes('timeline'),
);
const aliases = runJson('node packages/cli/bin/renderkit.mjs aliases --json');
assert(
  'aliases command exposes metric/todo aliases',
  aliases.aliases?.metric?.name === 'stat' && aliases.aliases?.todo?.name === 'checklist',
);
const errors = runJson('node packages/cli/bin/renderkit.mjs errors --json');
assert(
  'errors command exposes duplicate block id code',
  errors.errors?.RK_DUPLICATE_BLOCK_ID === 'RK_DUPLICATE_BLOCK_ID',
);

console.log('\n== Design resources CLI ==');
const resources = runJson('node packages/cli/bin/renderkit.mjs design resources --json');
assert('design resources ok=true', resources.ok === true);
assert(
  'design resources expose six cloned assets',
  resources.resources?.length === 6,
  `got ${resources.resources?.length}`,
);
assert(
  'design resources are priority sorted',
  resources.resources?.slice(0, 2).every((r) => r.priority === 'P0'),
);
for (const id of [
  'md2html',
  'html-anything',
  'fireworks-tech-graph',
  'thesvg',
  'ui-ux-pro-max-skill',
  'guizang-ppt-skill',
]) {
  assert(
    `design resources include ${id}`,
    resources.resources?.some((r) => r.id === id),
  );
}
const md2html = runJson('node packages/cli/bin/renderkit.mjs design resource md2html --json');
assert('design resource md2html ok=true', md2html.ok === true);
assert(
  'md2html exposes local path and commit',
  Boolean(md2html.resource?.localPath && md2html.resource?.commit),
);
assert(
  'md2html records integration status',
  md2html.resource?.integrationStatus === 'partially-integrated',
);
const p0 = runJson('node packages/cli/bin/renderkit.mjs design resources --priority P0 --json');
assert(
  'priority filter returns only P0',
  p0.resources?.length === 2 && p0.resources.every((r) => r.priority === 'P0'),
  `got ${JSON.stringify(p0.resources?.map((r) => r.priority))}`,
);
const recommendation = runJson(
  'node packages/cli/bin/renderkit.mjs design recommend --surface documentation --json',
);
assert('design recommend documentation ok=true', recommendation.ok === true);
assert(
  'design recommend returns recipe theme and blocks',
  recommendation.recommendation?.theme === 'editorial-kami' &&
    recommendation.recommendation?.blocks?.includes('quote'),
);
assert(
  'design recommend includes prioritized design resources',
  recommendation.recommendation?.designResources?.some((r) => r.id === 'md2html') &&
    recommendation.recommendation?.designResources?.some((r) => r.id === 'html-anything'),
);
assert(
  'design recommend includes thesvg only as risk-visible reference for diagram surfaces',
  recommendation.recommendation?.designResources?.some(
    (r) => r.id === 'thesvg' && r.risks?.some((x) => x.includes('商标')),
  ),
);
assert(
  'design recommend includes suggested frontmatter',
  recommendation.recommendation?.suggestedFrontmatter?.surface === 'documentation' &&
    recommendation.recommendation?.suggestedFrontmatter?.theme === 'editorial-kami',
);
assert(
  'design recommend includes suggested block order with aliases',
  recommendation.recommendation?.suggestedBlockOrder?.some((b) => b.blockType === 'quote'),
);
assert(
  'design recommend includes Agent validation commands',
  recommendation.recommendation?.validation?.includes('renderkit validate <file> --json'),
);

console.log('\n== Authoring skill ==');
const skill = read('skills/renderkit-authoring/SKILL.md');
for (const alias of ['sum', 'metric', 'todo', 'compare', 'roadmap']) {
  assert(`authoring skill documents alias ${alias}`, skill.includes(`\`${alias}\``));
}
for (const command of [
  'renderkit recipes list',
  'renderkit design resources',
  'renderkit design recommend',
  'renderkit surfaces',
  'renderkit blocks',
  'renderkit aliases',
  'renderkit errors',
  'renderkit feedback',
]) {
  assert(`authoring skill documents CLI command: ${command}`, skill.includes(command));
}

console.log('\n========================================');
console.log(`Results: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
console.log('ALL GOOD');
