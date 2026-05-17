#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const program = new Command();
program.name('renderkit').description('Local HTML artifact renderer').version('0.2.0');

program
  .command('validate <file>')
  .description('Validate an HTML file (syntax check)')
  .option('--json', 'JSON output')
  .action(async (file, opts) => {
    const content = await fs.readFile(file, 'utf8').catch(() => null);
    if (!content) {
      const result = { ok: false, error: 'File not found' };
      opts.json ? console.log(JSON.stringify(result)) : console.error(result.error);
      process.exit(1);
    }
    const result = { ok: true, file, size: content.length };
    opts.json ? console.log(JSON.stringify(result, null, 2)) : console.log(`✓ ${file} (${content.length} bytes)`);
  });

program
  .command('push <file>')
  .description('Push an HTML file to the local server')
  .option('--open', 'Open browser after push')
  .option('--json', 'JSON output')
  .action(async (file, opts) => {
    const content = await fs.readFile(file, 'utf8');
    const endpoint = getEndpoint();
    const lock = await readLock(file);

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
    await writeLock(file, {
      artifactId,
      url: json.url,
      lastRevision: json.revision,
      endpoint,
    });

    const result = {
      ok: true,
      artifactId,
      revision: json.revision,
      url: json.url,
    };
    output(result, opts.json);

    if (opts.open && json.url) {
      try {
        openUrl(json.url);
      } catch (_e) {
        /* browser open failure is non-fatal */
      }
    }
  });

program
  .command('status <target>')
  .option('--json', 'JSON output')
  .action(async (target, opts) => {
    const endpoint = getEndpoint();
    const id =
      target.endsWith('.md') || target.endsWith('.rk') || target.endsWith('.html')
        ? (await readLock(target))?.artifactId
        : target;
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
  .option('--json', 'JSON output')
  .action(async (target, opts) => {
    const endpoint = getEndpoint();
    const id =
      target.endsWith('.md') || target.endsWith('.rk') || target.endsWith('.html')
        ? (await readLock(target))?.artifactId
        : target;
    if (!id) {
      output({ ok: false, error: 'No artifact lock found' }, opts.json);
      process.exit(1);
    }
    const res = await fetch(`${endpoint}/api/artifacts/${id}/feedback`);
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
    const lockPath = path.join(
      path.dirname(file),
      '.' + path.basename(file) + '.lock.json',
    );
    const text = await fs.readFile(lockPath, 'utf8');
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function writeLock(file, data) {
  const lockPath = path.join(
    path.dirname(file),
    '.' + path.basename(file) + '.lock.json',
  );
  await fs.writeFile(lockPath, JSON.stringify(data, null, 2));
}

function openUrl(url) {
  const cmd =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'start'
        : 'xdg-open';
  spawn(cmd, [url], { detached: true, stdio: 'ignore' });
}
