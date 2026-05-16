# RenderKit 1.0 Product Pass 1 Implementation Log

Status: implemented and locally verified  
Date: 2026-05-17

## Objective

Respond to system-level product critique:

- Current rendered page looked too narrow and paper-like.
- UI chrome/comment affordances were too heavy for default reading.
- Design system had tokens but weak visual hierarchy.
- Technical documents lacked table support.
- DSL was too verbose for Agent authoring.
- Process documents and references must remain as repo assets for later review.

## Evidence before change

Browser evidence captured at:

```text
.pw-evidence/system-review-alpha.png
```

Observed issue: complete demo rendered in a centered ~900px column on a 1280px viewport, leaving large unused page margins. Block review tools were built into every block, making default view feel like review/debug mode rather than a polished document.

## Process assets saved

Research and multi-agent brainstorm outputs are now saved as repo assets:

```text
docs/product/renderkit-1.0-product-strategy.md
docs/product/renderkit-1.0-visual-layout-redesign.md
docs/product/renderkit-1.0-dsl-ergonomics.md
research/design-assets/renderkit-1.0-external-references.md
```

These document product strategy, visual layout critique, DSL ergonomics, and mature external references.

## Implemented changes

### 1. Surface-aware browser canvas

Files:

```text
apps/web/app/style.css
```

Changes:

- Added surface-aware `.rk-document` width.
- Wide surfaces now use a larger browser canvas:
  - `engineering-plan`
  - `review-report`
  - `data-report-lite`
- Narrow surfaces remain readable:
  - `decision-brief`
  - `runbook`
- Added responsive single-column fallback.
- Added print CSS that strips review chrome.

### 2. Reading-first UI with Review mode

Files:

```text
apps/web/app/a/[id]/ArtifactView.jsx
packages/blocks/src/BlockFrame.jsx
apps/web/app/style.css
packages/design/src/blocks.css
```

Changes:

- Default mode is now reading-first.
- Block ids, type badges, `⋯`, and comment buttons are hidden until `Review` mode is enabled.
- Floating toolbar now has a `Review` toggle.
- Opening comment drawer turns on review mode.
- Context menu is only active in review mode.

Product result: default rendered document is cleaner; review tools are explicit and intentional.

### 3. Block visual hierarchy pass

Files:

```text
packages/design/src/blocks.css
```

Changes:

- Structural blocks remain transparent.
- Summary/callout/decision blocks get lighter information-card styling.
- Code/diagram/table blocks get stronger embed containment.
- Decision card now visually emphasizes `Chosen`.
- Comment markers moved inside block to avoid clipping.
- Grid cells and wide surface layout use more available horizontal space.

### 4. Table block

Files:

```text
packages/dsl/src/index.mjs
packages/blocks/src/TableBlock.jsx
packages/blocks/src/registry.jsx
packages/design/src/blocks.css
```

New DSL:

```md
:::table{id="risk-table" title="Risk matrix" width="wide"}
| Area | Current signal | Decision impact | Owner |
|---|---|---|---|
| Queue latency | p95 142ms | Continue rollout | SRE |
:::
```

Parser emits:

```text
type: table
props: columns, rows, align, title, caption, width
```

### 5. DSL ergonomics baseline

Files:

```text
packages/dsl/src/index.mjs
skills/renderkit-authoring/SKILL.md
examples/capabilities/product-system.rk.md
```

Added aliases:

| Alias | Canonical |
|---|---|
| `sum` | `summary` |
| `note` | `callout` info |
| `warn` | `callout` warning |
| `alert` | `callout` danger |
| `ok` | `callout` success |
| `dec` | `decision-card` |
| `fig` | `diagram` |
| `src` | `code` |

Added decision shorthand:

```md
:::dec{id="rollout-decision" q="Should we proceed?" chosen="Proceed" status="approved"}
- Validation green.
- Rollback safe.
:::
```

Added diagram shorthand:

```md
:::fig{id="flow" caption="Flow"}
flowchart LR
  A --> B
:::
```

### 6. Product capability demo

New demo:

```text
examples/capabilities/product-system.rk.md
```

Purpose: complete demo for product-level verification. It covers:

- wide engineering-plan layout
- summary
- grid
- callout aliases
- decision shorthand
- inline Mermaid diagram shorthand
- table block
- code block
- review-mode expectation

## Verification

### Deterministic harness

```bash
pnpm verify
```

Result:

```text
Results: 161 passed, 0 failed
ALL GOOD
```

Coverage added:

- `examples/capabilities/product-system.rk.md` validates.
- Product case covers `summary`, `callout`, `decision-card`, `diagram`, `table`, `code`, `grid`.
- Diagram shorthand infers Mermaid.
- Diagram shorthand body contains `flowchart LR`.

### Smoke harness

```bash
pnpm verify:smoke
```

Result:

```text
Results: 18 passed, 0 failed
ALL GOOD
```

### Browser verification

Commands used:

```bash
node packages/cli/bin/renderkit.mjs push examples/capabilities/product-system.rk.md --json
pw session recreate renderkit-review --open http://localhost:3737/a/art_2c68c48f39
pw errors -s renderkit-review
pw screenshot -s renderkit-review --path .pw-evidence/product-system-pass1.png
pw click -s renderkit-review --selector '.rk-floating-tools button:first-child'
pw screenshot -s renderkit-review --path .pw-evidence/product-system-review-mode.png
pw hover -s renderkit-review --selector '[data-block-id="exec-summary"]'
pw screenshot -s renderkit-review --path .pw-evidence/product-system-review-hover.png
pw press -s renderkit-review PageDown
pw screenshot -s renderkit-review --path .pw-evidence/product-system-table.png
```

Evidence files:

```text
.pw-evidence/product-system-pass1.png
.pw-evidence/product-system-review-mode.png
.pw-evidence/product-system-review-hover.png
.pw-evidence/product-system-table.png
```

Observed:

- Browser errors: `0` visible errors.
- Default reading mode hides block ids and buttons.
- Review toggle activates visible review state.
- Hover in review mode shows block id/type/comment controls.
- Table block renders as a styled table.
- Mermaid shorthand renders as diagram.

## Remaining gaps

This pass does not complete RenderKit 1.0. Remaining important product gaps:

1. True inline/point comments with W3C `TextQuoteSelector` style anchors.
2. Persistent supporting-pane comment rail for large screens.
3. Syntax highlighting beyond CSS treatment.
4. Chart shorthand for ECharts bar/line/pie from CSV-like data.
5. Image/media block.
6. Tab block.
7. Stronger mature design-token refinement inspired by Apple/Notion/blog/editorial systems.
8. Automated Playwright assertions for layout width, review toggle state, and table rendering.

## Conclusion

Pass 1 moves RenderKit from a narrow debug/review-feeling document toward a full-browser, reading-first technical artifact surface. It also adds missing table capability and reduces Agent DSL friction with aliases and shorthand syntax. Product goal remains active; this is a first productization increment, not completion.
