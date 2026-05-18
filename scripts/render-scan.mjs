#!/usr/bin/env node
/**
 * RenderKit browser render diagnostic harness.
 *
 * Scans examples/cases/*.html by default:
 *   1. POST HTML to RenderKit server
 *   2. Open artifact with opencli browser
 *   3. Collect DOM render errors, console errors, failed network requests,
 *      feedback.renderErrors[], and component smoke signals
 *   4. Write JSON + Markdown reports under reports/render-scan/
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const endpoint = process.env.RK_ENDPOINT || 'http://localhost:3737';
const waitMs = Number(process.env.RK_RENDER_SCAN_WAIT_MS || 8000);
const session = process.env.RK_RENDER_SCAN_SESSION || `rk-scan-${Date.now().toString(36)}`;
const outDir = resolve(root, 'reports/render-scan');

const args = process.argv.slice(2);
const files = resolveInputs(args.length ? args : ['examples/cases']);

function resolveInputs(inputs) {
  const out = [];
  for (const input of inputs) {
    const p = resolve(root, input);
    if (!existsSync(p)) continue;
    if (p.endsWith('.html')) {
      out.push(p);
      continue;
    }
    for (const name of readdirSync(p)) {
      if (name.endsWith('.html')) out.push(join(p, name));
    }
  }
  return [...new Set(out)].sort();
}

function run(cmd, args, options = {}) {
  try {
    const stdout = execFileSync(cmd, args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: options.timeout ?? 120_000,
      env: { ...process.env, OPENCLI_WINDOW: process.env.OPENCLI_WINDOW || 'background' },
    });
    return { ok: true, code: 0, stdout };
  } catch (e) {
    return {
      ok: false,
      code: e.status ?? 1,
      stdout: e.stdout?.toString?.() ?? '',
      stderr: e.stderr?.toString?.() ?? String(e.message || e),
    };
  }
}

function parseJson(s, fallback = null) {
  try { return JSON.parse(s); } catch { return fallback; }
}

async function health() {
  try {
    const r = await fetch(`${endpoint}/api/health`, { cache: 'no-store' });
    return r.ok;
  } catch {
    return false;
  }
}

function parseDeclaredSmoke(html) {
  const m = html.match(/<script[^>]*(?:data-rk-smoke|id=["']rk-smoke["'])[^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return [];
  try {
    const parsed = JSON.parse(m[1]);
    return Array.isArray(parsed) ? parsed : (parsed.cases || []);
  } catch (e) {
    return [{ id: 'rk-smoke-parse', selector: 'html', min: 1, parseError: e instanceof Error ? e.message : String(e) }];
  }
}

async function pushCase(file) {
  const html = readFileSync(file, 'utf8');
  const title = basename(file, extname(file));
  const r = await fetch(`${endpoint}/api/artifacts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ html, title }),
  });
  const json = await r.json().catch(() => ({ ok: false, error: 'invalid json response' }));
  if (!r.ok || json.ok === false) throw new Error(`push failed: ${JSON.stringify(json)}`);
  return json;
}

async function feedback(artifactId) {
  const r = await fetch(`${endpoint}/api/artifacts/${artifactId}/feedback`, { cache: 'no-store' });
  const json = await r.json().catch(() => ({ ok: false, error: 'invalid json response' }));
  if (!r.ok || json.ok === false) return { ok: false, renderErrors: [], error: json.error || json };
  return json;
}

function openBrowser(url) {
  const r = run('opencli', ['browser', session, 'open', url], { timeout: 60_000 });
  if (!r.ok) throw new Error(`opencli open failed: ${r.stderr || r.stdout}`);
  return parseJson(r.stdout, {});
}

function browserEval(js) {
  const r = run('opencli', ['browser', session, 'eval', js], { timeout: 60_000 });
  if (!r.ok) return { ok: false, error: r.stderr || r.stdout };
  return parseJson(r.stdout, { ok: false, raw: r.stdout });
}

function browserJson(command, args = []) {
  const r = run('opencli', ['browser', session, command, ...args], { timeout: 60_000 });
  if (!r.ok) return { ok: false, error: r.stderr || r.stdout, count: 0, entries: [], messages: [] };
  return parseJson(r.stdout, { ok: false, raw: r.stdout, count: 0, entries: [], messages: [] });
}

function declaredSmokeSnippet(cases) {
  return `(() => {
    const cases = ${JSON.stringify(cases)};
    const all = (sel) => {
      try { return [...document.querySelectorAll(sel)]; }
      catch (e) { return { error: String(e.message || e) }; }
    };
    const text = (el) => (el?.textContent || '').trim();
    return cases.map((c) => {
      if (c.parseError) return { id: c.id, ok: false, error: c.parseError };
      const matches = all(c.selector || '');
      if (!Array.isArray(matches)) return { id: c.id, selector: c.selector, ok: false, error: matches.error };
      const count = matches.length;
      const min = c.min ?? 1;
      const contains = c.text ? matches.some((el) => text(el).includes(c.text)) : true;
      return { id: c.id || c.name || c.selector, selector: c.selector, min, count, text: c.text || null, ok: count >= min && contains };
    });
  })()`;
}

const collectSnippet = String.raw`(() => {
  const all = (sel, root = document) => [...root.querySelectorAll(sel)];
  const text = (el) => (el?.textContent || '').trim();
  const errorEls = all('[class*="rk-"][class*="__error"], [class*=" rk-"][class*="__error"]')
    .map((el) => ({ component: el.closest('[local-name]')?.localName || el.closest('*')?.tagName?.toLowerCase() || '', className: el.className, text: text(el) }))
    .filter((e) => e.text);

  const smokeDefs = [
    ['rk-diagram', 'svg'],
    ['rk-chart', 'div[id^="echarts-"]'],
    ['rk-plot', 'svg'],
    ['rk-plot3d', '.js-plotly-plot'],
    ['rk-infographic', 'svg,canvas'],
    ['rk-map', '.leaflet-container'],
    ['rk-globe', '.rk-globe__container'],
    ['rk-graph', '.rk-graph__container'],
    ['rk-graph3d', 'canvas'],
    ['rk-flow', '.x6-graph'],
    ['rk-datagrid', '.ag-row'],
    ['rk-sketch', 'svg'],
    ['rk-zdog', 'canvas'],
    ['rk-model', 'model-viewer'],
    ['rk-3d', 'canvas'],
    ['rk-narrative', '.rk-narrative__body'],
    ['rk-table', 'table'],
    ['rk-form', '.rk-form__fields'],
    ['rk-scroll-story', 'rk-step']
  ];
  const smoke = smokeDefs.map(([tag, selector]) => {
    const total = all(tag).length;
    const ok = all(tag).filter((el) => el.querySelector(selector)).length;
    return { tag, selector, total, ok, failed: Math.max(0, total - ok) };
  }).filter((s) => s.total > 0);

  let declared = [];
  const meta = document.querySelector('script[type="application/json"][data-rk-smoke], script#rk-smoke');
  if (meta) {
    try {
      const parsed = JSON.parse(meta.textContent || '{}');
      const cases = Array.isArray(parsed) ? parsed : (parsed.cases || []);
      declared = cases.map((c) => {
        const count = all(c.selector || '').length;
        const min = c.min ?? 1;
        const contains = c.text ? all(c.selector || '').some((el) => text(el).includes(c.text)) : true;
        return { id: c.id || c.name || c.selector, selector: c.selector, min, count, text: c.text || null, ok: count >= min && contains };
      });
    } catch (e) {
      declared = [{ id: 'rk-smoke-parse', ok: false, error: String(e.message || e) }];
    }
  }

  return {
    url: location.href,
    title: document.title,
    errorEls,
    smoke,
    declared,
    perf: performance.getEntriesByType('navigation')[0]
      ? { loadMs: Math.round(performance.getEntriesByType('navigation')[0].loadEventEnd), domContentLoadedMs: Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd) }
      : null,
    bodyTextSample: document.body.innerText.slice(0, 500)
  };
})()`;

function summarizeCase(result) {
  const pushWarnings = result.push?.warnings?.length || 0;
  const domErrors = result.dom?.errorEls?.length || 0;
  const feedbackErrors = result.feedback?.renderErrors?.length || 0;
  const consoleErrors = result.console?.messages?.length || 0;
  const networkFailed = result.network?.entries?.length || 0;
  const smokeFailed = (result.dom?.smoke || []).reduce((n, s) => n + (s.failed || 0), 0);
  const declaredFailed = (result.dom?.declared || []).filter((s) => !s.ok).length;
  return { pushWarnings, domErrors, feedbackErrors, consoleErrors, networkFailed, smokeFailed, declaredFailed };
}

function isPassing(summary) {
  return Object.values(summary).every((n) => n === 0);
}

function markdownReport(report) {
  const lines = [];
  lines.push(`# Render Scan Report`);
  lines.push('');
  lines.push(`- generatedAt: ${report.generatedAt}`);
  lines.push(`- endpoint: ${report.endpoint}`);
  lines.push(`- session: ${report.session}`);
  lines.push(`- files: ${report.results.length}`);
  lines.push(`- declared cases: ${report.declaredCaseCount}`);
  lines.push(`- pass: ${report.pass}`);
  lines.push(`- fail: ${report.fail}`);
  lines.push('');
  lines.push(`| Case | Status | Artifact | Push Warn | DOM Err | Feedback Err | Console Err | Network Failed | Smoke Failed |`);
  lines.push(`|---|---:|---|---:|---:|---:|---:|---:|---:|`);
  for (const r of report.results) {
    const s = r.summary;
    lines.push(`| ${r.file} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.artifactId ? `[${r.artifactId}](${r.url})` : ''} | ${s.pushWarnings} | ${s.domErrors} | ${s.feedbackErrors} | ${s.consoleErrors} | ${s.networkFailed} | ${s.smokeFailed + s.declaredFailed} |`);
  }
  for (const r of report.results.filter((x) => !x.ok)) {
    lines.push('');
    lines.push(`## ${r.file}`);
    if (r.error) lines.push(`- harness error: ${r.error}`);
    for (const w of r.push?.warnings || []) lines.push(`- push warning [${w.engine || 'unknown'}]: ${w.message}`);
    for (const e of r.dom?.errorEls || []) lines.push(`- DOM error ${e.className}: ${e.text}`);
    for (const e of r.feedback?.renderErrors || []) lines.push(`- feedback renderError [${e.engine || 'unknown'}]: ${e.message}`);
    for (const e of r.console?.messages || []) lines.push(`- console ${e.level || ''}: ${e.text || e.message || JSON.stringify(e)}`);
    for (const e of r.network?.entries || []) lines.push(`- network failed: ${e.url || e.request?.url || JSON.stringify(e).slice(0, 200)}`);
    for (const s of r.dom?.smoke || []) if (s.failed) lines.push(`- smoke failed ${s.tag}: ${s.ok}/${s.total} matched ${s.selector}`);
    for (const s of r.dom?.declared || []) if (!s.ok) lines.push(`- declared smoke failed ${s.id}: selector=${s.selector} count=${s.count} min=${s.min}`);
  }
  lines.push('');
  return lines.join('\n');
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  if (!files.length) {
    console.error('No case files found. Default input is examples/cases/*.html');
    process.exit(2);
  }
  if (!(await health())) {
    console.error(`RenderKit server is not healthy at ${endpoint}. Start it with: pnpm dev:web`);
    process.exit(2);
  }

  const results = [];
  for (const file of files) {
    const rel = file.replace(`${root}/`, '');
    process.stdout.write(`scan ${rel} ... `);
    const result = { file: rel, ok: false, summary: {}, push: null, dom: null, console: null, network: null, feedback: null };
    try {
      const sourceHtml = readFileSync(file, 'utf8');
      const declaredSmoke = parseDeclaredSmoke(sourceHtml);
      result.declaredCaseCount = declaredSmoke.length;
      const push = await pushCase(file);
      result.push = push;
      result.artifactId = push.artifactId;
      result.url = push.url || `${endpoint}/a/${push.artifactId}`;
      openBrowser(result.url);
      run('opencli', ['browser', session, 'wait', 'time', String(Math.ceil(waitMs / 1000))], { timeout: waitMs + 20_000 });
      result.dom = browserEval(collectSnippet);
      if (result.dom && typeof result.dom === 'object') {
        result.dom.declared = declaredSmoke.length ? browserEval(declaredSmokeSnippet(declaredSmoke)) : [];
      }
      result.console = browserJson('console', ['--level', 'error', '--since', '2m']);
      result.network = browserJson('network', ['--failed', '--all', '--since', '2m']);
      result.feedback = await feedback(push.artifactId);
      result.summary = summarizeCase(result);
      result.ok = isPassing(result.summary);
      process.stdout.write(`${result.ok ? 'PASS' : 'FAIL'}\n`);
    } catch (e) {
      result.error = e instanceof Error ? e.message : String(e);
      result.summary = summarizeCase(result);
      process.stdout.write(`FAIL (${result.error})\n`);
    }
    results.push(result);
  }

  run('opencli', ['browser', session, 'close'], { timeout: 10_000 });

  const report = {
    generatedAt: new Date().toISOString(),
    endpoint,
    session,
    inputs: files.map((f) => f.replace(`${root}/`, '')),
    declaredCaseCount: results.reduce((n, r) => n + (r.declaredCaseCount || 0), 0),
    pass: results.filter((r) => r.ok).length,
    fail: results.filter((r) => !r.ok).length,
    results,
  };
  const stamp = report.generatedAt.replace(/[:.]/g, '-');
  const jsonPath = join(outDir, `${stamp}.json`);
  const mdPath = join(outDir, `${stamp}.md`);
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  writeFileSync(mdPath, markdownReport(report));
  console.log(`\nReport JSON: ${jsonPath}`);
  console.log(`Report MD:   ${mdPath}`);
  console.log(`Result: ${report.pass} pass, ${report.fail} fail`);
  process.exit(report.fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
