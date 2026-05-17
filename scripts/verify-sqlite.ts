#!/usr/bin/env node
/**
 * pnpm verify:sqlite — deterministic SQLite hardening tests.
 * Exercises store.mjs directly. No server/browser required.
 *
 * Covers:
 *   - Multiple artifacts
 *   - Multiple revisions with diff tracking
 *   - Comments with TextQuoteSelector
 *   - Resolve / reopen lifecycle
 *   - Nested block feedback
 *   - Orphaned comments on block removal
 *   - Revision with auto-resolve
 *   - Edge cases (missing IDs, selector normalization)
 */
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

let pass = 0, fail = 0;
const artifactIds = [];

function assert(label, ok, detail = "") {
  if (ok) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}${detail ? " — " + detail : ""}`); }
}

// ── Setup ──
console.log("\n== Setup ==");
const store = await import("../apps/web/lib/store.mjs");
await store.ensureStore();
assert("store initialized", true);

const uniqueTag = () => "test_" + crypto.randomBytes(3).toString("hex");

// ── Source builders ──
const FENCE = "`".repeat(3);

const makeSource = (tag, blocks) =>
`---
title: Test ${tag}
---

${blocks}
`;

function singleBlockSource(tag) {
  return makeSource(tag, `
:::summary{id="${tag}-summary"}
This is a test summary for ${tag}.
:::

:::callout{ id="${tag}-callout" tone="info" }
Important note about ${tag}.
:::

:::code{ id="${tag}-code" language="js" }
${FENCE}js
console.log("hello ${tag}");
${FENCE}
:::
`);
}

function nestedBlockSource(tag) {
  return makeSource(tag, `
::::grid{id="${tag}-grid" columns="2"}
:::callout{id="${tag}-nested-callout" tone="warning"}
Nested warning inside grid.
:::

:::stat{id="${tag}-nested-stat" label="Uptime" value="99.9%"}
:::
::::

:::::tabs{id="${tag}-tabs"}
::::tab{id="${tag}-tab1" label="Overview"}
:::summary{id="${tag}-tab-summary"}
Tab summary content.
:::
::::
::::tab{id="${tag}-tab2" label="Details"}
:::code{id="${tag}-tab-code" language="sh"}
${FENCE}sh
echo details
${FENCE}
:::
::::
:::::
`);
}

function revisedSource(tag) {
  return makeSource(tag, `
:::summary{id="${tag}-summary"}
This is a REVISED summary for ${tag}.
:::

:::callout{id="${tag}-callout" tone="warning"}
Updated callout for ${tag}.
:::
`);
}

// ── Section 1: Multiple Artifacts ──
console.log("\n== Multiple Artifacts ==");

const t1 = uniqueTag();
const t2 = uniqueTag();

const art1 = await store.createArtifact(singleBlockSource(t1), `Artifact ${t1}`);
assert("create artifact 1 ok", art1.ok === true, JSON.stringify(art1.errors || art1.error));
assert("create artifact 1 has id", typeof art1.artifact?.id === "string");
assert("create artifact 1 revision=1", art1.revision === 1);
artifactIds.push(art1.artifact.id);

const art2 = await store.createArtifact(singleBlockSource(t2), `Artifact ${t2}`);
assert("create artifact 2 ok", art2.ok === true, JSON.stringify(art2.errors || art2.error));
assert("create artifact 2 has id", typeof art2.artifact?.id === "string");
assert("create artifact 2 revision=1", art2.revision === 1);
artifactIds.push(art2.artifact.id);

assert("artifact 1 != artifact 2", art1.artifact.id !== art2.artifact.id);

const meta1 = await store.getArtifactMeta(art1.artifact.id);
assert("get meta art1 returns id", meta1?.id === art1.artifact.id);
assert("get meta art1 currentRevision=1", meta1?.currentRevision === 1);

const meta2 = await store.getArtifactMeta(art2.artifact.id);
assert("get meta art2 returns id", meta2?.id === art2.artifact.id);

const list = await store.listArtifacts();
assert("listArtifacts returns array", Array.isArray(list));
assert("listArtifacts includes both", list.length >= 2);

// ── Section 2: Multiple Revisions ──
console.log("\n== Multiple Revisions ==");

const rev2 = await store.addRevision(art1.artifact.id, revisedSource(t1));
assert("add revision 2 ok", rev2.ok === true, JSON.stringify(rev2.errors || rev2.error));
assert("revision 2 number=2", rev2.revision === 2);
assert("revision 2 has diff", typeof rev2.diff === "object");
assert("revision 2 has model", rev2.model != null);
assert("revision 2 diff tracks modified", rev2.diff.modifiedBlocks.length >= 1,
  `modified=${rev2.diff.modifiedBlocks?.length}`);

const rev3 = await store.addRevision(art1.artifact.id, revisedSource(t1));
assert("add revision 3 (same content) ok", rev3.ok === true);
assert("revision 3 number=3", rev3.revision === 3);

// Revision history integrity
const r1 = await store.getRevision(art1.artifact.id, 1);
const r2 = await store.getRevision(art1.artifact.id, 2);
const r3 = await store.getRevision(art1.artifact.id, 3);
assert("get revision 1 exists", r1 !== null);
assert("get revision 2 exists", r2 !== null);
assert("get revision 3 exists", r3 !== null);
assert("revision 1 number=1", r1?.number === 1);
assert("revision 2 number=2", r2?.number === 2);
assert("revision 3 number=3", r3?.number === 3);
assert("revisions have different source hashes", r1?.sourceHash !== r2?.sourceHash);

const metaAfter = await store.getArtifactMeta(art1.artifact.id);
assert("meta currentRevision=3 after 3 revisions", metaAfter?.currentRevision === 3);

// Full artifact fetch with default (latest) revision
const full = await store.getArtifact(art1.artifact.id);
assert("getArtifact returns meta", full?.meta?.id === art1.artifact.id);
assert("getArtifact returns revision", full?.revision?.number === 3);
assert("getArtifact returns comments array", Array.isArray(full?.comments));

// Full artifact fetch with specific revision
const fullRev2 = await store.getArtifact(art1.artifact.id, 2);
assert("getArtifact(2) revision number=2", fullRev2?.revision?.number === 2);

// ── Section 3: Comments with Selectors ──
console.log("\n== Comments with Selectors ==");

const cmt1 = await store.addComment(art1.artifact.id, `${t1}-summary`, "Test comment on summary", {
  type: "TextQuoteSelector",
  exact: "REVISED summary",
  prefix: "a ",
  suffix: " for"
});
assert("add comment with selector ok", cmt1.ok === true, cmt1.error || "");
assert("comment has id", typeof cmt1.comment?.id === "string");
assert("comment selector preserved", cmt1.comment?.selector?.exact === "REVISED summary");
assert("comment selector type", cmt1.comment?.selector?.type === "TextQuoteSelector");
assert("comment status=open", cmt1.comment?.status === "open");
assert("comment createdAtRevision=3", cmt1.comment?.createdAtRevision === 3);
assert("comment has blockSnapshot", cmt1.comment?.blockSnapshot !== null);
assert("comment blockSnapshot has id", cmt1.comment?.blockSnapshot?.id === `${t1}-summary`);

// Plain comment (no selector)
const cmt2 = await store.addComment(art1.artifact.id, `${t1}-callout`, "Plain comment no selector");
assert("add plain comment ok", cmt2.ok === true);
assert("plain comment no selector", cmt2.comment?.selector === null);
assert("plain comment text preserved", cmt2.comment?.text === "Plain comment no selector");

// Comment on artifact 2 to test isolation
const cmt3 = await store.addComment(art2.artifact.id, `${t2}-code`, "Comment on art2");
assert("add comment on art2 ok", cmt3.ok === true);

// Verify isolation
const comments1 = await store.getComments(art1.artifact.id);
const comments2 = await store.getComments(art2.artifact.id);
assert("art1 has 2 comments", comments1.length === 2, `got ${comments1.length}`);
assert("art2 has 1 comment", comments2.length === 1, `got ${comments2.length}`);

// Comment on nonexistent block fails
const cmtBad = await store.addComment(art1.artifact.id, "nonexistent-block", "Should fail");
assert("comment on missing block fails", cmtBad.ok === false);
assert("comment on missing block returns 404", cmtBad.status === 404);

// ── Section 4: Resolve / Reopen Lifecycle ──
console.log("\n== Resolve / Reopen ==");

const resolveRes = await store.updateCommentStatus(art1.artifact.id, cmt1.comment.id, "resolved");
assert("resolve ok", resolveRes.ok === true);
assert("resolve status=resolved", resolveRes.comment?.status === "resolved");
assert("resolve has resolvedBy", resolveRes.comment?.resolvedBy === "human");
assert("resolve has resolvedAt", resolveRes.comment?.resolvedAt != null);
assert("resolve has resolvedAtRevision", resolveRes.comment?.resolvedAtRevision === metaAfter.currentRevision);

// Verify feedback excludes resolved
const fb1 = await store.getFeedback(art1.artifact.id);
assert("feedback after resolve: art1 openComments=1", fb1.openComments.length === 1,
  `got ${fb1.openComments.length}`);
assert("feedback excludes resolved comment", !fb1.openComments.some(c => c.id === cmt1.comment.id));

// Reopen
const reopenRes = await store.updateCommentStatus(art1.artifact.id, cmt1.comment.id, "open");
assert("reopen ok", reopenRes.ok === true);
assert("reopen status=open", reopenRes.comment?.status === "open");
assert("reopen has reopenedAt", reopenRes.comment?.reopenedAt != null);
assert("reopen clears resolvedAt", reopenRes.comment?.resolvedAt == null);
assert("reopen clears resolvedBy", reopenRes.comment?.resolvedBy == null);
assert("reopen clears resolvedAtRevision", reopenRes.comment?.resolvedAtRevision == null);

// Feedback now shows 2 open comments again
const fb2 = await store.getFeedback(art1.artifact.id);
assert("feedback after reopen: openComments=2", fb2.openComments.length === 2,
  `got ${fb2.openComments.length}`);

// Invalid status rejected
const badStatus = await store.updateCommentStatus(art1.artifact.id, cmt1.comment.id, "invalid");
assert("invalid status rejected", badStatus.ok === false);
assert("invalid status returns 400", badStatus.status === 400);

// ── Section 5: Nested Block Feedback ──
console.log("\n== Nested Block Feedback ==");

const t3 = uniqueTag();
const art3 = await store.createArtifact(nestedBlockSource(t3), `Nested ${t3}`);
assert("create artifact 3 (nested) ok", art3.ok === true, JSON.stringify(art3.errors || art3.error));
if (!art3.ok) process.exit(1);
artifactIds.push(art3.artifact.id);

// Comment on deeply nested block (callout inside grid)
const cmtNested = await store.addComment(art3.artifact.id, `${t3}-nested-callout`, "Comment on nested callout");
assert("comment on nested block ok", cmtNested.ok === true);
assert("nested comment has blockSnapshot", cmtNested.comment?.blockSnapshot?.id === `${t3}-nested-callout`);
assert("nested comment blockSnapshot type=callout", cmtNested.comment?.blockSnapshot?.type === "callout");

// Comment on tab content (code inside tab inside tabs)
const cmtTab = await store.addComment(art3.artifact.id, `${t3}-tab-code`, "Comment on tab code block");
assert("comment on tab nested block ok", cmtTab.ok === true);

// Feedback includes nested block comments
const fbNested = await store.getFeedback(art3.artifact.id);
assert("nested feedback has 2 open comments", fbNested.openComments.length === 2);
assert("nested feedback includes nested-callout", fbNested.openComments.some(c => c.blockId === `${t3}-nested-callout`));
assert("nested feedback includes tab-code", fbNested.openComments.some(c => c.blockId === `${t3}-tab-code`));

// Verify sourceRange on feedback items
const nestedCmtFeedback = fbNested.openComments.find(c => c.blockId === `${t3}-nested-callout`);
assert("nested feedback has sourceRange", nestedCmtFeedback?.sourceRange != null);
assert("nested feedback has sourceExcerpt", nestedCmtFeedback?.sourceExcerpt != null);

// Verify neighbor context in feedback
assert("nested feedback has neighbors", nestedCmtFeedback?.neighbors != null);
assert("nested feedback neighbors.prev is array", Array.isArray(nestedCmtFeedback?.neighbors?.prev));
assert("nested feedback neighbors.next is array", Array.isArray(nestedCmtFeedback?.neighbors?.next));

// Comment on the grid parent block itself
const cmtGrid = await store.addComment(art3.artifact.id, `${t3}-grid`, "Comment on grid parent");
assert("comment on grid parent ok", cmtGrid.ok === true);
assert("grid parent comment blockSnapshot type=grid", cmtGrid.comment?.blockSnapshot?.type === "grid");

// ── Section 6: Orphaned Comments ──
console.log("\n== Orphaned Comments ==");

// art3 currently has nested blocks. Add a revision that removes the grid and tabs.
const removedSource = makeSource(t3, `
:::summary{ id="${t3}-tab-summary" }
Only summary remains.
:::
`);

const revOrphan = await store.addRevision(art3.artifact.id, removedSource);
assert("orphan revision ok", revOrphan.ok === true);
assert("orphan revision has diff", revOrphan.diff != null);
assert("orphan revision orphanedComments > 0", revOrphan.diff.orphanedComments.length >= 1,
  `got ${revOrphan.diff.orphanedComments?.length}`);

// Verify the orphaned comment appears in feedback with orphaned status
const fbOrphan = await store.getFeedback(art3.artifact.id);
const orphanedCmts = fbOrphan.openComments.filter(c => c.status === "orphaned");
assert("feedback includes orphaned comments", orphanedCmts.length >= 1,
  `got ${orphanedCmts.length}`);

// Orphaned comment still has blockSnapshot
const orphanedCmt = orphanedCmts[0];
assert("orphaned comment has blockSnapshot", orphanedCmt?.blockSnapshot != null);

// ── Section 7: Revision with auto-resolve ──
console.log("\n== Revision with auto-resolve ==");

// Create new artifact, add comment, then add revision that resolves it
const t4 = uniqueTag();
const art4 = await store.createArtifact(singleBlockSource(t4), `Auto-resolve ${t4}`);
assert("create artifact 4 ok", art4.ok === true, JSON.stringify(art4.errors || art4.error));
artifactIds.push(art4.artifact.id);

const cmtAuto = await store.addComment(art4.artifact.id, `${t4}-callout`, "Will be auto-resolved");
assert("auto-resolve comment created", cmtAuto.ok === true);

const revResolve = await store.addRevision(art4.artifact.id, revisedSource(t4), [cmtAuto.comment.id]);
assert("revision with resolve ok", revResolve.ok === true);
assert("revision resolved list includes comment", revResolve.resolved.includes(cmtAuto.comment.id));

// Verify comment is now resolved
const commentsAfterResolve = await store.getComments(art4.artifact.id);
const resolvedCmt = commentsAfterResolve.find(c => c.id === cmtAuto.comment.id);
assert("comment resolved after revision", resolvedCmt?.status === "resolved", `got ${resolvedCmt?.status}`);
assert("comment resolvedBy=agent", resolvedCmt?.resolvedBy === "agent");
assert("comment resolvedAtRevision=2", resolvedCmt?.resolvedAtRevision === 2);

// ── Section 8: Edge Cases ──
console.log("\n== Edge Cases ==");

// getArtifact with non-existent ID
const missing = await store.getArtifact("nonexistent_id");
assert("getArtifact nonexistent returns null", missing === null);

// getArtifactMeta with non-existent ID
const missingMeta = await store.getArtifactMeta("nonexistent_id");
assert("getArtifactMeta nonexistent returns null", missingMeta === null);

// getRevision with non-existent revision
const missingRev = await store.getRevision(art1.artifact.id, 999);
assert("getRevision nonexistent returns null", missingRev === null);

// addRevision with non-existent artifact
const badRev = await store.addRevision("nonexistent_id", singleBlockSource("x"));
assert("addRevision nonexistent fails", badRev.ok === false);
assert("addRevision nonexistent returns 404", badRev.status === 404);

// Selector normalization: empty exact -> null
const cmtEmptySelector = await store.addComment(art1.artifact.id, `${t1}-summary`, "Empty selector test", {
  type: "TextQuoteSelector",
  exact: ""
});
assert("empty selector normalized to null", cmtEmptySelector.comment?.selector === null);

// Selector normalization: trimmed and truncated
const longText = "x".repeat(600);
const cmtLongSelector = await store.addComment(art1.artifact.id, `${t1}-summary`, "Long selector test", {
  type: "TextQuoteSelector",
  exact: longText
});
assert("long selector truncated to 500", cmtLongSelector.comment?.selector?.exact.length <= 500);

// updateCommentStatus on non-existent artifact
const badUpdate = await store.updateCommentStatus("nonexistent", "cmt_fake", "resolved");
assert("update status on missing artifact fails", badUpdate.ok === false);
assert("update status on missing artifact returns 404", badUpdate.status === 404);

// getFeedback on non-existent artifact
const badFeedback = await store.getFeedback("nonexistent");
assert("getFeedback nonexistent returns null", badFeedback === null);

// ── Cleanup ──
console.log("\n== Cleanup ==");
const dbModule = await import("../apps/web/lib/db.mjs");
const db = dbModule.getDb();
const delArt = db.prepare("DELETE FROM artifacts WHERE id = ?");
const delRev = db.prepare("DELETE FROM revisions WHERE artifact_id = ?");
const delCmt = db.prepare("DELETE FROM comments WHERE artifact_id = ?");
const cleanup = db.transaction((ids) => {
  for (const id of ids) {
    delCmt.run(id);
    delRev.run(id);
    delArt.run(id);
  }
});
cleanup(artifactIds);
const remaining = db.prepare(
  "SELECT COUNT(*) as c FROM artifacts WHERE id IN (" + artifactIds.map(() => "?").join(",") + ")"
).get(...artifactIds);
assert("all test artifacts cleaned up", remaining.c === 0, `remaining=${remaining.c}`);

// ── Summary ──
console.log(`\n${"=".repeat(40)}`);
console.log(`Results: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("SQLITE VERIFY FAILED\n");
  process.exit(1);
} else {
  console.log("ALL GOOD\n");
}
