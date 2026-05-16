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
function read(path) { return readFileSync(resolve(root, path), 'utf8'); }
function assert(label, ok, detail = '') {
  if (ok) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); }
}

console.log('\n== Recipe CLI ==');
const recipes = runJson('node packages/cli/bin/renderkit.mjs recipes list --json');
assert('recipes list ok=true', recipes.ok === true);
assert('recipes list exposes five surfaces', recipes.surfaces?.length === 5, `got ${recipes.surfaces?.length}`);
assert('recipes include engineering-plan', recipes.surfaces?.some(r => r.surface === 'engineering-plan'));
const engineering = runJson('node packages/cli/bin/renderkit.mjs recipes show engineering-plan --json');
assert('recipe show engineering-plan ok=true', engineering.ok === true);
assert('engineering-plan recommends diagram/code/reviewable blocks', ['summary', 'code', 'diagram'].every(b => engineering.recipe?.recommendedBlocks?.includes(b)));

console.log('\n== Design resources CLI ==');
const resources = runJson('node packages/cli/bin/renderkit.mjs design resources --json');
assert('design resources ok=true', resources.ok === true);
assert('design resources expose six cloned assets', resources.resources?.length === 6, `got ${resources.resources?.length}`);
assert('design resources are priority sorted', resources.resources?.slice(0, 2).every(r => r.priority === 'P0'));
for (const id of ['md2html', 'html-anything', 'fireworks-tech-graph', 'thesvg', 'ui-ux-pro-max-skill', 'guizang-ppt-skill']) {
  assert(`design resources include ${id}`, resources.resources?.some(r => r.id === id));
}
const md2html = runJson('node packages/cli/bin/renderkit.mjs design resource md2html --json');
assert('design resource md2html ok=true', md2html.ok === true);
assert('md2html exposes local path and commit', Boolean(md2html.resource?.localPath && md2html.resource?.commit));
assert('md2html records integration status', md2html.resource?.integrationStatus === 'partially-integrated');
const p0 = runJson('node packages/cli/bin/renderkit.mjs design resources --priority P0 --json');
assert('priority filter returns only P0', p0.resources?.length === 2 && p0.resources.every(r => r.priority === 'P0'), `got ${JSON.stringify(p0.resources?.map(r => r.priority))}`);

console.log('\n== Authoring skill ==');
const skill = read('skills/renderkit-authoring/SKILL.md');
for (const alias of ['sum', 'metric', 'todo', 'compare', 'roadmap']) {
  assert(`authoring skill documents alias ${alias}`, skill.includes(`\`${alias}\``));
}
for (const command of ['renderkit recipes list', 'renderkit design resources', 'renderkit feedback']) {
  assert(`authoring skill documents CLI command: ${command}`, skill.includes(command));
}

console.log('\n========================================');
console.log(`Results: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
console.log('ALL GOOD');
