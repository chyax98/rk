# RenderKit Visual / Layout / Design-System Critique & Redesign Proposal

> **Status:** Review-only. No edits to source files.
> **Evidence:** `.pw-evidence/system-review-alpha.png` — centered 900px document with massive unused margins on both sides. Desktop browser context.

---

## 1. Diagnosis: What's Wrong

### 1.1 Page Layout — The Core Problem

The artifact page renders as a **narrow centered document** in a sea of whitespace:

```
apps/web/app/style.css:108-110
  .rk-document {
    max-width: 900px;
    margin: 0 auto;
  }
```

On a 1440–1920px viewport, the document occupies ~50–62% of horizontal space. The floating tools (outline/comments) overlay from the edges but the main content never uses the available width. This is acceptable for editorial/documentation surfaces but **wrong for engineering-plan, review-report, and data-report-lite**.

The `rk-block-stream` uses a 12-column grid with width hints (`data-rk-width`), but the grid is **inside** the 900px container, so "wide" and "full" are indistinguishable — they're all capped at 900px.

### 1.2 Surface System Partially Implemented

`surfaces.css` defines density overrides per surface type (engineering-plan, data-report-lite, etc.), and some set `max-width: 100%`. But the **app-level** `.rk-document` hard-caps at 900px regardless of surface. The `data-rk-surface` attribute is applied to the outer `.rk-page`, but `.rk-document` inside it ignores surface context.

```
apps/web/app/a/[id]/ArtifactView.jsx:64
  <main className="rk-document" ...>
```

The `rk-document` class is always 900px. Surface-aware max-width never takes effect because `.rk-document` wins specificity.

### 1.3 Chrome Overlays Are Fragmentary

- **Outline drawer** (`.rk-outline-drawer`) — fixed-position overlay from the left
- **Review drawer** (`.rk-review-drawer`) — fixed-position overlay from the right
- **Floating tools** (`.rk-floating-tools`) — fixed pill in top-right corner

These are **modal overlays**, not persistent panels. Users can't see outline + comments + content simultaneously. For a technical document review tool, this means constant open/close toggling — low information density.

### 1.4 Block-Level Issues

| Issue | Location | Impact |
|-------|----------|--------|
| Comment indicator uses `::after` pseudo-element at `right: calc(100% - 3px)` — clipped when block is flush left | `blocks.css:30-40` | Comment markers invisible or cut off |
| `rk-block-tools` opacity-0 → hover reveal is desktop-only; no touch fallback | `blocks.css:47-52` | Mobile users can't access block actions |
 Heading blocks have `float: right` tools — causes layout jank in grid contexts | `blocks.css:70-74` | Float breaks grid alignment |
| Grid block ignores container width — constrained by parent | `blocks.css:261-275` | Grid cells don't expand to fill available space |
| ECharts min-height 320px is fixed — no responsive sizing | `blocks.css:300` | Charts waste space on wide viewports or clip on narrow |

### 1.5 Missing Design-System Elements

- **No table block** — critical for data-report-lite and review-report surfaces
- **No tab block** — needed for multi-view technical content
- **No inline annotation/point-comment system** — current comments are block-level only; Feishu-style point comments on specific text ranges don't exist
- **No responsive density tokens** — `--rk-density-*` tokens exist but only `surfaces.css` uses them; no viewport-based density switching
- **No persistent sidebar/shell layout** — `chrome.css` defines `.rk-shell` with grid (sidebar + content + rail) but the actual app never uses it; the app uses `.rk-page` > `.rk-document` instead

---

## 2. Evidence Sources: What Mature Systems Do

### 2.1 Material Design Layout Principles
- **Canonical layouts**: Editorial (narrow, centered), Dashboard (full-width with panels), Full-screen (immersive)
- **Adaptive panes**: Content area + optional side panel; side panel can be fixed-width sidebar or dismissible overlay depending on viewport
- **Key takeaway**: Surface type should drive layout, not a single default

### 2.2 Observable Framework
- Markdown-first but with **grid layout support** for dashboards/reports
- Themes are CSS-variable-driven (like RenderKit)
- Data display uses full-width with responsive column counts
- **Key takeaway**: Same document can have narrative sections (narrow) and data sections (wide) coexisting

### 2.3 Tailwind UI Application Shells
- Full-width app shells with persistent sidebar + scrollable content
- Data-dense layouts use 100% viewport with internal padding only
- Responsive breakpoints collapse sidebar to overlay on narrow screens
- **Key takeaway**: Persistent navigation + full-width content is the mature pattern for tool-like pages

### 2.4 Feishu Comment Pattern
- Lightweight point comments: click on text → floating comment bubble anchored to selection
- Comment thread appears in **right rail alongside content**, not in a separate overlay
- Comment indicators are inline markers (highlight + dot), not block-level pseudo-elements
- **Key takeaway**: Block-level comments are fine as baseline, but the UX should evolve toward anchored point comments with a persistent right rail

---

## 3. Redesign Proposal

### 3.1 Layout Architecture: Adaptive Shell

Replace the single centered-document layout with a surface-aware shell:

```
┌──────────────────────────────────────────────────────┐
│ Topbar (sticky, full-width)                          │
├──────┬───────────────────────────────┬───────────────┤
│ Left │                               │ Right Rail    │
│ Nav  │      Content Area             │ (Comments /   │
│(cond)│      (surface-aware width)    │  Inspector)   │
│ 240px│                               │  320px        │
│      │                               │               │
└──────┴───────────────────────────────┴───────────────┘
```

**Key principle: content width is surface-driven, not hard-coded.**

| Surface | Content Width | Side Panels |
|---------|--------------|-------------|
| `engineering-plan` | Full (100%) | Left outline + right comments |
| `review-report` | Full (100%) | Right comments always visible |
| `data-report-lite` | Full (100%) | Right inspector |
| `decision-brief` | 760px centered | Comments overlay only |
| `runbook` | 840px centered | Comments overlay only |
| `proposal` | 820px centered | Comments overlay only |
| `documentation` | 780px centered | Right TOC (optional) |
| *(default/none)* | 900px centered | Floating tools (current) |

### 3.2 CSS Changes

#### 3.2.1 Surface-Aware Document Container

**File: `apps/web/app/style.css`**

Replace the fixed `.rk-document` with surface-conditional rules:

```css
/* Base: readable centered document (editorial surfaces) */
.rk-document {
  max-width: 900px;
  margin: 0 auto;
}

/* Full-width surfaces: expand to fill available space */
.rk-page[data-rk-surface="engineering-plan"] .rk-document,
.rk-page[data-rk-surface="review-report"] .rk-document,
.rk-page[data-rk-surface="data-report-lite"] .rk-document {
  max-width: 100%;
  margin: 0;
}

/* Narrow surfaces: explicit centering with tighter width */
.rk-page[data-rk-surface="decision-brief"] .rk-document { max-width: 760px; }
.rk-page[data-rk-surface="runbook"] .rk-document { max-width: 840px; }
.rk-page[data-rk-surface="proposal"] .rk-document { max-width: 820px; }
.rk-page[data-rk-surface="documentation"] .rk-document { max-width: 780px; }
```

#### 3.2.2 Shell Layout for Full-Width Surfaces

**File: `packages/design/src/chrome.css`** — activate the existing `.rk-shell` pattern:

```css
/* Full-width surfaces get the 3-column shell */
.rk-page[data-rk-surface="engineering-plan"],
.rk-page[data-rk-surface="review-report"],
.rk-page[data-rk-surface="data-report-lite"] {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
}
```

#### 3.2.3 Right Rail: Persistent Comments for Full-Width Surfaces

**File: `packages/design/src/chrome.css`**

Add a persistent right rail that replaces the overlay drawer on full-width surfaces:

```css
.rk-rail-persistent {
  position: sticky;
  top: 0;
  align-self: start;
  width: 320px;
  height: 100vh;
  overflow-y: auto;
  background: var(--rk-rail-bg);
  border-left: var(--rk-border-width) solid var(--rk-rail-border);
  padding: var(--rk-space-4);
}

/* Hide on editorial surfaces — they use overlay drawers instead */
.rk-page:not([data-rk-surface="engineering-plan"]):not([data-rk-surface="review-report"]):not([data-rk-surface="data-report-lite"]) .rk-rail-persistent {
  display: none;
}
```

**File: `apps/web/app/a/[id]/ArtifactView.jsx`** — add rail element:

```jsx
{/* Inside the return, alongside rk-document */}
{isFullWidthSurface(surface) && (
  <aside className="rk-rail-persistent">
    {/* Block inspector + comment thread content — same as current drawer */}
  </aside>
)}
```

#### 3.2.4 Responsive Collapse

```css
@media (max-width: 1100px) {
  /* Collapse persistent rail to overlay drawer */
  .rk-rail-persistent {
    position: fixed;
    right: 0;
    z-index: var(--rk-z-overlay);
    box-shadow: var(--rk-shadow-xl);
    transform: translateX(100%);
    transition: transform var(--rk-duration-normal) ease-out;
  }
  .rk-rail-persistent[data-open] {
    transform: translateX(0);
  }
}

@media (max-width: 768px) {
  /* All surfaces become single-column */
  .rk-document { max-width: 100% !important; }
  .rk-block-stream > .rk-block[data-rk-width="half"],
  .rk-block-stream > .rk-block[data-rk-width="third"],
  .rk-block-stream > .rk-block[data-rk-width="two-third"] {
    grid-column: 1 / -1;
  }
}
```

### 3.3 Block Component Changes

#### 3.3.1 Fix Comment Indicator Positioning

**File: `packages/design/src/blocks.css`**

```css
/* Move indicator from left edge (clipped) to inside block */
.rk-block[data-rk-has-comments]::after {
  content: "";
  position: absolute;
  top: var(--rk-space-3);
  left: var(--rk-space-3);
  width: 6px;
  height: 6px;
  border-radius: var(--rk-radius-full);
  background: var(--rk-accent);
}

/* Remove the ::before count — redundant with tools overlay */
.rk-block[data-rk-has-comments]::before {
  display: none;
}
```

#### 3.3.2 Fix Heading Block Float Jank

**File: `packages/design/src/blocks.css`**

```css
.rk-block-heading .rk-block-tools {
  position: absolute;
  top: var(--rk-space-2);
  right: 0;
  /* Remove float: right — causes grid context issues */
}
```

#### 3.3.3 Responsive ECharts

```css
.rk-echarts-canvas {
  width: 100%;
  min-height: 280px;
  /* Responsive: expand to fill container, min-height scales */
}
@media (min-width: 1200px) {
  .rk-echarts-canvas { min-height: 400px; }
}
```

#### 3.3.4 Block Tools Touch Fallback

**File: `packages/design/src/blocks.css`**

```css
/* Touch devices: always show tools (with reduced opacity) */
@media (hover: none) {
  .rk-block-tools {
    opacity: 0.6;
  }
}
```

### 3.4 New Block Types (Design Spec)

#### 3.4.1 Table Block

```
DSL: :::table{id="results" columns="Metric,Value,Delta"}
     | Metric | Value | Delta |
     |--------|-------|-------|
     | ...    | ...   | ...   |
     :::
```

- Render as styled `<table>` using `--rk-surface-raised` header, `--rk-border` dividers
- Support `data-rk-surface="data-report-lite"` with compact density
- Column alignment hints: right-align numeric columns

#### 3.4.2 Tab Block

```
DSL: :::tabs{id="views" active="0"}
     :::tab{label="Overview"}
     (blocks...)
     :::
     :::tab{label="Details"}
     (blocks...)
     :::
     :::
```

- Render tab bar with `rk-chip`-style active indicator
- Only one panel visible at a time; accessible via keyboard

#### 3.4.3 Point Comment System (Phase 2)

- Store comment anchor as `{ blockId, startOffset, endOffset }` on the comment model
- Render as highlight + floating marker on the text range
- Right rail shows thread anchored to that selection
- This is a larger feature — spec it separately when prioritized

### 3.5 Design Token Additions

Add to `tokens.css`:

```css
/* Layout tokens (surface-aware) */
--rk-content-width-narrow: 760px;
--rk-content-width-normal: 900px;
--rk-content-width-wide: 100%;

/* Shell spacing */
--rk-shell-gap: var(--rk-space-6);

/* Rail width */
--rk-rail-width: 320px;

/* Breakpoint tokens (informational, not usable in CSS but useful for documentation) */
--rk-bp-sm: 640px;
--rk-bp-md: 768px;
--rk-bp-lg: 980px;
--rk-bp-xl: 1100px;
--rk-bp-2xl: 1440px;
```

---

## 4. Acceptance Checks

### 4.1 Visual Checks (Manual / Playwright)

| # | Check | Expected | File to Inspect |
|---|-------|----------|-----------------|
| 1 | `engineering-plan` artifact on 1440px viewport | Document fills available width (no 900px centering) | `style.css` `.rk-document` |
| 2 | `decision-brief` artifact on 1440px viewport | Document centered at 760px, readable | `style.css` surface override |
| 3 | Right rail visible on `engineering-plan` surface | Persistent 320px rail with comments, no overlay toggle needed | `chrome.css`, `ArtifactView.jsx` |
| 4 | Right rail hidden on `runbook` surface | No rail; comments via overlay drawer (current behavior) | `chrome.css` |
| 5 | Comment indicator dot visible inside block | Blue dot at top-left corner, not clipped outside block | `blocks.css` |
| 6 | Block tools visible on touch devices | Tools visible at 60% opacity without hover | `blocks.css` `@media (hover: none)` |
| 7 | Responsive at 768px | All surfaces single-column, rail collapses to overlay | `style.css` breakpoints |
| 8 | Grid block at full width | Grid cells expand to fill content area | `blocks.css` `.rk-grid-cells` |
| 9 | ECharts at full width | Chart fills container, min-height scales with viewport | `blocks.css` `.rk-echarts-canvas` |
| 10 | Heading block tools don't cause float jank | Tools positioned absolutely, no float | `blocks.css` `.rk-block-heading .rk-block-tools` |

### 4.2 Code Checks

| # | Check | Method |
|---|-------|--------|
| 1 | No `max-width: 900px` in `.rk-document` for full-width surfaces | `grep -n "max-width.*900" apps/web/app/style.css` |
| 2 | `.rk-shell` or equivalent grid layout activated for full-width surfaces | Inspect `chrome.css` for `data-rk-surface` selectors |
| 3 | Persistent rail component rendered conditionally | Inspect `ArtifactView.jsx` for `rk-rail-persistent` |
| 4 | No `float: right` in heading block tools | `grep -n "float" packages/design/src/blocks.css` |
| 5 | Comment indicator uses `left` not `right: calc(100% - 3px)` | `grep -n "right.*calc.*100%" packages/design/src/blocks.css` |

### 4.3 Regression Checks

| # | Check | Method |
|---|-------|--------|
| 1 | Editorial surfaces (decision-brief, runbook, proposal, documentation) still centered and readable | Visual inspection per surface |
| 2 | Theme switching (paper-light, dark-pro, amber-terminal, editorial-kami) still works | Toggle themes on each surface |
| 3 | Comment creation, display, and feedback flow unchanged | Create comment → verify in drawer/rail → copy feedback command |
| 4 | Outline drawer still functional on editorial surfaces | Toggle outline on decision-brief |
| 5 | Mobile layout (<768px) still usable | Responsive test |

---

## 5. Implementation Priority

### Phase 1: Layout Fix (Highest Impact, Smallest Change)
1. Surface-aware `.rk-document` max-width in `style.css`
2. Fix comment indicator positioning in `blocks.css`
3. Fix heading block float in `blocks.css`
4. Add touch fallback for block tools in `blocks.css`

### Phase 2: Shell + Rail (Medium Change)
5. Activate `.rk-shell` grid for full-width surfaces in `chrome.css`
6. Add `rk-rail-persistent` component to `ArtifactView.jsx`
7. Add responsive collapse CSS

### Phase 3: New Blocks (Feature Work)
8. Table block (DSL + component + CSS)
9. Tab block (DSL + component + CSS)
10. Responsive ECharts sizing

### Phase 4: Point Comments (Larger Feature)
11. Extend comment model with offset-based anchoring
12. Highlight rendering within text blocks
13. Right-rail thread UI anchored to selection

---

## 6. Key Files Reference

| File | Role | Lines of Interest |
|------|------|-------------------|
| `apps/web/app/style.css` | App-level layout, document container, block stream grid, drawer styles | L108-110 (`.rk-document` 900px cap), L113-121 (block stream grid), L124-142 (floating tools), L143-165 (drawers) |
| `packages/design/src/chrome.css` | Shell layout, topbar, sidebar, rail, buttons | L1-11 (`.rk-shell` grid — unused), L76-103 (`.rk-content`), L106-113 (`.rk-artifact` grid) |
| `packages/design/src/blocks.css` | All block styles, comment indicators, tools overlay, grid, diagrams | L30-40 (comment `::after`/`::before` — clipped), L47-52 (tools opacity), L70-74 (heading float), L261-275 (grid), L300 (ECharts fixed height) |
| `packages/design/src/surfaces.css` | Surface density overrides | L1-5 (base surface), L8-20 (engineering-plan compact), L49-54 (data-report-lite) |
| `packages/design/src/tokens.css` | Design tokens (spacing, type, radius, shadows, density) | Full file — well-structured, missing layout tokens |
| `packages/design/src/themes.css` | Theme definitions (paper-light, dark-pro, amber-terminal, editorial-kami) | Full file — comprehensive, no changes needed |
| `apps/web/app/a/[id]/ArtifactView.jsx` | Main artifact renderer, comment/outline/drawer UI | L64 (`.rk-document` usage), L82-92 (floating tools), L94-110 (outline drawer), L112-145 (review drawer) |
| `packages/blocks/src/BlockFrame.jsx` | Block wrapper with selection, comments, context menu | Full file — renders `data-rk-width`, `data-rk-has-comments` |
| `packages/blocks/src/GridBlock.jsx` | Grid layout block | Uses `--rk-grid-cols` CSS variable |
| `packages/blocks/src/EChartsBlock.jsx` | ECharts chart block | No responsive handling |
| `packages/blocks/src/registry.jsx` | Block type registry | Missing table, tabs |
| `packages/dsl/src/index.mjs` | DSL parser, block compilation | L12-13 (KNOWN block types — needs table/tabs) |
