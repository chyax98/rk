#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Command } from 'commander';

const program = new Command();
program.name('renderkit').description('Local HTML artifact renderer').version('0.2.0');

program
  .command('push <file>')
  .description('Push an HTML file to the local server')
  .option('--open', 'open browser after push')
  .option('--json', 'json output')
  .action(async (file, opts) => {
    const content = await fs.readFile(file, 'utf8');
    const endpoint = getEndpoint();
    const lock = await readLock(file);

    // Always send as HTML
    const url = lock?.artifactId
      ? `${endpoint}/api/artifacts/${lock.artifactId}/revisions`
      : `${endpoint}/api/artifacts`;

    const body = { html: content, file: path.basename(file) };
    let res = await fetch(`${endpoint}/api/artifacts`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    let json = await res.json();
    if (
      (!res.ok || !json.ok) &&
      lock?.artifactId &&
      JSON.stringify(json).includes('RK_ARTIFACT_NOT_FOUND')
    ) {
      res = await fetch(`${endpoint}/api/artifacts`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      json = await res.json();
    }
    if (!res.ok || !json.ok) {
      output(json, opts.json);
      process.exit(1);
    }
    const artifactId = json.artifactId;
    await writeLock(file, { artifactId, url: json.url, lastRevision: json.revision, endpoint });

    output(
      { ok: true, artifactId, revision: json.revision, url: json.url },
      opts.json,
    );

    if (opts.open && json.url) {
      try {
        openUrl(json.url);
      } catch {
        /* browser open failure is non-fatal */
      }
    }
  });

program
  .command('status <target>')
  .description('Get artifact status')
  .option('--json', 'json output')
  .action(async (target, opts) => {
    const endpoint = getEndpoint();
    const id = target.includes('.') ? (await readLock(target))?.artifactId : target;
    if (!id) {
      output({ ok: false, error: 'No artifact lock found' }, opts.json);
      process.exit(1);
    }
    const res = await fetch(`${endpoint}/api/artifacts/${id}`);
    const json = await res.json();
    output(json, opts.json);
    process.exit(res.ok ? 0 : 1);
  });

program
  .command('feedback <target>')
  .description('Get open comments for an artifact')
  .option('--json', 'json output')
  .action(async (target, opts) => {
    const endpoint = getEndpoint();
    const id = target.includes('.') ? (await readLock(target))?.artifactId : target;
    if (!id) {
      output({ ok: false, error: 'No artifact lock found' }, opts.json);
      process.exit(1);
    }
    const res = await fetch(`${endpoint}/api/artifacts/${id}/feedback`);
    const json = await res.json();
    output(json, opts.json);
    process.exit(res.ok ? 0 : 1);
  });

program
  .command('delete <target>')
  .description('Delete an artifact')
  .option('--json', 'json output')
  .action(async (target, opts) => {
    const endpoint = getEndpoint();
    const id = target.includes('.') ? (await readLock(target))?.artifactId : target;
    if (!id) {
      output({ ok: false, error: 'No artifact lock found' }, opts.json);
      process.exit(1);
    }
    const res = await fetch(`${endpoint}/api/artifacts/${id}`, { method: 'DELETE' });
    const json = await res.json();
    output(json, opts.json);
    process.exit(res.ok ? 0 : 1);
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
    const lockPath = path.join(path.dirname(file), `.${path.basename(file)}.lock.json`);
    const text = await fs.readFile(lockPath, 'utf8');
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function writeLock(file, data) {
  const lockPath = path.join(path.dirname(file), `.${path.basename(file)}.lock.json`);
  await fs.writeFile(lockPath, JSON.stringify(data, null, 2));
}

function openUrl(url) {
  const cmd =
    process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  spawn(cmd, [url], { detached: true, stdio: 'ignore' });
}
