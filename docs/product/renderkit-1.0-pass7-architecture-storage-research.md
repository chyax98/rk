# RenderKit 1.0 Product Pass 7 — Architecture, SQLite, Narrative Blocks, Design Assets

Status: implemented and verified  
Date: 2026-05-17

## Why this pass exists

User feedback identified three problems:

1. Progress was too serial; future work should use multiple `worker` subagents in parallel.
2. DSL architecture was accumulating repeated `if/else` compiler dispatch.
3. The Web UI had too much visible metadata/comment chrome; the page must stay reading-first.
4. JSON-file storage was becoming too weak for line/selector/comment metadata; move to SQLite.
5. Six external top design repositories must be cloned, analyzed, documented, and considered for integration.

## Implemented changes

### 1. Parallel worker flywheel

Workers were used in parallel for:

- UI light-mode reduction.
- SQLite storage migration.
- External design-resource analysis.
- Narrative block productization attempt.

Policy going forward:

- Use `worker` for most implementation/research fan-out.
- Use `planner` only for major technical choices.
- Use `reviewer` sparingly because its concurrency is lower.
- After each large module: verify, document, commit, then launch the next worker batch.

### 2. DSL compiler registry refactor

File:

```text
packages/dsl/src/index.mjs
```

Before:

- Repeated compiler dispatch in top-level parse, grid children, and tabs children.
- Adding a block required editing multiple `if (name === ...)` chains.

After:

- Added `BLOCK_COMPILERS` as a single compiler registry.
- `KNOWN` derives from compiler keys plus structural `tab`.
- Added `compileBlock()` and `compileChildBlock()` helpers.
- Repeated dispatch chains removed; only `tab` remains as a structural special case.

Evidence:

```bash
/usr/bin/grep -n "if (name ===\|if (resolved.name ===" packages/dsl/src/index.mjs
# only tab structural validation remains
```

### 3. Narrative blocks: `comparison` and `timeline`

Files:

```text
packages/blocks/src/ComparisonBlock.jsx
packages/blocks/src/TimelineBlock.jsx
packages/blocks/src/registry.jsx
packages/blocks/src/index.jsx
packages/design/src/blocks.css
packages/dsl/src/index.mjs
examples/capabilities/narrative-blocks.rk.md
examples/fixtures/empty-comparison.rk.md
examples/fixtures/empty-timeline.rk.md
```

DSL aliases:

```text
compare  -> comparison
roadmap  -> timeline
```

Validation codes:

```text
RK_COMPARISON_BODY_REQUIRED
RK_TIMELINE_BODY_REQUIRED
```

Verifier coverage:

- narrative case validates;
- covers comparison/timeline/summary/quote;
- comparison has table headers and rows;
- timeline has items and varied statuses.

### 4. SQLite local storage

Files:

```text
apps/web/lib/db.mjs
apps/web/lib/store.mjs
apps/web/package.json
pnpm-lock.yaml
```

Storage path:

```text
~/.renderkit/data/renderkit.db
```

Tables:

```text
artifacts
revisions
comments
```

Preserved API signatures:

```text
ensureStore
listArtifacts
createArtifact
addRevision
getArtifactMeta
getArtifact
getRevision
getComments
addComment
updateCommentStatus
getFeedback
```

Important fixes made after worker output:

- Revision ids are artifact-scoped: `${artifactId}_rev_${number}` to avoid global `rev_1` primary-key collisions.
- Feedback now flattens nested block structures so nested/grid comments can be found.

Targeted SQLite validation:

```text
{"ok":true,"artifacts":["art_eee75d7f1d","art_94dbde6436"],"feedback":1,"revision":2}
```

### 5. Reading-first UI lightening

Files:

```text
apps/web/app/a/[id]/ArtifactView.jsx
apps/web/app/style.css
```

Behavior:

- Reading mode toolbar shows `💬`, not `💬 N`.
- Review mode toolbar shows `💬 N`.
- Reading mode comment markers are subtle dots.
- Review mode still exposes full comment list and metadata needed for review.

Browser evidence:

```text
.pw-evidence/narrative-sqlite-reading-pass7.png
.pw-evidence/narrative-sqlite-comment-subtle-pass7.png
.pw-evidence/narrative-sqlite-review-pass7.png
```

Observed with `pw`:

```text
Reading toolbar: Review☰💬⎘
Review toolbar:  Review☰💬 1⎘
.rk-block[data-rk-has-comments] count = 1
.rk-review-pane count = 1
.rk-comment-card count = 1
pw errors = 0 visible errors
```

### 6. External design resources cloned and analyzed

Clone root:

```text
research/design-assets/external-repos/
```

Git-ignored intentionally because these are external repositories with nested `.git` directories and large assets.

Durable docs:

```text
research/design-assets/top-design-resources-manifest.md
research/design-assets/renderkit-external-design-resources-analysis.md
docs/product/renderkit-1.0-design-resource-integration-plan.md
```

Analyzed repositories:

```text
glincker/thesvg
yizhiyanhua-ai/fireworks-tech-graph
haidang1810/md2html
nexu-io/html-anything
op7418/guizang-ppt-skill
nextlevelbuilder/ui-ux-pro-max-skill
```

Recommended priority:

1. md2html — document/print/a11y/component polish.
2. html-anything — anti-slop directives and skill registry convention.
3. fireworks-tech-graph — diagram visual language.
4. ui-ux-pro-max — design intelligence and token recommendations.
5. thesvg — icon source with license/trademark care.
6. guizang-ppt-skill — future deck/presentation surface.

## Verification

### Full verifier

```bash
pnpm verify
```

Result:

```text
Results: 207 passed, 0 failed
ALL GOOD
```

### Smoke verifier

```bash
pnpm verify:smoke
```

Result:

```text
Results: 24 passed, 0 failed
ALL GOOD
```

### Browser / interaction verification

Required `pw -h` was run and confirmed the CLI is available.

Artifact pushed through CLI/SQLite:

```text
artifactId: art_0142d8fcc2
url: http://localhost:3737/a/art_0142d8fcc2
```

Checks:

```bash
pw get --selector '.rk-comparison-block' --fact count  # 1
pw get --selector '.rk-timeline-block' --fact count    # 1
pw get --selector '.rk-floating-tools' --fact text     # reading mode: Review☰💬⎘
pw click --text Review
pw get --selector '.rk-floating-tools' --fact text     # review mode: Review☰💬 1⎘
pw get --selector '.rk-review-pane' --fact count       # 1
pw get --selector '.rk-comment-card' --fact count      # 1
pw errors                                              # 0 visible errors
```

## Remaining gaps

This does not complete the full active goal. Remaining high-value work:

1. More aggressive md2html-inspired typography/print/a11y polish.
2. Comment filters and inline side markers aligned to text ranges.
3. Robust quote-selector re-anchoring using prefix/suffix.
4. Stronger SQLite migration/backfill tooling for old JSON data if desired.
5. Automated Playwright spec files, not only manual `pw` evidence.
6. Diagram visual-language implementation from fireworks-tech-graph.
7. Optional icon source integration from thesvg.
8. Design-token recommendation workflow from ui-ux-pro-max.

## Next worker batch

Use parallel workers:

1. Reading/print/a11y polish from md2html.
2. Comment UI filters/markers/re-anchoring.
3. SQLite hardening and migration/test harness.
4. Diagram visual-language doc + first prototype fixture.
