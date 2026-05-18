#!/usr/bin/env node
/**
 * RenderKit CLI — HTML-first agent loop
 *
 * rk push <file.html>      Upload or update an artifact
 * rk feedback <file.html>  Get open comments as JSON (for agent)
 * rk open <file.html>      Open artifact in browser
 * rk status <file.html>    Show artifact status
 * rk serve [--port 3737]   Start the local dev server
 * rk doctor                Diagnose local environment
 */
import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  getEndpoint,
  getLockPath,
  readLock,
  writeLock,
  output,
  getDefaultDbPath,
} from '../src/utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function openUrl(url) {
  const platform = process.platform;
  const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
  spawn(cmd, [url], { detached: true, stdio: 'ignore' }).unref();
}

function formatFeedbackMarkdown(feedback) {
  if (!feedback.openComments?.length) {
    return `# RenderKit Feedback\n\nartifactId: ${feedback.artifactId}\n\n✅ 暂无待处理评论。\n`;
  }
  const lines = [
    `# RenderKit Feedback`,
    ``,
    `artifactId: ${feedback.artifactId}`,
    `revision: ${feedback.currentRevision}`,
    `url: ${getEndpoint()}${feedback.url}`,
    ``,
    `## 待处理评论（${feedback.openComments.length} 条）`,
    ``,
  ];
  for (const c of feedback.openComments) {
    lines.push(`### ${c.anchor || '(全局)'}`);
    lines.push(`- **状态**: ${c.status}`);
    lines.push(`- **时间**: ${c.createdAt}`);
    lines.push(`- **内容**: ${c.text}`);
    if (c.selector) lines.push(`- **选区**: \`${c.selector}\``);
    lines.push('');
  }
  return lines.join('\n');
}

// ── Commands ──────────────────────────────────────────────────────────────────

const program = new Command();
program
  .name('rk')
  .description('RenderKit CLI — push HTML artifacts and get feedback')
  .version('0.1.0')
  .helpOption('-h, --help', '显示帮助信息')
  .addHelpText('after', '\n更多文档: https://github.com/chyax98/rk');

// rk push <file.html>
program
  .command('push <file>')
  .description('Upload or update an HTML artifact')
  .option('--open', 'Open in browser after push')
  .option('--tag <tags>', 'Comma-separated tags (e.g. "project:alpha,type:report")')
  .option('--endpoint <url>', 'Server endpoint', getEndpoint())
  .option('--json', 'Force JSON output (default: true)')
  .action(async (file, opts) => {
    const endpoint = opts.endpoint || getEndpoint();
    let html;
    try {
      html = await fs.readFile(file, 'utf8');
    } catch {
      output({ ok: false, error: `Cannot read file: ${file}` });
      process.exit(1);
    }

    const lock = await readLock(file);
    const title = path.basename(file, path.extname(file));

    let res, json;
    if (lock?.artifactId) {
      // Update existing artifact
      res = await fetch(`${endpoint}/api/artifacts/${lock.artifactId}/revisions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ html }),
      }).catch(() => null);

      // If artifact not found on server, create new
      if (!res || !res.ok) {
        const err = res ? await res.json().catch(() => ({})) : {};
        if (!res || JSON.stringify(err).includes('NOT_FOUND')) {
          res = await fetch(`${endpoint}/api/artifacts`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ html, title }),
          });
        }
      }
    } else {
      res = await fetch(`${endpoint}/api/artifacts`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ html, title }),
      });
    }

    if (!res) {
      output({ ok: false, error: `Cannot connect to server at ${endpoint}. Is it running? Try: rk serve` });
      process.exit(1);
    }

    json = await res.json().catch(() => ({ ok: false, error: 'Invalid server response' }));
    if (!res.ok || !json.ok) {
      output(json);
      process.exit(1);
    }

    const artifactUrl = `${endpoint}/a/${json.artifactId}`;
    await writeLock(file, { artifactId: json.artifactId, url: artifactUrl, endpoint });

    // Apply tags if --tag was provided
    if (opts.tag) {
      const tags = opts.tag.split(',').map((t) => t.trim()).filter(Boolean);
      if (tags.length > 0) {
        await fetch(`${endpoint}/api/artifacts/${json.artifactId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ tags }),
        }).catch(() => {});
      }
    }

    const result = {
      ok: true,
      artifactId: json.artifactId,
      revision: json.revision,
      url: artifactUrl,
      ...(json.warnings?.length ? { warnings: json.warnings } : {}),
    };
    output(result);

    // Print render warnings so agents can fix diagram syntax
    if (json.warnings?.length) {
      process.stderr.write(`\n⚠  ${json.warnings.length} diagram(s) failed to render:\n`);
      for (const w of json.warnings) {
        process.stderr.write(`   [${w.engine}] ${w.message}\n`);
      }
      process.stderr.write('\n');
    }

    if (opts.open) openUrl(artifactUrl);
  });

// rk feedback <file.html>
program
  .command('feedback <file>')
  .description('Get open comments for an artifact (JSON for agent, --format md for human)')
  .option('--format <fmt>', 'Output format: json or md', 'json')
  .option('--endpoint <url>', 'Server endpoint', getEndpoint())
  .action(async (file, opts) => {
    const endpoint = opts.endpoint || getEndpoint();
    const lock = await readLock(file);
    if (!lock?.artifactId) {
      output({ ok: false, error: `No lock file found for ${file}. Run: rk push ${file} first.` });
      process.exit(1);
    }

    const res = await fetch(`${endpoint}/api/artifacts/${lock.artifactId}/feedback`);
    const json = await res.json().catch(() => ({ ok: false, error: 'Invalid server response' }));

    if (!res.ok || !json.ok) {
      output(json);
      process.exit(1);
    }

    if (opts.format === 'md') {
      console.log(formatFeedbackMarkdown(json));
    } else {
      output({
        ok: true,
        artifactId: json.artifactId,
        url: `${endpoint}${json.url}`,
        revision: json.currentRevision,
        openCount: json.openComments?.length ?? 0,
        comments: json.openComments ?? [],
        submissions: json.submissions ?? [],  // form submissions from rk-form WC
      });
    }
  });

// rk open <file.html>
program
  .command('open <file>')
  .description('Open artifact in browser')
  .option('--endpoint <url>', 'Server endpoint', getEndpoint())
  .action(async (file, opts) => {
    const endpoint = opts.endpoint || getEndpoint();
    const lock = await readLock(file);
    if (!lock?.artifactId) {
      output({ ok: false, error: `No lock file found for ${file}. Run: rk push ${file} first.` });
      process.exit(1);
    }
    const url = `${endpoint}/a/${lock.artifactId}`;
    openUrl(url);
    output({ ok: true, url });
  });

// rk status <file.html>
program
  .command('status <file>')
  .description('Show artifact status and comment counts')
  .option('--endpoint <url>', 'Server endpoint', getEndpoint())
  .action(async (file, opts) => {
    const endpoint = opts.endpoint || getEndpoint();
    const lock = await readLock(file);
    if (!lock?.artifactId) {
      output({ ok: false, error: `No lock file found for ${file}. Run: rk push ${file} first.` });
      process.exit(1);
    }

    const res = await fetch(`${endpoint}/api/artifacts/${lock.artifactId}`);
    const json = await res.json().catch(() => ({ ok: false, error: 'Invalid server response' }));

    if (!res.ok || !json.ok) {
      output(json);
      process.exit(1);
    }

    output({
      ok: true,
      artifactId: lock.artifactId,
      url: `${endpoint}/a/${lock.artifactId}`,
      revision: json.revision,
      comments: json.comments,
    });
  });

// rk serve
program
  .command('serve')
  .description('Start the local RenderKit web server')
  .option('-p, --port <port>', 'Port number', '3737')
  .action((opts) => {
    const root = path.resolve(__dirname, '../../..'); // repo root
    console.log(`Starting RenderKit server on port ${opts.port}...`);
    const child = spawn(
      'pnpm',
      ['--filter', '@renderkit/web', 'dev', '--', '-p', String(opts.port)],
      { cwd: root, stdio: 'inherit' },
    );
    child.on('error', (e) => {
      console.error('Failed to start server:', e.message);
      process.exit(1);
    });
  });

// rk doctor
program
  .command('doctor')
  .description('Diagnose local RenderKit environment')
  .action(async () => {
    const checks = {};

    // 1. Server health
    const endpoint = getEndpoint();
    const t0 = Date.now();
    let serverOk = false;
    let latency = null;
    try {
      const res = await fetch(`${endpoint}/api/health`, { signal: AbortSignal.timeout(5000) });
      latency = Date.now() - t0;
      const body = await res.json();
      serverOk = body.ok === true;
    } catch {
      latency = null;
    }
    checks.server = {
      endpoint,
      ok: serverOk,
      ...(latency !== null ? { latencyMs: latency } : {}),
    };

    // 2. DB file
    const dbPath = getDefaultDbPath();
    let dbExists = false;
    let dbSize = null;
    try {
      const stat = await fs.stat(dbPath);
      dbExists = true;
      dbSize = stat.size;
    } catch {
      // doesn't exist
    }
    checks.database = {
      path: dbPath,
      exists: dbExists,
      ...(dbSize !== null ? { sizeBytes: dbSize } : {}),
    };

    // 3. Node version
    checks.node = process.version;

    // 4. CLI path
    checks.cli = fileURLToPath(import.meta.url);

    // 5. d2 CLI
    const { execSync } = await import('node:child_process');
    try {
      const d2Version = execSync('d2 --version 2>/dev/null', { encoding: 'utf8' }).trim();
      checks.d2 = { ok: true, version: d2Version };
    } catch {
      checks.d2 = { ok: false, hint: 'Install: curl -fsSL https://d2lang.com/install.sh | sh' };
    }

    output({ ok: true, checks });
  });

program
  .command('archive <file>')
  .description('Archive an artifact (hide from main list)')
  .option('--endpoint <url>', 'Server endpoint', getEndpoint())
  .action(async (file, opts) => {
    const endpoint = opts.endpoint || getEndpoint();
    const lock = await readLock(file);
    if (!lock?.artifactId) {
      output({ ok: false, error: `No lock file found for ${file}. Run: rk push ${file} first.` });
      process.exit(1);
    }

    const res = await fetch(`${endpoint}/api/artifacts/${lock.artifactId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ archived: true }),
    });
    const json = await res.json().catch(() => ({ ok: false, error: 'Invalid server response' }));
    output(json);
  });

program
  .command('prune')
  .description('Delete test/scratch artifacts matching a title pattern')
  .option('--pattern <glob>', 'Title prefix pattern to delete (e.g. "rk-test-")', 'rk-test-')
  .option('--dry-run', 'List what would be deleted without deleting', false)
  .option('--endpoint <url>', 'Server endpoint', getEndpoint())
  .action(async (opts) => {
    const endpoint = opts.endpoint || getEndpoint();
    const pattern = opts.pattern;
    const dryRun = opts.dryRun;

    // List all artifacts
    const listRes = await fetch(`${endpoint}/api/artifacts`).catch(() => null);
    if (!listRes?.ok) {
      output({ ok: false, error: 'Could not reach server. Is it running?' });
      process.exit(1);
    }
    const { artifacts } = await listRes.json();
    const matches = (artifacts || []).filter((a) => a.title?.startsWith(pattern));

    if (matches.length === 0) {
      output({ ok: true, pruned: 0, message: `No artifacts matching prefix "${pattern}"` });
      return;
    }

    if (dryRun) {
      output({ ok: true, dryRun: true, wouldDelete: matches.map((a) => ({ id: a.id, title: a.title })) });
      return;
    }

    let pruned = 0;
    const errors = [];
    for (const a of matches) {
      const res = await fetch(`${endpoint}/api/artifacts/${a.id}`, { method: 'DELETE' });
      if (res.ok) pruned++;
      else errors.push(a.id);
    }
    output({ ok: true, pruned, total: matches.length, errors: errors.length ? errors : undefined });
  });

program.parse();
