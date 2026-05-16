#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseRK } from '@renderkit/dsl';
import { getRecipe, listRecipeSurfaces, listDesignResources, getDesignResource, listDesignResourcePriorities } from '@renderkit/shared';

const program = new Command();
program.name('renderkit').description('Local Agent artifact renderer').version('0.0.1');

program.command('validate <file>').option('--json', 'json output').action(async (file, opts) => {
  const source = await fs.readFile(file, 'utf8');
  const result = parseRK(source, file);
  output(result, opts.json);
  process.exit(result.ok ? 0 : 1);
});

program.command('push <file>').option('--open', 'open browser').option('--json', 'json output').option('--resolve <ids>', 'comma separated comment ids').action(async (file, opts) => {
  const source = await fs.readFile(file, 'utf8');
  const validation = parseRK(source, file);
  if (!validation.ok) { output(validation, opts.json); process.exit(1); }
  const endpoint = getEndpoint();
  const lock = await readLock(file);
  const resolvedCommentIds = opts.resolve ? opts.resolve.split(',').map(s => s.trim()).filter(Boolean) : [];
  const url = lock?.artifactId ? `${endpoint}/api/artifacts/${lock.artifactId}/revisions` : `${endpoint}/api/artifacts`;
  const body = lock?.artifactId ? { source, resolvedCommentIds } : { source, title: validation.model.title };
  let res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  let json = await res.json();
  if ((!res.ok || !json.ok) && lock?.artifactId && JSON.stringify(json).includes('RK_ARTIFACT_NOT_FOUND')) {
    res = await fetch(`${endpoint}/api/artifacts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ source, title: validation.model.title }) });
    json = await res.json();
  }
  if (!res.ok || !json.ok) { output(json, opts.json); process.exit(1); }
  const artifactId = json.artifactId;
  await writeLock(file, { artifactId, url: json.url, lastRevision: json.revision, endpoint });

  const result = { ok: true, artifactId, revision: json.revision, url: json.url, diff: json.diff, resolved: json.resolved || [] };
  output(result, opts.json);

  if (opts.open && json.url) {
    try { openUrl(json.url); } catch (_e) { /* browser open failure is non-fatal */ }
  }
});

program.command('status <target>').option('--json', 'json output').action(async (target, opts) => {
  const endpoint = getEndpoint();
  const id = target.endsWith('.md') || target.endsWith('.rk') ? (await readLock(target))?.artifactId : target;
  if (!id) { output({ ok: false, error: 'No artifact lock found' }, opts.json); process.exit(1); }
  const res = await fetch(`${endpoint}/api/artifacts/${id}`);
  const json = await res.json();
  output(json, opts.json);
  process.exit(res.ok ? 0 : 1);
});

program.command('feedback <target>').option('--json', 'json output').action(async (target, opts) => {
  const endpoint = getEndpoint();
  const id = target.endsWith('.md') || target.endsWith('.rk') ? (await readLock(target))?.artifactId : target;
  if (!id) { output({ ok: false, error: 'No artifact lock found' }, opts.json); process.exit(1); }
  const res = await fetch(`${endpoint}/api/artifacts/${id}/feedback`);
  const json = await res.json();
  output(json, opts.json);
  process.exit(res.ok ? 0 : 1);
});

const recipes = program.command('recipes').description('inspect Agent authoring recipes');
recipes.command('list').option('--json', 'json output').action((opts) => {
  const surfaces = listRecipeSurfaces().map(surface => ({ surface, ...getRecipe(surface) }));
  output({ ok: true, surfaces }, opts.json);
});
recipes.command('show <surface>').option('--json', 'json output').action((surface, opts) => {
  const recipe = getRecipe(surface);
  if (!recipe) { output({ ok: false, error: `Unknown recipe surface: ${surface}`, surfaces: listRecipeSurfaces() }, opts.json); process.exit(1); }
  output({ ok: true, surface, recipe }, opts.json);
});

const design = program.command('design').description('inspect local design resource assets');
design.command('resources').option('--json', 'json output').option('--priority <priority>', 'filter priority, e.g. P0/P1/P2').action((opts) => {
  output({ ok: true, priorities: listDesignResourcePriorities(), resources: listDesignResources({ priority: opts.priority }) }, opts.json);
});
design.command('resource <id>').option('--json', 'json output').action((id, opts) => {
  const resource = getDesignResource(id);
  if (!resource) { output({ ok: false, error: `Unknown design resource: ${id}`, resources: listDesignResources().map(r => r.id) }, opts.json); process.exit(1); }
  output({ ok: true, resource }, opts.json);
});

const server = program.command('server').description('manage local RenderKit server');
server.command('start').option('--port <port>', 'port', '3737').action(async (opts) => {
  const root = repoRoot();
  const child = spawn('pnpm', ['--filter', '@renderkit/web', 'dev', '--', '-p', String(opts.port)], { cwd: root, stdio: 'inherit' });
  child.on('exit', code => process.exit(code ?? 0));
});
server.command('status').option('--json', 'json output').action(async (opts) => {
  const endpoint = getEndpoint();
  try {
    const res = await fetch(`${endpoint}/api/health`);
    const json = await res.json();
    output({ ok: res.ok, endpoint, ...json }, opts.json);
    process.exit(res.ok ? 0 : 1);
  } catch (e) {
    output({ ok: false, endpoint, error: String(e.message || e) }, opts.json);
    process.exit(2);
  }
});

program.parseAsync().catch(e => { console.error(e); process.exit(2); });

function getEndpoint() { return process.env.RENDERKIT_ENDPOINT || 'http://localhost:3737'; }
function lockPath(file) { const p = path.resolve(file); return path.join(path.dirname(p), `.${path.basename(p).replace(/\.(rk\.)?md$/, '')}.rk.lock.json`); }
async function readLock(file) { try { return JSON.parse(await fs.readFile(lockPath(file), 'utf8')); } catch { return null; } }
async function writeLock(file, data) { await fs.writeFile(lockPath(file), JSON.stringify(data, null, 2)); }
function output(obj, forceJson) { if (forceJson || !process.stdout.isTTY) console.log(JSON.stringify(obj, null, 2)); else pretty(obj); }
function pretty(obj) { if (obj.ok === false) { console.error('RenderKit error'); console.error(JSON.stringify(obj, null, 2)); return; } console.log(JSON.stringify(obj, null, 2)); }
function openUrl(url) { const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open'; const args = process.platform === 'win32' ? ['/c', 'start', url] : [url]; const child = spawn(cmd, args, { detached: true, stdio: 'ignore' }); child.on('error', () => { /* opener missing — non-fatal */ }); child.unref(); }

function repoRoot() { return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'); }
