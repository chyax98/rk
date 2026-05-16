# RenderKit 1.0 Product Strategy

Status: Strategic plan, evidence-backed  
Date: 2026-05-17  
Scope: Full product surface, not implementation detail

---

## 0. North Star

**Agent writes beautiful high-density technical documents with charts/code/layout. Human reads and decides fast.**

Not "Markdown looks nicer." Not "document editor." Not "collaborative writing tool."

The product is: Agent → `.rk.md` → RenderKit → Browser artifact that makes a human say "I can see what to do in 30 seconds."

---

## 1. Problem Diagnosis (from codebase evidence)

### 1.1 UI is paper-centered, wastes screen

**Evidence:**
- `apps/web/app/style.css:25-30` — `.rk-document { max-width: 900px; margin: 0 auto; }` constrains artifact to a narrow column regardless of screen width.
- `packages/design/src/chrome.css:88-89` — `.rk-artifact { max-width: 1320px }` with `grid-template-columns: minmax(0, 1fr) 320px` reserves 320px right rail permanently.
- `packages/design/src/surfaces.css:5-6` — `engineering-plan` and `data-report-lite` set `max-width: 100%` but the page-level `900px` constraint overrides this.
- **Result:** On a 1920px display, >50% of screen is empty gray. Wide surfaces and grids cannot spread.

### 1.2 Design system is token-heavy but opinion-light

**Evidence:**
- `packages/design/src/tokens.css` — 116 lines of well-structured tokens (spacing, radius, typography, shadow, motion, z-index). Professional foundation.
- `packages/design/src/themes.css` — 460 lines across 4 themes. Each theme defines ~80 semantic tokens. Thorough but derivative: paper-light is gray-on-white, dark-pro is blue-on-navy, amber-terminal is novel but niche.
- `packages/design/src/blocks.css` — 694 lines of block styling. Every block gets `border`, `border-radius`, `padding`, `box-shadow`. Result: **everything looks like a card**. No visual hierarchy between "this is a section header" and "this is an inline metric."
- **Result:** The design system has plumbing but lacks visual intent. Blocks are uniform cards with different left-border colors.

### 1.3 Sidebars/comments/review chrome overbuilt for 1.0

**Evidence:**
- `ArtifactView.jsx` — 200+ lines managing outline drawer, review drawer, context menu, comment submission, block inspector with source excerpt, properties grid, feedback command.
- `BlockFrame.jsx` — Every block gets: `rk-block-id`, `rk-block-type-badge`, `⋯` menu button, `💬` comment button, hover-visible tools overlay.
- `apps/web/app/style.css` — 302 lines total, of which ~40% is drawer/menu/comment/context-menu styling.
- **Result:** The review loop (comment → feedback → revise) is architecturally correct but visually dominates. A reader who just wants to understand a technical document sees block IDs, type badges, comment buttons everywhere.

### 1.4 DSL has high cognitive overhead for limited gain

**Evidence:**
- `packages/dsl/src/index.mjs` — 7 directive types: `callout`, `decision-card`, `diagram`, `code`, `summary`, `subdocument`, `grid`. Each has specific attribute requirements, YAML bodies, fenced code block rules.
- `examples/alpha-showcase.rk.md` — Even the showcase document is dense with `:::summary{id=...}`, `:::decision-card{id=...}` YAML bodies, `:::diagram{engine=...}`. Agent must remember: `id` required, `tone` for callouts, `engine` for diagrams, YAML for decisions.
- `packages/shared/src/index.mjs` — 5 surfaces × anti-pattern lists × recommended blocks × recommended themes. Cognitive surface area is large.
- **Result:** The DSL is more work to learn than HTML for a human, and only marginally easier for an agent. The gap between "raw Markdown" and "RenderKit `.rk.md`" is wider than it needs to be.

### 1.5 Block renderers are thin wrappers with no visual ambition

**Evidence:**
- `SummaryBlock.jsx` — 7 lines: title div + content div. No typography hierarchy.
- `CalloutBlock.jsx` — 6 lines: tone title + paragraph. No icon, no visual weight differentiation by tone.
- `CodeBlock.jsx` — 11 lines: header + pre/code. No syntax highlighting.
- `DecisionBlock.jsx` — 18 lines: h3 + kv grid + lists. Flat layout, no visual emphasis on the "chosen" answer.
- `GridBlock.jsx` — 16 lines: CSS grid of cells. No visual rhythm, no responsive breakpoint logic beyond 760px.
- **Result:** Blocks are structurally correct but visually indistinguishable from each other. A decision card and a code block have the same border-radius, padding, shadow.

---

## 2. What to Cut

### 2.1 Cut: Right rail as permanent layout element
- **File:** `packages/design/src/chrome.css:83-91`
- The 320px right rail forces a two-column layout even when no one is reviewing. Review should be overlay-on-demand only.
- **Keep:** Review drawer (already implemented as floating overlay in `ArtifactView.jsx`). Just remove the permanent rail from layout.

### 2.2 Cut: Block-level review tools always visible on hover
- **File:** `packages/blocks/src/BlockFrame.jsx:38-55`
- Every block shows `block-id`, `type-badge`, `⋯`, `💬` on hover. This is review affordance, not reading affordance.
- **Replace with:** Single subtle indicator (e.g., thin left bar on hover) that reveals full tools on click. Or: only show tools when review mode is explicitly activated.

### 2.3 Cut: `subdocument` block type
- **File:** `packages/dsl/src/index.mjs:155-170`, `packages/blocks/src/SubdocumentBlock.jsx`
- Subdocument is a placeholder that links to another file. Current implementation just renders a card with metadata. No actual rendering of the linked document.
- **Decision:** Remove for 1.0. Cross-document linking is a 2.0 problem. Current `subdocument` adds DSL complexity without reader value.

### 2.4 Cut: `amber-terminal` theme from default rotation
- **File:** `packages/design/src/themes.css:104-175`
- Novel but serves <5% of use cases. Maintenance burden (80+ tokens) disproportionate to value.
- **Decision:** Keep in codebase as opt-in, remove from gallery/recommended defaults.

### 2.5 Cut: Surface-specific anti-pattern enforcement
- **File:** `packages/shared/src/index.mjs` — `antiPatterns` arrays
- Anti-patterns are documentation, not enforcement. No code checks them. Remove from registry; move to SKILL.md guidance only.

### 2.6 Cut: Outline drawer as separate UI
- **File:** `ArtifactView.jsx:108-124`
- Outline is useful but duplicate with browser Ctrl+F and heading scroll. For 1.0, a thin sticky TOC in the document header is simpler and doesn't require a floating panel.

### 2.7 Cut: 900px max-width constraint
- **File:** `apps/web/app/style.css:25-30`
- This is the single biggest layout problem. It makes every document look like a blog post. Replace with responsive width based on surface type and content density.

---

## 3. What to Keep

### 3.1 Keep: `.rk.md` DSL core (but simplify)
- **File:** `packages/dsl/src/index.mjs`
- The directive block concept is sound. Keep: `callout`, `decision-card`, `diagram`, `code`, `summary`, `grid`.
- Remove: `subdocument`. Add: `table` (currently missing, high value for technical docs).
- Simplify: Make `id` optional with auto-generation. Agent can add stable ids for review targets; auto-id is fine for display-only blocks.

### 3.2 Keep: Block renderer registry pattern
- **Files:** `packages/blocks/src/registry.jsx`, `RenderBlock.jsx`
- Clean extensibility. New blocks = new file + registry entry.

### 3.3 Keep: Theme token architecture
- **File:** `packages/design/src/tokens.css`, `themes.css`
- The semantic token layer (bg, surface, text, accent, border, tone-*) is well-designed. The problem is block styling, not token structure.

### 3.4 Keep: CLI validate → push → feedback loop
- **Files:** `packages/cli/bin/renderkit.mjs`, API routes
- This is the core product differentiator. Agent writes, human reviews, agent revises. Architecture is correct.

### 3.5 Keep: Diagram engine diversity
- **File:** `packages/blocks/src/DiagramBlock.jsx`
- Mermaid, ECharts, D2, PlantUML, SVG, infographic — each serves a real use case. The dispatch pattern is clean.

### 3.6 Keep: Grid layout system
- **File:** `packages/blocks/src/GridBlock.jsx`, `packages/design/src/blocks.css:242-260`
- Multi-column layout for KPI grids, side-by-side comparisons. Essential for high-density docs.

### 3.7 Keep: Comment → feedback → revise loop
- **File:** `ArtifactView.jsx` comment submission, API routes, CLI feedback
- Core product loop. Keep architecture, simplify UI.

### 3.8 Keep: Local-first, no-SaaS architecture
- **File:** `docs/decisions.md:1-18`
- No auth, no database, no Docker. This is correct for 1.0.

---

## 4. What 1.0 Product Surface Should Include

### 4.1 Full-width responsive document layout

Replace `max-width: 900px` with surface-aware layout:

| Surface | Layout | Max-width |
|---|---|---|
| `engineering-plan` | Full-width, dense grid | 1400px |
| `decision-brief` | Centered, readable | 800px |
| `review-report` | Full-width, finding cards | 1400px |
| `runbook` | Centered, step-oriented | 900px |
| `data-report-lite` | Full-width, chart-friendly | 1400px |

Grid blocks and wide diagrams should expand to full surface width. Text-heavy blocks (paragraph, summary) stay narrow for readability.

### 4.2 Visual block hierarchy (not all cards)

Blocks need 3 visual tiers:

1. **Structural** (heading, paragraph) — transparent, no border, no shadow. Typographic hierarchy only.
2. **Informational** (summary, callout, decision-card) — subtle background tint, left border accent, minimal shadow. Card-like but lightweight.
3. **Interactive/Embed** (code, diagram, grid, table) — distinct background, clear border, stronger containment. "This is a thing you look at."

Current code treats all blocks as tier 3 (card with border + shadow).

### 4.3 Syntax-highlighted code blocks

`CodeBlock.jsx` renders plain `<pre><code>`. For technical docs, this is the #1 readability gap. Use Shiki (runs at build/SSR time) or Prism (client-side). Both work with the existing token system.

### 4.4 Table block

Technical docs need tables: comparison matrices, status trackers, test result grids. Currently absent from DSL. Add:

```md
:::table{id="status-matrix" title="Migration Status"}
| Component | Status | Risk |
|---|---|---|
| Auth | Done | Low |
| API | In Progress | Medium |
:::
```

### 4.5 Better ECharts integration

`EChartsBlock.jsx` currently requires raw JSON option. For 1.0, add shorthand patterns:

```md
:::diagram{id="trend" engine="echarts-bar" caption="Throughput"}
month,value
Jan,1200
Feb,1800
Mar,2400
:::
```

Agent should not need to write 40-line ECharts option JSON.

### 4.6 Two mature themes, not four

| Theme | Purpose | Keep? |
|---|---|---|
| `paper-light` | Default, all surfaces | ✅ Primary |
| `dark-pro` | Engineering/dev review | ✅ Secondary |
| `editorial-kami` | Long-form prose | ❌ Merge into paper-light as serif variant |
| `amber-terminal` | Runbook terminal aesthetic | ❌ Opt-in only |

Polish two themes to high quality rather than maintaining four at medium quality.

### 4.7 Reading-first UI with optional review mode

Two modes:
1. **Reading mode** (default) — Clean document. No block IDs, no type badges, no comment buttons. Blocks are styled for comprehension. Headings anchor-linkable. Diagrams zoomable. Code copyable.
2. **Review mode** (toggle) — Activates current review chrome: block selection, comments, context menu, source inspector. Visually distinct (e.g., thin blue left border on selectable blocks).

Current code is permanently in review mode.

### 4.8 Print/export quality

Technical docs get shared as PDFs, screenshots, Slack clips. 1.0 should render well in:
- Browser print → PDF
- Screenshot at 2x
- Slack unfurl (OG image)

Currently no print CSS, no OG meta tags.

---

## 5. Phased Plan

### Phase 0: Cut & Simplify (1-2 days)

**Goal:** Remove overbuilt surface, reduce cognitive load.

- Remove `subdocument` block type from DSL, registry, blocks, examples.
- Remove 900px max-width constraint from `style.css`.
- Remove permanent right rail from `chrome.css` layout.
- Simplify `BlockFrame.jsx` — remove always-visible tools, add single hover indicator.
- Move `amber-terminal` and `editorial-kami` to opt-in (keep code, remove from gallery defaults).
- Remove `antiPatterns` from recipe registry (keep in SKILL.md).
- Add auto-generated `id` fallback for directive blocks (make `id` recommended, not required).

### Phase 1: Layout & Visual Hierarchy (2-3 days)

**Goal:** Documents look good full-width with visual block tiers.

- Implement surface-aware max-width (see §4.1 table).
- Restyle block tiers: structural (transparent), informational (tint+border), interactive (contained).
- Fix grid block to expand full surface width.
- Add responsive breakpoints: full-width on desktop, stacked on mobile (<760px, already partially done).
- Implement reading-mode default: hide all review chrome behind a toggle.
- Add a "Review" toggle button to floating tools.

### Phase 2: Missing Block Types (2-3 days)

**Goal:** Cover the 80% of technical document needs.

- Add `table` block to DSL (`packages/dsl/src/index.mjs`) and renderer (`packages/blocks/src/TableBlock.jsx`).
- Add syntax highlighting to `CodeBlock.jsx` (Shiki or Prism).
- Add ECharts shorthand patterns (bar, line, pie from CSV-like data).
- Add `image` block for embedded screenshots/diagrams (img src, local path, or data URI).

### Phase 3: Theme Polish (2-3 days)

**Goal:** Two themes that look professional, not "CSS framework demo."

- Polish `paper-light`: refine typography scale, ensure heading hierarchy is clear, ensure callout tones are distinguishable but not garish.
- Polish `dark-pro`: ensure code blocks are readable, ensure diagram contrast, ensure callout tones work on dark backgrounds.
- Add print CSS (`@media print`) that strips all chrome, outputs clean document.
- Add OG meta tags for Slack/social previews.

### Phase 4: Review Mode Refinement (2-3 days)

**Goal:** Review chrome is useful but not dominant.

- Implement mode toggle (reading ↔ review) with visual distinction.
- Review mode: show block borders, IDs, comment indicators, context menu.
- Simplify comment drawer: reduce sections, focus on "select block → type comment → submit."
- Add inline comment markers (small pill next to block showing comment count).
- Add comment status badges (open/resolved).

### Phase 5: Agent Experience (1-2 days)

**Goal:** Agent can produce excellent artifacts with minimal guidance.

- Update `skills/renderkit-authoring/SKILL.md` to reflect simplified DSL.
- Add `table` block documentation to skill.
- Add ECharts shorthand documentation.
- Remove `subdocument` documentation.
- Simplify recipe registry to focus on block recommendations only.
- Add validation examples for new blocks.

---

## 6. Success Metrics

### Quantitative

| Metric | Current | 1.0 Target | How to measure |
|---|---|---|---|
| Screen utilization on 1920px display | ~40% (900px centered) | >75% for wide surfaces | Visual inspection + screenshot comparison |
| DSL directive types | 7 | 7 (cut subdocument, add table) | `KNOWN` set size in `index.mjs` |
| Block renderers with visual tier | 0 (all cards) | 3 tiers across all blocks | Code review of block CSS |
| Syntax-highlighted code | No | Yes | Screenshot of rendered code block |
| Themes in default rotation | 4 | 2 | Gallery config |
| Review chrome always visible | Yes | No (toggle) | Code check in BlockFrame |
| Print-quality output | No | Yes | Browser print → PDF |
| Validation test count | 146 | ≥146 (maintain, add table) | `pnpm verify` |
| Smoke test count | 18 | ≥18 | `pnpm verify:smoke` |

### Qualitative

- [ ] A rendered `engineering-plan` artifact should be comprehensible in <30 seconds by a technical reader who has never seen RenderKit.
- [ ] Code blocks should be syntax-highlighted and copyable.
- [ ] Grid blocks should use full document width on desktop.
- [ ] Decision cards should visually emphasize the "chosen" answer, not just list it among alternatives.
- [ ] Callout tones should be distinguishable without reading the label (color + icon).
- [ ] Review mode should feel like "turning on a tool," not "the default state."

---

## 7. Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Syntax highlighting adds bundle size | Medium | Shiki can be loaded per-language; or use CSS-only Prism theme |
| Table block needs Markdown table parsing in remark | Low | Already have `remarkGfm`; table AST nodes available |
| Auto-generated block IDs may collide | Low | Use `type-N` pattern; directive blocks still need stable ID for review targets |
| Reading/review mode toggle adds UI state | Low | Simple boolean toggle; already have `outlineOpen`/`drawerOpen` state pattern |
| Cutting subdocument breaks existing examples | Low | Only `alpha-showcase.rk.md` uses it; update showcase |

---

## 8. Key File Reference

| File | Role | Lines | Action needed |
|---|---|---|---|
| `packages/design/src/tokens.css` | Design tokens | 116 | Keep as-is |
| `packages/design/src/themes.css` | Theme semantic tokens | 460 | Polish paper-light + dark-pro; reduce amber/editorial to opt-in |
| `packages/design/src/blocks.css` | Block styles | 694 | Rewrite: 3-tier visual hierarchy |
| `packages/design/src/surfaces.css` | Surface density | 104 | Add max-width per surface |
| `packages/design/src/chrome.css` | App chrome layout | 202 | Remove permanent rail; add responsive layout |
| `apps/web/app/style.css` | App-level styles | 302 | Remove 900px constraint; add reading/review mode |
| `packages/dsl/src/index.mjs` | DSL parser | ~300 | Remove subdocument; add table; make id optional |
| `packages/blocks/src/BlockFrame.jsx` | Block wrapper | 55 | Simplify tools; add mode-aware rendering |
| `packages/blocks/src/CodeBlock.jsx` | Code renderer | 11 | Add syntax highlighting |
| `packages/blocks/src/DiagramBlock.jsx` | Diagram dispatch | ~130 | Add ECharts shorthand |
| `packages/blocks/src/GridBlock.jsx` | Grid layout | 16 | Expand to full surface width |
| `packages/blocks/src/SummaryBlock.jsx` | Summary | 7 | Add visual tier 2 styling |
| `packages/blocks/src/CalloutBlock.jsx` | Callout | 6 | Add tone icons, visual weight |
| `packages/blocks/src/DecisionBlock.jsx` | Decision | 18 | Emphasize chosen answer |
| `packages/blocks/src/SubdocumentBlock.jsx` | Subdocument | — | Remove |
| `packages/shared/src/index.mjs` | Recipe registry | ~120 | Simplify; remove antiPatterns |
| `apps/web/app/a/[id]/ArtifactView.jsx` | Main artifact page | 200 | Add reading/review mode toggle |
| `skills/renderkit-authoring/SKILL.md` | Agent skill | ~250 | Update for simplified DSL |
| `examples/alpha-showcase.rk.md` | Showcase artifact | ~80 | Update: remove subdocument, add table |
| `examples/gallery.json` | Gallery config | 30 | Reduce to 2 themes in rotation |

---

## 9. Summary

RenderKit 0.0.2 has correct architecture (Agent writes → CLI validates → Web renders → Human comments → Agent revises) but wrong visual priorities. It optimizes for review chrome over reading experience, paper-layout over screen utilization, and DSL completeness over agent ergonomics.

1.0 should invert those priorities:

1. **Reading first.** Full-width, visually hierarchical, syntax-highlighted, printable documents.
2. **Review on demand.** Toggle, not default. Comment affordance appears when you need it, not when you don't.
3. **Fewer, better blocks.** Cut subdocument. Add table. Make each remaining block visually distinct and information-dense.
4. **Two polished themes.** Not four mediocre ones.
5. **Simpler DSL.** Optional IDs, table support, ECharts shorthand. Agent should be able to write a useful artifact from memory after reading the skill once.
