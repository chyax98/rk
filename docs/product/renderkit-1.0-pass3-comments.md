# RenderKit 1.0 Product Pass 3 — Lightweight Comments and Supporting Pane

Status: implemented and verified  
Date: 2026-05-17

## Objective

Continue building RenderKit toward a mature Agent-to-UI technical document product by improving the human review surface. The target is closer to Feishu/Notion/Confluence-style review behavior while preserving the product boundary: humans comment; the Agent edits `.rk.md` source.

This pass focuses on:

1. Selection-aware comments, so a human can comment on a specific phrase rather than only a whole block.
2. A supporting pane on wide technical surfaces, so comments are visible beside the document instead of only inside a modal drawer.
3. Feedback metadata that gives the Agent a robust quote anchor.

## Implemented changes

### 1. Selection-aware comment capture

Files:

```text
apps/web/app/a/[id]/ArtifactView.jsx
apps/web/app/style.css
```

Behavior:

- User selects text inside any RenderKit block.
- RenderKit captures the nearest `data-block-id`.
- A lightweight floating action appears: `Comment on selection`.
- Clicking it enables Review mode and opens the comment surface.
- The selected text is shown in the comment composer.

The captured selector shape follows the W3C Web Annotation `TextQuoteSelector` idea:

```json
{
  "type": "TextQuoteSelector",
  "exact": "CloudOps 4.7 is ready",
  "prefix": "EXECUTIVE SUMMARY\n",
  "suffix": " for staged rollout "
}
```

This is not yet full inline highlight persistence, but it is a concrete step from block-only comments toward phrase-level annotations.

### 2. Supporting pane for wide review surfaces

Files:

```text
apps/web/app/a/[id]/ArtifactView.jsx
apps/web/app/style.css
```

Wide surfaces now use a persistent review pane when Review mode is active:

```text
engineering-plan
review-report
data-report-lite
```

Behavior:

- Default reading mode stays clean.
- Review mode turns on a right supporting pane.
- The pane contains selected block details, source, selected quote, comments, and Agent feedback command.
- On narrower screens, CSS falls back to fixed overlay behavior.

This follows the mature “primary content + supporting pane” pattern identified in the RenderKit 1.0 research notes.

### 3. Comment model stores selectors

Files:

```text
apps/web/lib/store.mjs
apps/web/app/api/artifacts/[id]/comments/route.js
```

Changes:

- `addComment()` now accepts `selector` metadata.
- Comment records persist `selector` when present.
- `getFeedback()` includes `selector` so the Agent can use quote context.
- Block lookup now supports nested grid children through `findBlockById()`.

### 4. Comment cards show quote context

Files:

```text
apps/web/app/a/[id]/ArtifactView.jsx
apps/web/app/style.css
```

Comment cards now show `selector.exact` as a quote when available. This helps the human and Agent see what phrase the comment refers to.

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
Results: 21 passed, 0 failed
ALL GOOD
```

### Browser verification

Commands used:

```bash
pw session recreate renderkit-review --open 'http://localhost:3737/a/art_2c68c48f39?rev=2'
# Programmatically select text in exec-summary and dispatch mouseup.
pw get -s renderkit-review --selector '.rk-selection-menu' --fact count
pw click -s renderkit-review --text 'Comment on selection'
pw get -s renderkit-review --selector '.rk-review-pane' --fact count
pw get -s renderkit-review --selector '.rk-quote-anchor' --fact count
pw fill -s renderkit-review --selector '.rk-review-pane textarea' 'Please tighten this launch summary around the release decision.'
pw click -s renderkit-review --text 'Add comment'
pw errors -s renderkit-review
```

Evidence files:

```text
.pw-evidence/product-system-pass3-selection-menu.png
.pw-evidence/product-system-pass3-comment-pane.png
```

Observed:

- `.rk-selection-menu` count = `1` after selecting text.
- `.rk-review-pane` count = `1` after entering Review mode on a wide surface.
- `.rk-quote-anchor` count = `1` in the composer.
- Comment POST returned `200`.
- Browser errors: `0` visible errors.
- Smoke verifier now also posts a selector comment and confirms feedback includes the selector.

### Feedback verification

Command:

```bash
node packages/cli/bin/renderkit.mjs feedback examples/capabilities/product-system.rk.md --json
```

Observed selector in feedback:

```json
{
  "blockId": "exec-summary",
  "exact": "CloudOps 4.7 is ready",
  "prefix": "EXECUTIVE SUMMARY\n",
  "suffix": " for staged rollout "
}
```

## Remaining gaps after pass 3

This pass is not the final comment system. Remaining important gaps:

1. Persistent rendered text highlights after reload.
2. Robust selector re-anchoring after Agent edits source.
3. Resolve/reopen UI in the Web surface.
4. Comment filtering: open/resolved/orphaned.
5. True inline markers next to text ranges, not just quoted context in pane.
6. Better accessibility for selection toolbar and pane navigation.
7. Automated Playwright test file rather than manual `pw` evidence commands.

## Conclusion

Pass 3 upgrades RenderKit from block-only review to selection-aware comments with Agent-visible quote anchors and a wide-screen supporting pane. It keeps the core product boundary intact: the Web surface collects review signals; the Agent remains responsible for editing `.rk.md` source.
