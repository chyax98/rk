#!/usr/bin/env node
/**
 * RenderKit CLI — HTML-first agent loop
 *
 * rk push <file.html>      Upload or update an artifact
 * rk feedback <file.html>  Get open comments as JSON (for agent)
 * rk open <file.html>      Open artifact in browser
 * rk status <file.html>    Show artifact status
 * rk serve [--port 3737]   Start the local dev server
 */
import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Helpers ──────────────────────────────────────────────────────────────────

function getEndpoint() {
  return process.env.RENDERKIT_ENDPOINT || 'http://localhost:3737';
}

/** .rk-lock/<basename>.json  (basename = filename without extension) */
function getLockPath(file) {
  const dir = path.dirname(file);
  const base = path.basename(file, path.extname(file));
  return path.join(dir, '.rk-lock', `${base}.json`);
}

async function readLock(file) {
  try {
    const raw = await fs.readFile(getLockPath(file), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeLock(file, data) {
  const lockPath = getLockPath(file);
  await fs.mkdir(path.dirname(lockPath), { recursive: true });
  await fs.writeFile(lockPath, JSON.stringify({ ...data, lockedAt: new Date().toISOString() }, null, 2));
}

function output(data, json = true) {
  if (json) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    // Human-readable fallback
    if (data.ok === false) {
      console.error('Error:', data.error || JSON.stringify(data));
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

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

    const result = {
      ok: true,
      artifactId: json.artifactId,
      revision: json.revision,
      url: artifactUrl,
    };
    output(result);

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

program.parse();
