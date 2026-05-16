# RenderKit 1.0 研究 — Guizang 幻灯片表面 / Guizang Deck Surface

状态：研究资产，未集成运行时  
日期：2026-05-17

## 中文速览

`guizang-ppt-skill` 是一个 Agent 生成单文件横向 HTML 幻灯片的 skill。它提供两套视觉系统：

- **A 编辑杂志 × 电子墨水**：衬线标题、流体/WebGL 背景、温暖杂志感，适合叙事演讲。
- **B 瑞士国际主义风格**：Inter/Helvetica/Noto Sans SC、网格/点阵背景、高对比功能色，适合技术产品/数据报告。

对 RenderKit 的核心价值不是直接集成，而是**锁定布局纪律**和**严格主题预设**——这些经验可借用于任何高设计密度的 RenderKit surface。当前阶段定为 **P3**，待 future `surface: deck` 时复用。

---

## Objective

The user requested that all collected top design resources be cloned, analyzed, documented, and considered for RenderKit integration. This document records a focused analysis of `guizang-ppt-skill` and how it might influence a future RenderKit deck/presentation surface.

Source repo:

```text
research/design-assets/external-repos/guizang-ppt-skill
```

Inspected source state is pinned in:

```text
research/design-assets/top-design-resources-manifest.md
```

## What was inspected

Important files:

```text
SKILL.md
README.md
README.en.md
assets/template.html
assets/template-swiss.html
assets/motion.min.js
references/layouts.md
references/layouts-swiss.md
references/themes.md
references/themes-swiss.md
references/swiss-layout-lock.md
references/swiss-map-component.md
references/checklist.md
scripts/validate-swiss-deck.mjs
```

The repository is compact (~4.3 MB) and MIT licensed.

## What the repo provides

`guizang-ppt-skill` is an Agent skill for generating single-file horizontal HTML decks. It is not a generic renderer package; its value is the combination of:

1. strict workflow;
2. curated visual systems;
3. locked layout catalogs;
4. validation checklist;
5. production-ready HTML templates.

### Visual systems

| Style | Name | Characteristics | Best fit |
|---|---|---|---|
| A | Editorial Magazine × Electronic Ink | Serif titles, fluid/WebGL backgrounds, warm magazine feel | narrative talks, cultural/industry observations, personal voice |
| B | Swiss International Style | Inter/Helvetica/Noto Sans SC, grid/dot background, high-contrast functional colors | tech products, data reports, engineering/product presentations |

The skill explicitly disallows arbitrary color freedom in favor of curated presets. This is important: it treats constraint as a quality mechanism.

## High-value patterns for RenderKit

### 1. Locked layout pools

Guizang uses layout catalogs rather than free-form slide design. This reduces Agent design slop.

RenderKit implication:

- Future deck surface should not allow arbitrary block placement by default.
- Use a small set of named layouts that map from `.rk.md` blocks to slides.
- Layout names should be semantic, e.g. `cover`, `section-divider`, `kpi-tower`, `timeline`, `comparison`, `quote`, `image-grid`, `system-diagram`.

### 2. Clarify-before-generate workflow

The skill asks key questions before generating a deck:

- style A or B;
- audience;
- duration;
- source material;
- image/screenshot requirements;
- theme preset;
- hard constraints.

RenderKit implication:

- For future high-design surfaces, authoring skill should ask clarifying questions when the source lacks audience/style/scope.
- For normal document artifacts, this should remain lightweight; do not over-question for engineering plans.

### 3. Preset-only color systems

Guizang protects aesthetics by disallowing arbitrary hex colors.

RenderKit implication:

- Current `theme` should remain curated (`paper-light`, `editorial-kami`, `dark-pro`, `amber-terminal`).
- Future high-design surfaces should choose from curated theme presets rather than accept arbitrary user colors.
- This aligns with the active user preference: mature design systems over random hand-rolled CSS.

### 4. HTML deck as a future surface, not core document UI

Guizang's horizontal deck is not a good default for RenderKit's current product scope because the active goal is reading/commenting on documents. However, it is a strong candidate for a future surface:

```yaml
surface: deck
```

Potential authoring pattern:

```md
---
title: Launch Review Deck
theme: swiss-ikb
surface: deck
---

:::summary{id="cover" title="Launch Review"}
...
:::

:::stat{id="kpi" label="Adoption" value="74%" delta="+18%"}
...
:::

:::timeline{id="rollout" title="Rollout"}
- [done] Alpha
- [active] Beta
- [next] GA
:::
```

The renderer could map RenderKit blocks to deck layouts, rather than asking the Agent to hand-author HTML.

### 5. Validator as product quality gate

Guizang includes `scripts/validate-swiss-deck.mjs` and a checklist. The important pattern is not the exact script; it is a visual-quality gate for output.

RenderKit implication:

- Future visual surfaces should have dedicated validators.
- Current RenderKit already has `pnpm verify`, `pnpm verify:smoke`, and `pnpm verify:sqlite`; a future deck surface should add `verify:deck` or Playwright visual assertions.

## What should NOT be integrated now

1. Do not add horizontal deck UI to the current document reading surface.
2. Do not copy the HTML templates into RenderKit runtime yet.
3. Do not add WebGL backgrounds to document mode.
4. Do not let deck-specific chrome leak into reading-first artifacts.
5. Do not adopt arbitrary slide generation in Web UI; Agent should continue authoring `.rk.md`.

## Proposed future integration path

### Phase 0 — Research only (current)

- Preserve this doc.
- Preserve clone manifest.
- Keep deck surface out of current 1.0 core unless explicitly prioritized.

### Phase 1 — Deck surface design spec

Create:

```text
docs/product/renderkit-deck-surface-spec.md
```

Define:

- `surface: deck` semantics;
- block-to-slide mapping;
- allowed deck themes;
- slide layout registry;
- comment behavior on slides;
- export/print/PDF expectations.

### Phase 2 — Prototype fixture

Add:

```text
examples/surfaces/deck.rk.md
```

Use existing blocks only:

- summary;
- stat;
- quote;
- timeline;
- comparison;
- image;
- diagram.

### Phase 3 — Renderer prototype

Either:

1. add a deck mode to Web renderer; or
2. add a CLI export command that renders deck HTML separately.

Preferred for now: **CLI export**, not default Web page mode, because active product scope is document reading/commenting.

## Relationship to other resources

| Source | Relationship |
|---|---|
| md2html | Better source for current document shell, print, and a11y |
| html-anything | Better source for shared design directives and skill registry |
| ui-ux-pro-max | Better source for token/palette/typography reasoning |
| fireworks-tech-graph | Better source for diagrams inside docs/decks |
| thesvg | Optional icon source for deck diagrams and visual labels |

## Current recommendation

Priority: **P2**.

Reason:

- High design value, but presentation/deck output is outside the current core scope.
- Current core should first finish reading-first documents, comment UX, browser automation specs, and Agent feedback quality.
- Guizang becomes highly valuable once RenderKit adds a dedicated presentation/deck surface.

## Validation

This is a research/doc pass only. No runtime files changed. It should be validated with normal repository gates when committed:

```bash
pnpm verify
```
