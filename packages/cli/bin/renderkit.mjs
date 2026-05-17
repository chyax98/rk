#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseRK } from '@renderkit/dsl';
import { BLOCK_TYPES, THEME_NAMES, SURFACE_NAMES, BLOCK_ALIASES, ERROR_CODES, getRecipe, listRecipeSurfaces, listDesignResources, getDesignResource, listDesignResourcePriorities, getDesignRecommendation } from '@renderkit/shared';

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

program.command('surfaces').option('--json', 'json output').action((opts) => {
  output({ ok: true, surfaces: SURFACE_NAMES.map(surface => ({ surface, recipe: getRecipe(surface) || null })) }, opts.json);
});
program.command('themes').option('--json', 'json output').action((opts) => {
  output({ ok: true, themes: THEME_NAMES }, opts.json);
});
program.command('blocks').option('--json', 'json output').action((opts) => {
  output({ ok: true, blocks: BLOCK_TYPES }, opts.json);
});
program.command('aliases').option('--json', 'json output').action((opts) => {
  output({ ok: true, aliases: BLOCK_ALIASES }, opts.json);
});
program.command('errors').option('--json', 'json output').action((opts) => {
  output({ ok: true, errors: ERROR_CODES }, opts.json);
});
program.command('recipes').option('--json', 'json output').action((opts) => {
  output({ ok: true, surfaces: listRecipeSurfaces().map(s => ({ surface: s, ...getRecipe(s) })) }, opts.json);
});
program.command('design').option('--json', 'json output').action((opts) => {
  output({ ok: true, resources: listDesignResources(), priorities: listDesignResourcePriorities() }, opts.json);
});
program.command('server').description('manage local RenderKit server').action(() => {
  output({ ok: false, error: 'Use pnpm dev to start the web server, or pnpm renderkit server status --json to check status.' });
});

program.parseAsync().catch((e) => {
  console.error(e);
  process.exit(2);
});

function output(data, json) {
  if (json) console.log(JSON.stringify(data, null, 2));
  else console.log(data.ok ? 'OK' : `Error: ${data.error?.code || data.error || 'unknown'}`);
}

function getEndpoint() {
  return process.env.RENDERKIT_ENDPOINT || 'http://localhost:3737';
}

async function readLock(file) {
  try {
    const lockPath = path.join(path.dirname(file), '.' + path.basename(file) + '.lock.json');
    const text = await fs.readFile(lockPath, 'utf8');
    return JSON.parse(text);
  } catch { return null; }
}

async function writeLock(file, data) {
  const lockPath = path.join(path.dirname(file), '.' + path.basename(file) + '.lock.json');
  await fs.writeFile(lockPath, JSON.stringify(data, null, 2));
}

function openUrl(url) {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  spawn(cmd, [url], { detached: true, stdio: 'ignore' });
}
