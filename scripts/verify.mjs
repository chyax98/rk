#!/usr/bin/env node
/**
 * pnpm verify — deterministic local regression harness.
 * No browser/server required.
 *
 * 1. Good example validations
 * 2. Bad fixture validations (check expected error codes)
 * 3. pnpm --filter @renderkit/web build
 */
import { execSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const fixtures = JSON.parse(readFileSync(resolve(__dirname, "verify-fixtures.json"), "utf8"));

let pass = 0, fail = 0;

function run(cmd) {
  try {
    return { stdout: execSync(cmd, { cwd: root, stdio: ["pipe", "pipe", "pipe"], encoding: "utf8" }), code: 0 };
  } catch (e) {
    return { stdout: e.stdout ?? "", stderr: e.stderr ?? "", code: e.status ?? 1 };
  }
}

function assert(label, ok, detail = "") {
  if (ok) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}${detail ? " — " + detail : ""}`); }
}

// ── Section 1: Good examples ──
console.log("\n== Good examples ==");
for (const file of fixtures.good) {
  const r = run(`node packages/cli/bin/renderkit.mjs validate ${file} --json`);
  let parsed;
  try { parsed = JSON.parse(r.stdout); } catch { parsed = null; }

  assert(`${file}: exit 0`, r.code === 0, `got ${r.code}`);
  assert(`${file}: ok=true`, parsed?.ok === true, `got ${parsed?.ok}`);
  assert(`${file}: has blocks`, Array.isArray(parsed?.model?.blocks) && parsed.model.blocks.length > 0, `got ${parsed?.model?.blocks?.length ?? "n/a"}`);

  if (parsed?.model?.blocks?.length) {
    const allHaveSourceRange = parsed.model.blocks.every(b => b.sourceRange);
    const allHaveSourceExcerpt = parsed.model.blocks.every(b => b.sourceExcerpt);
    assert(`${file}: all blocks have sourceRange`, allHaveSourceRange);
    assert(`${file}: all blocks have sourceExcerpt`, allHaveSourceExcerpt);
  }
}

// ── Section 2: Bad fixtures ──
console.log("\n== Bad fixtures ==");
const fixtureDir = resolve(root, "examples/fixtures");
const actualBadFixtures = readdirSync(fixtureDir).filter(f => f.endsWith(".rk.md")).map(f => `examples/fixtures/${f}`).sort();
const mappedBadFixtures = Object.keys(fixtures.bad).sort();
assert("fixture map has every fixture", JSON.stringify(actualBadFixtures) === JSON.stringify(mappedBadFixtures), `actual=${actualBadFixtures.join(",")} mapped=${mappedBadFixtures.join(",")}`);
for (const [file, expectedCode] of Object.entries(fixtures.bad)) {
  assert(`${file}: exists`, existsSync(join(root, file)));
  const r = run(`node packages/cli/bin/renderkit.mjs validate ${file} --json`);

  let parsed;
  try { parsed = JSON.parse(r.stdout); } catch { parsed = null; }

  assert(`${file}: exit non-0`, r.code !== 0, `got ${r.code}`);
  assert(`${file}: ok=false`, parsed?.ok === false, `got ${parsed?.ok}`);
  assert(`${file}: has errors array`, Array.isArray(parsed?.errors) && parsed.errors.length > 0);
  if (parsed?.errors?.length) {
    const codes = parsed.errors.map(e => e.code);
    assert(`${file}: error code ${expectedCode}`, codes.includes(expectedCode), `got ${codes.join(",")}`);
  }
}

// ── Section 3: Gallery index ──
console.log("\n== Gallery index ==");
const galleryPath = resolve(root, "examples/gallery.json");
assert("gallery.json exists", existsSync(galleryPath));
if (existsSync(galleryPath)) {
  const gallery = JSON.parse(readFileSync(galleryPath, "utf8"));
  assert("gallery has surfaces array", Array.isArray(gallery.surfaces));
  assert("gallery has 5 surfaces", gallery.surfaces?.length === 5, `got ${gallery.surfaces?.length}`);
  for (const s of gallery.surfaces || []) {
    assert(`gallery surface ${s.id} has file`, typeof s.file === "string");
    assert(`gallery surface ${s.id} file exists`, existsSync(join(root, s.file)), s.file);
  }
}

// ── Section 4: Theme strategy ──
console.log("\n== Theme strategy ==");
const themeCases = [
  { file: "examples/theme-cases/paper-light-doc.rk.md", theme: "paper-light" },
  { file: "examples/theme-cases/editorial-kami-doc.rk.md", theme: "editorial-kami" },
  { file: "examples/theme-cases/dark-pro-dev.rk.md", theme: "dark-pro" },
  { file: "examples/theme-cases/amber-terminal-runbook.rk.md", theme: "amber-terminal" },
];
assert("theme strategy doc exists", existsSync(join(root, "docs/theme-strategy.md")));
for (const c of themeCases) {
  assert(`${c.file}: exists`, existsSync(join(root, c.file)));
  const r = run(`node packages/cli/bin/renderkit.mjs validate ${c.file} --json`);
  let parsed;
  try { parsed = JSON.parse(r.stdout); } catch { parsed = null; }
  assert(`${c.file}: validates`, r.code === 0 && parsed?.ok === true, `exit=${r.code}`);
  assert(`${c.file}: theme=${c.theme}`, parsed?.model?.theme === c.theme, `got ${parsed?.model?.theme}`);
  assert(`${c.file}: covers multiple blocks`, (parsed?.model?.blocks?.length ?? 0) >= 5, `got ${parsed?.model?.blocks?.length ?? "n/a"}`);
}
assert("theme cases cover 4 supported themes", new Set(themeCases.map(c => c.theme)).size === 4);

// ── Section 5: Rendering capabilities ──
console.log("\n== Rendering capabilities ==");
const diagramCase = run("node packages/cli/bin/renderkit.mjs validate examples/capabilities/diagram-engines.rk.md --json");
let diagramParsed;
try { diagramParsed = JSON.parse(diagramCase.stdout); } catch { diagramParsed = null; }
const engines = new Set((diagramParsed?.model?.blocks || []).filter(b => b.type === "diagram").map(b => b.props?.engine));
for (const engine of ["mermaid", "svg", "echarts", "infographic", "plantuml", "d2"]) {
  assert(`diagram case covers ${engine}`, engines.has(engine));
}
const gridCase = run("node packages/cli/bin/renderkit.mjs validate examples/capabilities/grid-layout.rk.md --json");
let gridParsed;
try { gridParsed = JSON.parse(gridCase.stdout); } catch { gridParsed = null; }
const grids = (gridParsed?.model?.blocks || []).filter(b => b.type === "grid");
assert("grid layout case has grid blocks", grids.length >= 2, `got ${grids.length}`);
assert("grid blocks have children", grids.every(g => (g.props?.children?.length ?? 0) >= 2));

const productCase = run("node packages/cli/bin/renderkit.mjs validate examples/capabilities/product-system.rk.md --json");
let productParsed;
try { productParsed = JSON.parse(productCase.stdout); } catch { productParsed = null; }
const productTypes = new Set((productParsed?.model?.blocks || []).flatMap(b => [b.type, ...(b.props?.children || []).map(c => c.type)]));
assert("product system case validates", productCase.code === 0 && productParsed?.ok === true, `exit=${productCase.code}`);
for (const type of ["summary", "callout", "decision-card", "diagram", "table", "code", "grid"]) {
  assert(`product system case covers ${type}`, productTypes.has(type));
}
const productDiagram = (productParsed?.model?.blocks || []).find(b => b.id === "rollout-flow");
assert("product system diagram shorthand infers mermaid", productDiagram?.props?.engine === "mermaid");
assert("product system diagram shorthand has body", (productDiagram?.props?.code || "").includes("flowchart LR"));
const productChart = (productParsed?.model?.blocks || []).find(b => b.id === "latency-trend");
assert("product system chart shorthand supports echarts-line", productChart?.props?.engine === "echarts-line");
assert("product system chart shorthand has csv-like data", (productChart?.props?.code || "").includes("window,p50,p95"));

const richCase = run("node packages/cli/bin/renderkit.mjs validate examples/capabilities/rich-media-tabs.rk.md --json");
let richParsed;
try { richParsed = JSON.parse(richCase.stdout); } catch { richParsed = null; }
const richBlocks = richParsed?.model?.blocks || [];
assert("rich media tabs case validates", richCase.code === 0 && richParsed?.ok === true, `exit=${richCase.code}`);
assert("rich media tabs case has image block", richBlocks.some(b => b.type === "image"));
const tabsBlock = richBlocks.find(b => b.type === "tabs");
assert("rich media tabs case has tabs block", !!tabsBlock);
assert("tabs block has two tabs", (tabsBlock?.props?.tabs?.length || 0) === 2, `got ${tabsBlock?.props?.tabs?.length || 0}`);
assert("tabs contain nested blocks", (tabsBlock?.props?.tabs || []).every(t => (t.blocks?.length || 0) >= 2));

// ── Section 6: Web build ──
console.log("\n== Web build ==");
try {
  execSync("pnpm --filter @renderkit/web build", { cwd: root, stdio: "inherit", encoding: "utf8" });
  pass++;
  console.log("  ✓ @renderkit/web build succeeded");
} catch {
  fail++;
  console.log("  ✗ @renderkit/web build failed");
}

// ── Summary ──
console.log(`\n${"=".repeat(40)}`);
console.log(`Results: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("VERIFY FAILED\n");
  process.exit(1);
} else {
  console.log("ALL GOOD\n");
}
