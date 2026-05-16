# RenderKit 1.0 Product Pass 6 — Editorial/Product Components

Status: implemented and verified  
Date: 2026-05-17

## Objective

Continue improving RenderKit product quality by adding polished, Notion/blog/product-doc style blocks. Prior passes added layout, comments, tables, code highlighting, chart shorthand, images, and tabs. Pass 6 adds three primitives that mature technical documents commonly need:

1. KPI/stat cards.
2. Readiness checklists.
3. Pull quotes / principle quotes.

These are meant to help an Agent compose decision-ready documents from high-level building blocks instead of raw Markdown lists.

## Implemented changes

### 1. `stat` / `metric` block

Files:

```text
packages/dsl/src/index.mjs
packages/blocks/src/StatBlock.jsx
packages/blocks/src/registry.jsx
packages/blocks/src/index.jsx
packages/design/src/blocks.css
```

DSL:

```md
:::metric{id="adoption" label="Adoption" value="74%" delta="+18%" tone="success"}
Share of artifacts using visual blocks.
:::
```

Notes:

- `metric` is an alias for `stat`.
- `value` is required.
- Missing value emits `RK_STAT_VALUE_REQUIRED`.
- Supports tones: `neutral`, `success`, `warning`, `danger`.

### 2. `checklist` / `todo` block

Files:

```text
packages/dsl/src/index.mjs
packages/blocks/src/ChecklistBlock.jsx
packages/blocks/src/registry.jsx
packages/blocks/src/index.jsx
packages/design/src/blocks.css
```

DSL:

```md
:::todo{id="ship-checklist" title="Readiness checklist"}
- [x] Reading-first layout
- [x] Selection comments
- [ ] Robust re-anchoring
:::
```

Notes:

- `todo` is an alias for `checklist`.
- Parses checked and unchecked markdown task list items.
- Missing items emits `RK_CHECKLIST_BODY_REQUIRED`.

### 3. `quote` block

Files:

```text
packages/dsl/src/index.mjs
packages/blocks/src/QuoteBlock.jsx
packages/blocks/src/registry.jsx
packages/blocks/src/index.jsx
packages/design/src/blocks.css
```

DSL:

```md
:::quote{id="principle" cite="RenderKit principle" role="Agent-to-UI"}
The artifact should make the next decision obvious before the reader opens raw source.
:::
```

Notes:

- Designed for product principles, reviewer callouts, blog-style pull quotes, and executive summaries.
- Missing body emits `RK_QUOTE_BODY_REQUIRED`.

### 4. Capability example

New file:

```text
examples/capabilities/editorial-components.rk.md
```

Covers:

- `metric` stat cards in a grid.
- `quote` pull quote.
- `todo` checklist with checked and unchecked items.

### 5. Authoring skill updated

File:

```text
skills/renderkit-authoring/SKILL.md
```

Added:

- `stat` / `metric` guidance.
- `checklist` / `todo` guidance.
- `quote` guidance.
- Updated surface recommendations.
- Updated error code table.

## Verification

### Deterministic verifier

```bash
pnpm verify
```

Result:

```text
Results: 183 passed, 0 failed
ALL GOOD
```

New verifier coverage:

- `examples/capabilities/editorial-components.rk.md` validates.
- Case covers `stat`, `checklist`, and `quote`.
- Checklist parses both checked and unchecked items.

### Smoke verifier

```bash
pnpm verify:smoke
```

Result:

```text
Results: 24 passed, 0 failed
ALL GOOD
```

### Browser verification

Commands used:

```bash
node packages/cli/bin/renderkit.mjs push examples/capabilities/editorial-components.rk.md --json
pw session recreate renderkit-review --open 'http://localhost:3737/a/art_5a667a36eb'
pw errors -s renderkit-review
pw get -s renderkit-review --selector '.rk-stat-block' --fact count
pw get -s renderkit-review --selector '.rk-checklist-block' --fact count
pw get -s renderkit-review --selector '.rk-quote-block' --fact count
pw screenshot -s renderkit-review --path .pw-evidence/editorial-components-pass6.png
```

Evidence:

```text
.pw-evidence/editorial-components-pass6.png
```

Observed:

- Browser errors: `0` visible errors.
- `.rk-stat-block` count = `3`.
- `.rk-checklist-block` count = `1`.
- `.rk-quote-block` count = `1`.

## Remaining gaps after pass 6

Important product gaps still remain:

1. Comparison cards / before-after blocks.
2. Timeline / sequence-of-events blocks.
3. Callout icons and richer tone language.
4. Stronger typography/token pass inspired by Apple/Notion/blog systems.
5. Local asset serving for image files.
6. Image zoom/lightbox.
7. Automated Playwright spec files.
8. Accessibility audit for all new interactive blocks.

## Conclusion

Pass 6 adds editorial/product-document primitives that make RenderKit artifacts feel less like decorated Markdown and more like mature decision documents. The Agent can now compose KPI rows, readiness gates, and pull-quote principles directly in `.rk.md`.
