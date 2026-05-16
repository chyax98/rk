# RenderKit 1.0 Product Pass 4 — Persistent Highlights and Comment Lifecycle

Status: implemented and verified  
Date: 2026-05-17

## Objective

Continue productizing the RenderKit review surface. Pass 3 introduced selection-aware comments and a supporting pane. Pass 4 makes those comments feel more like a mature document product by adding:

1. Persistent rendered quote highlights for open selector comments.
2. Resolve / Reopen lifecycle in the Web UI.
3. Comment status API coverage.
4. Smoke verification that resolved comments leave Agent feedback and reopened comments return.

The product boundary remains unchanged: the Web UI collects review signals; the Agent edits `.rk.md` source.

## Implemented changes

### 1. Persistent quote highlights

File:

```text
apps/web/app/a/[id]/ArtifactView.jsx
```

Behavior:

- Open comments with `selector.exact` are highlighted in the rendered document.
- The implementation uses the browser Custom Highlight API when available:

```text
CSS.highlights.set('rk-comment-quotes', new Highlight(...ranges))
```

- Runtime CSS for `::highlight(rk-comment-quotes)` is injected from the client component to avoid build-time CSS parser warnings.
- Resolved comments are excluded from the highlight set.

Limitations:

- This is best-effort quote matching against the current rendered block text.
- It currently highlights the first matching text node in a block.
- It does not yet implement full re-anchoring after significant Agent edits.

### 2. Resolve / Reopen comment API

Files:

```text
apps/web/lib/store.mjs
apps/web/app/api/artifacts/[id]/comments/[commentId]/route.js
```

New API:

```http
PATCH /api/artifacts/:id/comments/:commentId
Content-Type: application/json

{ "status": "resolved" }
```

or:

```json
{ "status": "open" }
```

Behavior:

- `resolved` comments record:
  - `resolvedAtRevision`
  - `resolvedBy`
  - `resolvedAt`
- Reopened comments remove resolved fields and record `reopenedAt`.
- Agent feedback still returns only `open` and `orphaned` comments.

### 3. Web UI lifecycle controls

Files:

```text
apps/web/app/a/[id]/ArtifactView.jsx
apps/web/app/style.css
```

Behavior:

- Each comment card has a `Resolve` action when open.
- Resolved comments show `Reopen`.
- Resolved cards are visually muted and strike through quote/body content.
- Opening/reopening updates local UI state without a full page reload.
- Highlight set updates after status changes.

### 4. Nested block correctness hardening

File:

```text
apps/web/lib/store.mjs
```

Additional hardening:

- Revision `blockIds` now include nested grid children.
- Diffing now includes flattened nested blocks.
- Orphan detection now uses flattened blocks.

This prevents comments on grid child blocks from being incorrectly orphaned during revision updates.

## Verification

### Deterministic verifier

```bash
pnpm verify
```

Result:

```text
Results: 163 passed, 0 failed
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

New smoke coverage:

- POST selector comment.
- Confirm selector stored.
- Confirm feedback includes selector comment.
- Resolve selector comment.
- Confirm resolved selector comment leaves feedback.
- Reopen selector comment.

### Browser verification

Commands used:

```bash
pw session recreate renderkit-review --open 'http://localhost:3737/a/art_2c68c48f39?rev=2'
pw errors -s renderkit-review
pw code -s renderkit-review '(async (page) => await page.evaluate(() => ({has: !!CSS.highlights?.get?.("rk-comment-quotes"), size: CSS.highlights?.get?.("rk-comment-quotes")?.size || 0})))'
pw click -s renderkit-review --selector '.rk-floating-tools button:first-child'
pw get -s renderkit-review --selector '.rk-review-pane' --fact count
pw click -s renderkit-review --text Resolve
pw code -s renderkit-review '(async (page) => await page.evaluate(() => ({size: CSS.highlights?.get?.("rk-comment-quotes")?.size || 0, resolved: [...document.querySelectorAll(".rk-comment-card")].some(el => el.dataset.status === "resolved")})))'
pw click -s renderkit-review --text Reopen
pw code -s renderkit-review '(async (page) => await page.evaluate(() => ({size: CSS.highlights?.get?.("rk-comment-quotes")?.size || 0, open: [...document.querySelectorAll(".rk-comment-card")].some(el => el.dataset.status === "open")})))'
```

Evidence files:

```text
.pw-evidence/product-system-pass4-highlight.png
.pw-evidence/product-system-pass4-resolved.png
```

Observed:

- Browser errors: `0` visible errors.
- Initial Custom Highlight state: `{ has: true, size: 1 }`.
- Review pane exists: `.rk-review-pane` count = `1`.
- After Resolve: `{ size: 0, resolved: true }`.
- After Reopen: `{ size: 1, open: true }`.

## Remaining gaps after pass 4

Still incomplete for a fully mature comment system:

1. Multiple matches / disambiguation using prefix and suffix during highlight lookup.
2. Robust re-anchoring after Agent edits and source revisions.
3. Comment filters: open/resolved/orphaned.
4. Inline side markers aligned to highlighted ranges.
5. Keyboard-accessible selection toolbar flow.
6. Automated Playwright spec file instead of only `pw` evidence commands.
7. Visual polish for comment rail density and thread hierarchy.

## Conclusion

Pass 4 turns selection comments into a more mature review loop: quote highlights persist in the rendered document, comments can be resolved/reopened in the UI, and Agent feedback respects lifecycle state. This is still not a complete Notion/Feishu-grade comment system, but it closes the biggest lifecycle gap from Pass 3.
