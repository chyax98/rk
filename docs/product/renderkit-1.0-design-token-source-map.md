# RenderKit 1.0 Design Token Source Map

Status: research-to-implementation guidance  
Date: 2026-05-17

## Objective

The active goal asks RenderKit to learn from mature design systems and preserve reusable process assets. This document maps concrete findings from cloned design resources into RenderKit design-token decisions.

Primary sources inspected:

```text
research/design-assets/external-repos/md2html/template.html
research/design-assets/external-repos/ui-ux-pro-max-skill/src/ui-ux-pro-max/data/styles.csv
research/design-assets/external-repos/ui-ux-pro-max-skill/src/ui-ux-pro-max/data/colors.csv
research/design-assets/external-repos/ui-ux-pro-max-skill/src/ui-ux-pro-max/data/typography.csv
research/design-assets/external-repos/ui-ux-pro-max-skill/src/ui-ux-pro-max/data/ux-guidelines.csv
```

## Source observations

### 1. md2html token model

Evidence from `md2html/template.html`:

- root token block begins around `:root` near the top of the file;
- separate dark-mode token set through `[data-theme="dark"]`;
- document shell includes skip link, focus-visible rules, `prefers-reduced-motion`, and `@media print`;
- document colors avoid pure black/white in the UI shell (`#FAFAF7`, `#1A1A1A`, warm accent family);
- tokens cover background, surfaces, borders, text, accent, semantic tones, radii, z-index, typography, and progress/chrome.

### 2. ui-ux-pro-max style database

Evidence from `styles.csv`:

- Minimalism / Swiss Style recommends clean, spacious, high-contrast, grid-based, sans-serif systems.
- Effects should be subtle: `200-250ms` hover transitions, clear type hierarchy, fast loading.
- Neumorphism/glassmorphism exist but are not good defaults for RenderKit because they can reduce readability and increase visual noise.

### 3. ui-ux-pro-max color database

Evidence from `colors.csv`:

- SaaS/general palettes often use blue primary (`#2563EB`) and orange accent (`#EA580C`).
- Micro SaaS palettes use indigo/purple primary (`#6366F1`) and green accent (`#059669`).
- E-commerce/wellness patterns often use green primary (`#059669`).

RenderKit should not blindly switch palettes by industry, but these are useful defaults for semantic tone mapping.

### 4. ui-ux-pro-max typography database

Evidence from `typography.csv`:

- `Classic Elegant`: Playfair Display + Inter for editorial/luxury.
- `Modern Professional`: Poppins + Open Sans for corporate/SaaS.
- `Tech Startup`: Space Grotesk + DM Sans for tech/startup products.

RenderKit should prefer system fonts by default for local-first/offline behavior, but these pairings inform optional theme directions.

### 5. ui-ux-pro-max UX guidelines

Evidence from `ux-guidelines.csv`:

- Smooth scroll for anchor navigation.
- Sticky navigation must not obscure content.
- Active/current section states should be visually indicated.

RenderKit implication: if/when outline/TOC becomes sticky, headings need scroll margins and current-outline indication must stay secondary.

## RenderKit token implications

### Token categories that should remain core

RenderKit already has CSS token files:

```text
packages/design/src/tokens.css
packages/design/src/themes.css
packages/design/src/surfaces.css
packages/design/src/blocks.css
apps/web/app/style.css
```

The following categories should be stable across themes:

| Category | Required tokens | Source inspiration |
|---|---|---|
| Background/surface | page, document, raised, solid | md2html root/dark tokens |
| Text | primary, secondary, muted, subtle | md2html, Notion-like docs |
| Accent | primary accent, accent soft, accent border | md2html, ui-ux-pro SaaS palettes |
| Semantic tones | info, warning, danger, success | md2html callout tokens, ui-ux color DB |
| Typography | display/title/body/mono/label scales | md2html + ui-ux typography DB |
| Spacing | 8px baseline scale | html-anything shared directives |
| Radius | sm/md/lg/xl/full | md2html + html-anything directives |
| Shadow | subtle only by default | ui-ux minimal/SaaS guidance |
| Motion | short and optional; reduced-motion kill switch | md2html, ui-ux UX DB |
| Print | print-safe tokens, hidden chrome | md2html print CSS |

### Default theme recommendation

For `paper-light`, stay close to mature document/blog systems:

```text
background: warm off-white / paper
surface: white or near-white
text: near-black, not pure #000
accent: restrained blue or warm red/orange
borders: low-contrast neutral
shadow: minimal
measure: 65-75ch for prose
```

Why:

- Aligns with md2html's paper-like shell.
- Avoids Notion/Feishu-style dashboard chrome overload.
- Preserves readability on long technical docs.

### Technical/report theme recommendation

For engineering/data surfaces:

```text
primary accent: #2563EB or equivalent blue
warning/accent: #EA580C
success: #059669
muted text: neutral gray
monospace blocks: high contrast but not black-box heavy by default
```

Why:

- Matches ui-ux-pro-max SaaS/product palettes.
- Works with existing RenderKit `stat`, `timeline`, `comparison`, code/chart/table blocks.

### Editorial theme recommendation

For `editorial-kami`:

```text
background: warm parchment
heading: optional serif tone, but preserve body readability
accent: restrained warm red/purple
quotes: large pull-quote treatment
```

Why:

- Aligns with blog/editorial systems and prior RenderKit theme direction.
- Should remain opt-in, not default.

## Rules for future token changes

1. **Do not use pure black/pure white as dominant UI defaults** unless print mode explicitly requires it.
2. **Do not make comments or metadata visually dominant** in reading mode.
3. **Use 8px rhythm** for spacing, but allow prose line-height to optimize readability.
4. **Keep one primary accent per theme**; semantic tones should support meaning, not decoration.
5. **Every token addition must have a consumer**. Do not add token bloat.
6. **Every design-token pass must include browser evidence** when visual behavior changes.
7. **External source must be documented** when a token family or pattern is adopted.

## Integration backlog derived from this map

| Priority | Task | Target |
|---|---|---|
| P0 | md2html-inspired print + focus + reduced-motion polish | `apps/web/app/style.css`, `packages/design/src/*` |
| P0 | reading measure tokens | `packages/design/src/tokens.css` |
| P1 | optional outline scroll/current-section polish | `ArtifactView.jsx`, `style.css` |
| P1 | design-token comments in `themes.css` citing source inspiration | `packages/design/src/themes.css` |
| P2 | `renderkit design recommend` CLI idea using ui-ux-pro-max data | future CLI |

## What is intentionally not integrated now

- No dynamic industry palette switching.
- No Google Fonts runtime dependency.
- No heavy glassmorphism/neumorphism as default.
- No pure prompt-driven design generation.
- No direct vendoring of ui-ux-pro-max CSVs into RenderKit runtime.

## Validation expectation

When implementing from this map, run:

```bash
pnpm verify
pnpm verify:sqlite
pnpm verify:smoke
pw -h
pw errors/get/screenshot on affected pages
```
