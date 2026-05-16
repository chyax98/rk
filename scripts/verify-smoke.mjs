#!/usr/bin/env node
/**
 * pnpm verify:smoke — server-dependent smoke test.
 * If server is down, exit 0 with SKIPPED.
 * If running: push alpha-showcase, status, feedback; assert JSON shapes.
 */
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const CLI = "node packages/cli/bin/renderkit.mjs";
const FILE = "examples/alpha-showcase.rk.md";

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

// ── Check server ──
console.log("\n== Server check ==");
const srv = run(`${CLI} server status --json`);
if (srv.code !== 0) {
  console.log("  SKIPPED: server not running\n");
  process.exit(0);
}

let srvParsed;
try { srvParsed = JSON.parse(srv.stdout); } catch { srvParsed = null; }
assert("server status ok=true", srvParsed?.ok === true, `got ${srvParsed?.ok}`);
assert("server has endpoint", typeof srvParsed?.endpoint === "string");

// ── Push ──
console.log("\n== Push ==");
const push = run(`${CLI} push ${FILE} --json`);
let pushParsed;
try { pushParsed = JSON.parse(push.stdout); } catch { pushParsed = null; }

assert("push exit 0", push.code === 0, `got ${push.code}`);
assert("push ok=true", pushParsed?.ok === true, `got ${pushParsed?.ok}`);
assert("push has artifactId", typeof pushParsed?.artifactId === "string");
assert("push has revision", typeof pushParsed?.revision === "number");
assert("push has url", typeof pushParsed?.url === "string");

// ── Status ──
console.log("\n== Status ==");
const status = run(`${CLI} status ${FILE} --json`);
let statusParsed;
try { statusParsed = JSON.parse(status.stdout); } catch { statusParsed = null; }

assert("status exit 0", status.code === 0, `got ${status.code}`);
assert("status ok=true", statusParsed?.ok === true, `got ${statusParsed?.ok}`);
assert("status has artifact", typeof statusParsed?.artifact?.id === "string");
assert("status has currentRevision", typeof statusParsed?.artifact?.currentRevision === "number");

// ── Feedback ──
console.log("\n== Feedback ==");
const feedback = run(`${CLI} feedback ${FILE} --json`);
let feedbackParsed;
try { feedbackParsed = JSON.parse(feedback.stdout); } catch { feedbackParsed = null; }

assert("feedback exit 0", feedback.code === 0, `got ${feedback.code}`);
assert("feedback ok=true", feedbackParsed?.ok === true, `got ${feedbackParsed?.ok}`);
assert("feedback has openComments", Array.isArray(feedbackParsed?.openComments));

// ── Selection comment API ──
console.log("\n== Selection comment API ==");
const commentRes = await fetch(`${srvParsed.endpoint}/api/artifacts/${pushParsed.artifactId}/comments`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    blockId: "project-summary",
    text: "Smoke test quote comment",
    selector: { type: "TextQuoteSelector", exact: "RenderKit", prefix: "", suffix: " is local" }
  })
});
const commentJson = await commentRes.json();
assert("selection comment post ok=true", commentJson?.ok === true, commentJson?.error || "");
assert("selection comment stores selector", commentJson?.comment?.selector?.exact === "RenderKit", JSON.stringify(commentJson?.comment?.selector || null));
const feedback2 = run(`${CLI} feedback ${FILE} --json`);
let feedback2Parsed;
try { feedback2Parsed = JSON.parse(feedback2.stdout); } catch { feedback2Parsed = null; }
assert("feedback includes selector comment", (feedback2Parsed?.openComments || []).some(c => c.id === commentJson?.comment?.id && c.selector?.exact === "RenderKit"));

// ── Diagram render API ──
console.log("\n== Diagram render API ==");
async function postDiagram(engine, code) {
  const res = await fetch(`${srvParsed.endpoint}/api/render/diagram`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ engine, code })
  });
  return await res.json();
}
const d2 = await postDiagram("d2", "x -> y");
assert("d2 render ok=true", d2?.ok === true, d2?.error || "");
assert("d2 render returns svg", typeof d2?.svg === "string" && d2.svg.startsWith("<svg"), `len=${d2?.svg?.length ?? 0}`);
const plantuml = await postDiagram("plantuml", "@startuml\nAlice -> Bob: hi\n@enduml");
assert("plantuml render ok=true", plantuml?.ok === true, plantuml?.error || "");
assert("plantuml render returns svg", typeof plantuml?.svg === "string" && plantuml.svg.startsWith("<svg"), `len=${plantuml?.svg?.length ?? 0}`);

// ── Summary ──
console.log(`\n${"=".repeat(40)}`);
console.log(`Results: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("SMOKE FAILED\n");
  process.exit(1);
} else {
  console.log("ALL GOOD\n");
}
