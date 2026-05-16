# @renderkit/design

Design system layer for RenderKit. Pure CSS custom properties + utility classes. No runtime, no framework dependency.

## Architecture

```
tokens.css     → Reference tokens (raw values: spacing, radii, typography scale, elevation, motion, z-index)
themes.css     → Semantic tokens per theme (colors, shadows, borders, app chrome)
surfaces.css   → Surface-specific density/spacing overrides (engineering-plan, decision-brief, etc.)
blocks.css     → Block component styles + pills, badges, chips, menus, inspector, source excerpts
chrome.css     → App chrome layout: topbar, sidebar, rail, buttons, shell grid
index.css      → Re-exports all layers in order
```

## Themes

| Theme | Description |
|---|---|
| `paper-light` | Default white document theme. Neutral chrome, light code blocks, print/screenshot friendly. |
| `dark-pro` | Optional deep blue dark theme. High contrast cyan accent. |
| `paper-light` | Warm off-white light theme. Blue accent on cream. |
| `amber-terminal` | Dark amber phosphor CRT aesthetic. Monochromatic amber palette. |
| `editorial-kami` | Japanese editorial aesthetic. Serif body. Warm paper. Deep red accent. |

Apply via `data-rk-theme="paper-light"` on a container element.

## Surfaces

Surfaces control density, max-width, and block emphasis based on document type:

| Surface | Behavior |
|---|---|
| `engineering-plan` | Full-width, compact spacing, smaller headings |
| `decision-brief` | Narrow (760px), centered, decision cards emphasized |
| `review-report` | Full-width, callout emphasis, danger callouts bold |
| `runbook` | Medium (840px), step-oriented, code blocks bordered |
| `data-report-lite` | Full-width, dense, minimal heading margin |
| `proposal` | Medium (820px), comfortable reading |
| `documentation` | Narrow (780px), relaxed line height |

Apply via `data-rk-surface="engineering-plan"` on a container.

## Token Categories

### Typography
- **Scale**: `--rk-text-xs` (11px) through `--rk-text-4xl` (52px)
- **Presets**: `--rk-type-display`, `--rk-type-h1`..`h4`, `--rk-type-body`, `--rk-type-body-sm`, `--rk-type-caption`, `--rk-type-mono`, `--rk-type-label`
- **Weights**: `--rk-weight-normal`..`extrabold`
- **Line heights**: `--rk-lh-tight` (1.25), `snug` (1.4), `normal` (1.6), `relaxed` (1.75)

### Elevation
- `--rk-shadow-xs` through `--rk-shadow-xl`, `--rk-shadow-inset`

### Spacing
- `--rk-space-0` (0) through `--rk-space-20` (80px)

### Density
- `--rk-density-compact` (0.7), `--rk-density-normal` (1.0), `--rk-density-comfortable` (1.3)
- Surfaces set `--rk-density` to scale spacing

### Z-index
- `--rk-z-base` (0), `raised` (10), `sticky` (100), `overlay` (200), `dropdown` (300), `modal` (400), `toast` (500)

### Motion
- Durations: `--rk-duration-fast` (80ms), `normal` (150ms), `slow` (300ms)
- Easings: `--rk-ease`, `--rk-ease-in`, `--rk-ease-out`, `--rk-ease-bounce`

## Component Classes

| Class | Purpose |
|---|---|
| `.rk-block` | Base block container |
| `.rk-block[data-rk-selected]` | Selected block state |
| `.rk-pill` | Status pill (use `data-status`) |
| `.rk-badge` | Notification count badge |
| `.rk-chip` | Filter/tag chip (use `data-active`) |
| `.rk-menu` | Context/command menu |
| `.rk-menu-item` | Menu row |
| `.rk-command-palette` | Modal command palette |
| `.rk-inspector` | Side inspector panel |
| `.rk-source-excerpt` | Source code excerpt with line numbers |
| `.rk-btn-primary` / `.rk-secondary-btn` / `.rk-ghost-btn` | Button variants |
| `.rk-scrollable` | Scroll container with themed scrollbar |

## Contrast Notes

All themes are designed for WCAG AA compliance on primary text:

- **dark-pro**: `#ecf2ff` on `#0b1020` → ~15.5:1 ratio. Accent `#7dd3fc` on `#0b1020` → ~10:1.
- **paper-light**: `#1a1a1a` on `#f8f7f4` → ~14:1 ratio. Accent `#0267a5` on `#f8f7f4` → ~6.5:1.
- **amber-terminal**: `#ffd866` on `#1a1400` → ~13:1 ratio. Single-hue design ensures all text variants maintain >4.5:1.
- **editorial-kami**: `#1c1917` on `#f5f0e8` → ~14:1 ratio. Accent `#b91c1c` on `#f5f0e8` → ~5.5:1.

Status pills use paired bg/text tokens (`--rk-status-*-bg` / `--rk-status-*-text`) calculated for ≥4.5:1 contrast in each theme.

## Usage

```css
/* Import everything */
@import '@renderkit/design/index.css';

/* Or individual layers */
@import '@renderkit/design/tokens.css';
@import '@renderkit/design/themes.css';
```

```html
<div data-rk-theme="paper-light" data-rk-surface="engineering-plan">
  <main class="rk-content">
    <section class="rk-block" data-block-id="b1">
      <!-- block content -->
    </section>
  </main>
</div>
```
