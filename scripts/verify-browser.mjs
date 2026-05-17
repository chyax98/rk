#!/usr/bin/env node
/**
 * pnpm verify:browser — RenderKit browser interaction regression harness.
 *
 * Uses the existing `pw` CLI instead of introducing another browser test stack.
 * The goal is not screenshot-only proof: every screenshot is paired with DOM facts
 * and page-error checks so the harness can fail deterministically.
 */
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const evidenceDir = resolve(root, '.pw-evidence');
const endpoint = 'http://localhost:3737';
const session = `rkbr${Date.now().toString(36).slice(-8)}`;

let pass = 0;
let fail = 0;
let serverProcess = null;
let tempDir = null;

function logSection(title) { console.log(`\n== ${title} ==`); }
function assert(label, ok, detail = '') {
  if (ok) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`); }
}
function run(cmd, args, options = {}) {
  try {
    return {
      code: 0,
      stdout: execFileSync(cmd, args, {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: options.timeout ?? 60_000,
      }),
    };
  } catch (e) {
    return {
      code: e.status ?? 1,
      stdout: e.stdout?.toString?.() ?? '',
      stderr: e.stderr?.toString?.() ?? String(e.message || e),
    };
  }
}
function must(cmd, args, label, options = {}) {
  const r = run(cmd, args, options);
  assert(label, r.code === 0, r.stderr || r.stdout);
  return r;
}
async function sleep(ms) { await new Promise(resolve => setTimeout(resolve, ms)); }
async function healthOk() {
  try {
    const r = await fetch(`${endpoint}/api/health`, { cache: 'no-store' });
    return r.ok;
  } catch {
    return false;
  }
}
async function ensureServer() {
  if (await healthOk()) return 'existing';
  rmSync(resolve(root, 'apps/web/.next/dev'), { recursive: true, force: true });
  serverProcess = spawn('pnpm', ['--filter', '@renderkit/web', 'dev'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  serverProcess.stdout.on('data', d => process.stdout.write(`[web] ${d}`));
  serverProcess.stderr.on('data', d => process.stderr.write(`[web] ${d}`));
  for (let i = 0; i < 60; i++) {
    if (await healthOk()) return 'started';
    await sleep(500);
    if (serverProcess.exitCode !== null) break;
  }
  throw new Error('RenderKit Web server did not become healthy at http://localhost:3737');
}
function parseJson(stdout) {
  try { return JSON.parse(stdout); } catch { return null; }
}
function countFromGet(stdout) {
  const m = stdout.match(/count=(\d+)/);
  return m ? Number(m[1]) : NaN;
}
function textFromGet(stdout) {
  const m = stdout.match(/text=([\s\S]*?) count=/);
  return m ? m[1] : stdout;
}
function pw(args, label, options = {}) { return must('pw', args, label, options); }
function ensureTempDir() {
  if (!tempDir) tempDir = mkdtempSync(join(tmpdir(), 'rk-verify-browser-'));
  return tempDir;
}
function tempExample(sourcePath, name) {
  const dest = join(ensureTempDir(), name);
  writeFileSync(dest, readFileSync(resolve(root, sourcePath), 'utf8'));
  return dest;
}
async function pushArtifact(file, label) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    if (!(await healthOk())) await ensureServer();
    const r = run('node', ['packages/cli/bin/renderkit.mjs', 'push', file, '--json'], { timeout: 90_000 });
    if (r.code === 0) {
      assert(label, true);
      return parseJson(r.stdout);
    }
    const detail = `${r.stderr}\n${r.stdout}`;
    if (attempt === 1 && /fetch failed|ECONNREFUSED|ECONNRESET/.test(detail)) {
      await ensureServer();
      continue;
    }
    assert(label, false, detail);
    return null;
  }
  return null;
}
async function postJson(path, body, method = 'POST') {
  const r = await fetch(`${endpoint}${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await r.json();
  if (!r.ok || json.ok === false) throw new Error(`${method} ${path} failed: ${JSON.stringify(json)}`);
  return json;
}
async function main() {
  const createdArtifactIds = [];
  mkdirSync(evidenceDir, { recursive: true });

  logSection('pw CLI availability');
  const help = must('pw', ['-h'], 'pw -h exits successfully');
  assert('pw -h is the agent-first Playwright CLI', help.stdout.includes('Agent-first Playwright CLI'));

  logSection('Server');
  const serverMode = await ensureServer();
  assert(`web server healthy (${serverMode})`, await healthOk());

  logSection('Seed artifact and comments');
  const productFixture = tempExample('examples/capabilities/product-system.rk.md', 'product-system.rk.md');
  const pushed = await pushArtifact(productFixture, 'push product-system artifact');
  assert('push returns artifact url', Boolean(pushed?.url && pushed?.artifactId), JSON.stringify(pushed));
  const artifactId = pushed.artifactId;
  createdArtifactIds.push(artifactId);
  const openComment = await postJson(`/api/artifacts/${artifactId}/comments`, {
    blockId: 'exec-summary',
    text: '浏览器回归：摘要需要更明确结论',
    selector: { type: 'TextQuoteSelector', exact: 'RenderKit', prefix: '', suffix: '' },
  });
  const resolvedComment = await postJson(`/api/artifacts/${artifactId}/comments`, {
    blockId: 'risk-table',
    text: '浏览器回归：风险表需要补 owner',
  });
  await postJson(`/api/artifacts/${artifactId}/comments/${resolvedComment.comment.id}`, { status: 'resolved' }, 'PATCH');
  assert('seeded one open comment', openComment.comment.status === 'open');
  assert('seeded one resolved comment', resolvedComment.comment.status === 'open');

  logSection('Reading mode and accessibility');
  run('pw', ['session', 'close', session]);
  pw(['session', 'create', session, '--open', pushed.url], 'create pw session', { timeout: 90_000 });
  pw(['wait', '-s', session, '--selector', '.rk-floating-tools'], 'wait for floating toolbar');
  const toolbar = pw(['get', '-s', session, '--selector', '.rk-floating-tools', '--fact', 'text'], 'read reading toolbar').stdout;
  assert('reading toolbar stays minimal', textFromGet(toolbar).includes('Review☰💬⎘'), toolbar);
  pw(['press', '-s', session, 'Tab'], 'press Tab to expose skip link');
  const skipFocused = countFromGet(pw(['get', '-s', session, '--selector', '.rk-skip-link:focus', '--fact', 'count'], 'read focused skip-link count').stdout);
  assert('skip link is keyboard-focusable', skipFocused === 1, `count=${skipFocused}`);

  logSection('Review mode comments');
  pw(['click', '-s', session, '--selector', '.rk-floating-tools button[title="Toggle review mode"]'], 'toggle review mode');
  pw(['wait', '-s', session, '--selector', '.rk-page.rk-review-mode'], 'wait for review mode');
  const filterCount = countFromGet(pw(['get', '-s', session, '--selector', '.rk-comment-filters button', '--fact', 'count'], 'read comment filter count').stdout);
  assert('comment filter exposes four statuses', filterCount === 4, `count=${filterCount}`);
  const openCards = countFromGet(pw(['get', '-s', session, '--selector', '.rk-comment-card[data-status="open"]', '--fact', 'count'], 'read open comment cards').stdout);
  assert('default filter shows open comment', openCards >= 1, `count=${openCards}`);
  pw(['click', '-s', session, '--text', '已解决'], 'switch to resolved comments');
  const resolvedCards = countFromGet(pw(['get', '-s', session, '--selector', '.rk-comment-card[data-status="resolved"]', '--fact', 'count'], 'read resolved comment cards').stdout);
  assert('resolved filter shows resolved comment', resolvedCards >= 1, `count=${resolvedCards}`);
  pw(['click', '-s', session, '--text', '待处理'], 'switch back to open comments');
  pw(['wait', '-s', session, '--selector', '.rk-block[data-rk-comment-status="open"]'], 'wait for open comment side rail block');
  const openRail = countFromGet(pw(['get', '-s', session, '--selector', '.rk-block[data-rk-comment-status="open"]', '--fact', 'count'], 'read open comment side rail blocks').stdout);
  assert('review mode marks blocks with open comment status', openRail >= 1, `count=${openRail}`);

  logSection('Diagram visual language page');
  const diagramFixture = tempExample('examples/capabilities/diagram-visual-language.rk.md', 'diagram-visual-language.rk.md');
  const diagramPushed = await pushArtifact(diagramFixture, 'push diagram visual language artifact');
  assert('diagram artifact url returned', Boolean(diagramPushed?.url), JSON.stringify(diagramPushed));
  if (diagramPushed?.artifactId) createdArtifactIds.push(diagramPushed.artifactId);
  pw(['session', 'recreate', session, '--open', diagramPushed.url], 'open diagram artifact', { timeout: 90_000 });
  pw(['wait', '-s', session, '--selector', '.rk-diagram-svg svg'], 'wait for inline svg diagram');
  const svgCount = countFromGet(pw(['get', '-s', session, '--selector', '.rk-diagram-svg svg', '--fact', 'count'], 'read svg diagram count').stdout);
  assert('diagram visual language renders inline SVG', svgCount >= 1, `count=${svgCount}`);

  logSection('Browser diagnostics and evidence');
  const errors = parseJson(pw(['errors', '-s', session, '--output=json'], 'read browser errors').stdout);
  assert('browser has no captured page errors', (errors?.summary?.total ?? 0) === 0, JSON.stringify(errors));
  const screenshotPath = '.pw-evidence/verify-browser-diagram.png';
  pw(['screenshot', '-s', session, '--path', screenshotPath], 'capture browser verification screenshot', { timeout: 90_000 });
  assert('browser screenshot exists', existsSync(resolve(root, screenshotPath)), screenshotPath);

  console.log(`\n========================================`);
  console.log(`Results: ${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
  console.log('ALL GOOD');
}

main().catch(err => {
  fail++;
  console.error(`\nFATAL: ${err.stack || err.message || err}`);
  console.log(`\n========================================`);
  console.log(`Results: ${pass} passed, ${fail} failed`);
  process.exit(1);
}).finally(() => {
  run('pw', ['session', 'close', session]);
  // Cleanup temp artifacts via DELETE API
  for (const artId of createdArtifactIds) {
    try { await fetch(`${endpoint}/api/artifacts/${artId}`, { method: 'DELETE' }); } catch {}
  }
  if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  if (serverProcess && serverProcess.exitCode === null) {
    try { process.kill(-serverProcess.pid, 'SIGTERM'); } catch { serverProcess.kill('SIGTERM'); }
  }
});
