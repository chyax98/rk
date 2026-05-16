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

// ── Section 3: Web build ──
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
