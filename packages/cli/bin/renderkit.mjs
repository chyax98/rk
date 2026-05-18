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
  formatFeedbackMarkdown,
  getDefaultDbPath,
  inspectComponentInventory,
} from '../src/utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function openUrl(url) {
  const platform = process.platform;
  const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
  spawn(cmd, [url], { detached: true, stdio: 'ignore' }).unref();
}

const CDN_CHECKS = [
  { name: 'echarts', version: '5.6.0', url: 'https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.esm.min.js' },
  { name: 'ag-grid-css', version: '32.3.9', url: 'https://cdn.jsdelivr.net/npm/ag-grid-community@32.3.9/styles/ag-grid.css' },
  { name: 'ag-grid-theme-alpine', version: '32.3.9', url: 'https://cdn.jsdelivr.net/npm/ag-grid-community@32.3.9/styles/ag-theme-alpine.css' },
  { name: 'ag-grid', version: '32.3.9', url: 'https://cdn.jsdelivr.net/npm/ag-grid-community@32.3.9/dist/ag-grid-community.min.js' },
  { name: 'cytoscape', version: '3.28.1', url: 'https://cdn.jsdelivr.net/npm/cytoscape@3.28.1/dist/cytoscape.esm.min.js' },
  { name: 'mermaid', version: '11.15.0', url: 'https://cdn.jsdelivr.net/npm/mermaid@11.15.0/dist/mermaid.esm.min.mjs' },
  { name: 'roughjs', version: '4.6.6', url: 'https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.esm.js' },
  { name: '3d-force-graph', version: '1.80.0', url: 'https://cdn.jsdelivr.net/npm/3d-force-graph@1.80.0/dist/3d-force-graph.min.js' },
  { name: 'plotly', version: '2.35.3', url: 'https://cdn.jsdelivr.net/npm/plotly.js-dist-min@2.35.3/plotly.min.js' },
  { name: 'scrollama', version: '3.2.0', url: 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/build/scrollama.min.js' },
  { name: 'viz-js', version: '3.14.0', url: 'https://cdn.jsdelivr.net/npm/@viz-js/viz@3.14.0/lib/viz-standalone.js' },
  { name: 'observable-plot', version: '0.6.17', url: 'https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6.17/+esm' },
  { name: 'x6', version: '2.18.1', url: 'https://cdn.jsdelivr.net/npm/@antv/x6@2.18.1/dist/index.js' },
  { name: 'globe.gl', version: '2.31.0', url: 'https://cdn.jsdelivr.net/npm/globe.gl@2.31.0/dist/globe.gl.min.js' },
  { name: 'three-globe-earth', version: '2.31.0', url: 'https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg' },
  { name: 'zdog', version: '1.1.3', url: 'https://cdn.jsdelivr.net/npm/zdog@1.1.3/dist/zdog.dist.min.js' },
  { name: 'leaflet-css', version: '1.9.4', url: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css' },
  { name: 'leaflet-esm', version: '1.9.4', url: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet-src.esm.js' },
  { name: 'antv-infographic', version: '0.2.19', url: 'https://cdn.jsdelivr.net/npm/@antv/infographic@0.2.19/dist/infographic.min.js' },
  { name: 'three', version: '0.170.0', url: 'https://cdn.jsdelivr.net/npm/three@0.170/build/three.module.js' },
  { name: 'model-viewer', version: '3.5.0', url: 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js' },
];

async function checkCdnUrl(item) {
  const t0 = Date.now();
  try {
    const res = await fetch(item.url, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
    return { ...item, ok: res.ok, status: res.status, latencyMs: Date.now() - t0, contentType: res.headers.get('content-type') || undefined };
  } catch (e) {
    return { ...item, ok: false, error: e instanceof Error ? e.message : String(e), latencyMs: Date.now() - t0 };
  }
}

async function checkCdnManifest() {
  const results = await Promise.all(CDN_CHECKS.map(checkCdnUrl));
  return {
    ok: results.every((r) => r.ok),
    count: results.length,
    failed: results.filter((r) => !r.ok).length,
    results,
  };
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
  .option('--test', 'Mark as test artifact (isolated from main list)')
  .option('--author <name>', 'Author of this push (human or agent)', 'human')
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

    // Pre-push validation warnings (non-blocking)
    {
      const preWarnings = [];
      // Empty diagram blocks
      const diagRegex = /<rk-diagram[^>]*>([\s\S]*?)<\/rk-diagram>/gi;
      let dm;
      while ((dm = diagRegex.exec(html)) !== null) {
        if (!dm[1].trim()) {
          const engineM = dm[0].match(/engine=["']([^"']+)["']/);
          preWarnings.push({ engine: engineM?.[1] || 'unknown', message: 'Empty diagram block' });
        }
      }
      // Invalid JSON in data components
      const jsonTags = ['rk-chart', 'rk-plot', 'rk-datagrid', 'rk-plot3d', 'rk-graph3d', 'rk-graph', 'rk-flow', 'rk-globe'];
      for (const tag of jsonTags) {
        const jr = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'gi');
        let jm;
        while ((jm = jr.exec(html)) !== null) {
          const body = jm[1].trim();
          if (!body) continue;
          try { JSON.parse(body); } catch (e) {
            preWarnings.push({ engine: tag, message: `Invalid JSON: ${e.message.slice(0, 120)}` });
          }
        }
      }
      if (preWarnings.length) {
        process.stderr.write(`\n⚠  Pre-push warnings:\n`);
        for (const w of preWarnings) process.stderr.write(`   [${w.engine}] ${w.message}\n`);
        process.stderr.write('\n');
      }
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
          body: JSON.stringify({ html, title, isTest: opts.test === true, author: opts.author }),
          });
        }
      }
    } else {
      res = await fetch(`${endpoint}/api/artifacts`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ html, title, isTest: opts.test === true, author: opts.author }),
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
      console.log(formatFeedbackMarkdown(json, endpoint));
    } else {
      // v2: getFeedback returns thread-folded `comments` with `replies` + `waitingFor`.
      output({
        ok: true,
        artifactId: json.artifactId,
        url: `${endpoint}${json.url}`,
        revision: json.currentRevision,
        openCount: json.comments?.length ?? 0,
        comments: json.comments ?? [],
        submissions: json.submissions ?? [],
        renderErrors: json.renderErrors ?? [],
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
  .option('--cdn', 'Also verify lazy-loaded CDN dependencies')
  .action(async (opts) => {
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

    // 6. Lazy CDN dependencies (optional because it hits the network)
    if (opts.cdn) {
      checks.cdn = await checkCdnManifest();
    }

    output({ ok: opts.cdn ? checks.cdn.ok : true, checks });
  });

// rk components
program
  .command('components')
  .description('List available rk-* components and registry coverage')
  .action(async () => {
    const inventory = await inspectComponentInventory();
    output({
      ok: true,
      count: inventory.components.length,
      documentedCount: inventory.documentedCount,
      derivedCount: inventory.undocumentedTags.length,
      components: inventory.components,
      documentedTags: inventory.documentedTags,
      undocumentedTags: inventory.undocumentedTags,
    });
  });

// rk validate <file.html>
program
  .command('validate <file>')
  .description('Validate artifact HTML before pushing')
  .action(async (file) => {
    let html;
    try {
      html = await fs.readFile(file, 'utf8');
    } catch {
      output({ ok: false, error: `Cannot read file: ${file}` });
      process.exit(1);
    }

    const errors = [];
    const warnings = [];
    let diagramsChecked = 0;
    let jsonBlocksChecked = 0;

    // 1. D2 blocks — try `d2 validate -`
    const d2Regex = /<rk-diagram[^>]*engine=["']d2["'][^>]*>([\s\S]*?)<\/rk-diagram>/gi;
    let d2Match;
    while ((d2Match = d2Regex.exec(html)) !== null) {
      diagramsChecked++;
      const source = d2Match[1].trim();
      if (!source) {
        errors.push({ engine: 'd2', message: 'Empty D2 diagram block' });
        continue;
      }
      const result = await validateD2(source);
      if (!result.ok) errors.push({ engine: 'd2', message: result.error });
    }

    // 2. JSON blocks in data components
    const jsonComponents = ['rk-chart', 'rk-plot', 'rk-datagrid', 'rk-infographic', 'rk-plot3d', 'rk-graph3d', 'rk-graph', 'rk-flow', 'rk-globe'];
    for (const tag of jsonComponents) {
      const jsonRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'gi');
      let jMatch;
      while ((jMatch = jsonRegex.exec(html)) !== null) {
        const body = jMatch[1].trim();
        if (!body) continue;
        jsonBlocksChecked++;
        try {
          JSON.parse(body);
        } catch (e) {
          errors.push({ engine: tag, message: `Invalid JSON: ${e.message}` });
        }
      }
    }

    // 3. Mermaid blocks — basic non-empty check
    const mermaidRegex = /<rk-diagram[^>]*engine=["']mermaid["'][^>]*>([\s\S]*?)<\/rk-diagram>/gi;
    let mMatch;
    while ((mMatch = mermaidRegex.exec(html)) !== null) {
      diagramsChecked++;
      const source = mMatch[1].trim();
      if (!source) {
        errors.push({ engine: 'mermaid', message: 'Empty mermaid diagram block' });
      }
    }

    // 4. PlantUML / Graphviz blocks — basic non-empty check
    const pumlRegex = /<rk-diagram[^>]*engine=["'](plantuml|graphviz|dot)["'][^>]*>([\s\S]*?)<\/rk-diagram>/gi;
    let pMatch;
    while ((pMatch = pumlRegex.exec(html)) !== null) {
      diagramsChecked++;
      const source = pMatch[2].trim();
      if (!source) {
        errors.push({ engine: pMatch[1], message: 'Empty diagram block' });
      }
    }

    // Summary
    const hasErrors = errors.length > 0;
    console.log(hasErrors ? `✗ ${file}` : `✓ ${file}`);
    console.log(`  ${diagramsChecked} diagram(s) checked`);
    console.log(`  ${jsonBlocksChecked} JSON block(s) checked`);
    for (const err of errors) {
      console.log(`  ✗ [${err.engine}] ${err.message}`);
    }
    for (const w of warnings) {
      console.log(`  ⚠ [${w.engine}] ${w.message}`);
    }

    output({ ok: !hasErrors, errors, warnings, diagramsChecked, jsonBlocksChecked });
    if (hasErrors) process.exit(1);
  });

async function validateD2(source) {
  return new Promise((resolve) => {
    const proc = spawn('d2', ['--layout=elk', '-'], { timeout: 10000, stdio: ['pipe', 'pipe', 'pipe'] });
    let err = '';
    proc.stdin.write(source);
    proc.stdin.end();
    proc.stderr.on('data', (d) => (err += d.toString()));
    proc.stdout.resume(); // drain
    proc.on('close', (code) => {
      if (code === 0) resolve({ ok: true });
      else resolve({ ok: false, error: err.trim().replace(/^err:\s*/gm, '').slice(0, 300) || `exit code ${String(code)}` });
    });
    proc.on('error', (e) => {
      resolve({ ok: false, error: `d2 not found: ${e.message}. Install: curl -fsSL https://d2lang.com/install.sh | sh` });
    });
  });
}

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

// rk reply <file> <commentId> <text>
program
  .command('reply <file> <commentId> <text>')
  .description('Reply to a comment as agent')
  .option('--endpoint <url>', 'Server endpoint', getEndpoint())
  .action(async (file, commentId, text, opts) => {
    const endpoint = opts.endpoint || getEndpoint();
    const lock = await readLock(file);
    if (!lock?.artifactId) {
      output({ ok: false, error: `No lock file found for ${file}. Run: rk push ${file} first.` });
      process.exit(1);
    }

    const res = await fetch(`${endpoint}/api/artifacts/${lock.artifactId}/comments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ parentId: commentId, text, author: 'agent' }),
    });
    const json = await res.json().catch(() => ({ ok: false, error: 'Invalid server response' }));

    if (!res.ok || !json.ok) {
      output(json);
      process.exit(1);
    }
    output({ ok: true, comment: json.comment });
  });

// rk address <file> <commentId>
program
  .command('address <file> <commentId>')
  .description('Mark a comment as addressed (ready for human review)')
  .option('--endpoint <url>', 'Server endpoint', getEndpoint())
  .action(async (file, commentId, opts) => {
    const endpoint = opts.endpoint || getEndpoint();
    const lock = await readLock(file);
    if (!lock?.artifactId) {
      output({ ok: false, error: `No lock file found for ${file}. Run: rk push ${file} first.` });
      process.exit(1);
    }

    const res = await fetch(`${endpoint}/api/artifacts/${lock.artifactId}/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'addressed', actor: 'agent' }),
    });
    const json = await res.json().catch(() => ({ ok: false, error: 'Invalid server response' }));

    if (!res.ok || !json.ok) {
      output(json);
      process.exit(1);
    }
    output({ ok: true, comment: json.comment });
  });

// rk resolve <file> <commentId>
program
  .command('resolve <file> <commentId>')
  .description('Resolve a comment (agent confirms review passed)')
  .option('--endpoint <url>', 'Server endpoint', getEndpoint())
  .action(async (file, commentId, opts) => {
    const endpoint = opts.endpoint || getEndpoint();
    const lock = await readLock(file);
    if (!lock?.artifactId) {
      output({ ok: false, error: `No lock file found for ${file}. Run: rk push ${file} first.` });
      process.exit(1);
    }

    const res = await fetch(`${endpoint}/api/artifacts/${lock.artifactId}/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'resolved', actor: 'agent' }),
    });
    const json = await res.json().catch(() => ({ ok: false, error: 'Invalid server response' }));

    if (!res.ok || !json.ok) {
      output(json);
      process.exit(1);
    }
    output({ ok: true, comment: json.comment });
  });

// rk reopen <file> <commentId>
program
  .command('reopen <file> <commentId>')
  .description('Reopen a comment (agent requests further review)')
  .option('--endpoint <url>', 'Server endpoint', getEndpoint())
  .action(async (file, commentId, opts) => {
    const endpoint = opts.endpoint || getEndpoint();
    const lock = await readLock(file);
    if (!lock?.artifactId) {
      output({ ok: false, error: `No lock file found for ${file}. Run: rk push ${file} first.` });
      process.exit(1);
    }

    const res = await fetch(`${endpoint}/api/artifacts/${lock.artifactId}/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'open', actor: 'agent' }),
    });
    const json = await res.json().catch(() => ({ ok: false, error: 'Invalid server response' }));

    if (!res.ok || !json.ok) {
      output(json);
      process.exit(1);
    }
    output({ ok: true, comment: json.comment });
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
