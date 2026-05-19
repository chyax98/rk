# Render Diagnostics and Design Asset Plan

Date: 2026-05-18

## Goal

Make RenderKit safe for agents to use on complex artifacts: rendering failures must identify the component, case, CDN, or lifecycle pattern that caused them.

## Current Evidence

- `pnpm run test` covers server/store/CLI and currently passes, but browser-only failures were found manually in WC components.
- `scripts/render-scan.mjs` now pushes `examples/cases/*.html`, opens each artifact in a browser, and records:
  - push-time SSR warnings
  - DOM `.rk-*__error` messages
  - `feedback.renderErrors[]`
  - browser console errors
  - failed network requests
  - component smoke signals
- First matrix: `examples/cases/diagram-rendering-matrix.html` passes with 0 warnings/errors.

## Workstreams

### P0 — Render Diagnostic Harness

- Keep `scripts/render-scan.mjs` as the browser rendering gate.
- Use `pnpm verify:agent` before handing off or pushing a renderer/lifecycle/CDN change.
- Reports are generated under `reports/render-scan/` and ignored by git.
- Add cases before fixing new rendering bugs.

### P1 — Case Matrix

Target files under `examples/cases/`:

| File | Target Coverage |
|---|---|
| `diagram-d2.html` | D2 architecture, topology, dependencies, event pipelines |
| `diagram-mermaid.html` | Mermaid flowchart, sequence, state, gantt, class, ER, journey |
| `charts.html` | ECharts, Observable Plot, Plotly 3D, infographic |
| `maps-geo.html` | Leaflet map, Globe.gl |
| `network.html` | Cytoscape, 3d-force-graph, X6 flow |
| `layout-nesting.html` | section/card/grid/tabs nested lifecycle stress |
| `forms-interactive.html` | form, kanban, checklist, steps, timeline, decision, comparison |
| `theme-matrix.html` | 8 themes × core components |
| `content-base.html` | callout, code, diff, quote, highlight, summary, table, narrative |
| `3d-visual.html` | rk-3d, rk-zdog, rk-sketch, rk-model |
| `data-tables.html` | rk-table, rk-datagrid, rk-stat |

Target: 100+ cases with smoke selectors or default component smoke.

### Verification Gate

```bash
pnpm verify:agent
```

This runs:

1. `pnpm check:lifecycle` — static WC lifecycle/CDN pin checks
2. `pnpm run test` — server/store/CLI/linkedom tests
3. `pnpm renderkit doctor --cdn` — lazy dependency URL audit
4. `pnpm scan:render` — browser artifact render scan over `examples/cases/*.html`

### P2 — Lifecycle Contract

Rules:

1. `attributeChangedCallback` must not render before connection.
2. Async renderers must cancel stale renders with a sequence token.
3. Heavy components must clean observers, animation frames, canvases, maps, graphs, and WebGL resources in `disconnectedCallback`.
4. CDN loaders must use exact versions and one main path. No multi-CDN compatibility fallback.
5. Broken old examples are fixed or deleted; components do not grow compatibility glue for bad inputs.

### P3 — D2 / Mermaid Main Route

- D2: architecture, dependency, topology, system boundary, deployment.
- Mermaid: flow, sequence, state, gantt, ER, class, journey.
- Graphviz/PlantUML stay available for explicit legacy DSL needs, but are not the default authoring route.

### P4 — CDN Reliability

- Add `rk doctor --cdn` or equivalent script gate.
- Pin all lazy-loaded CDN URLs to exact versions.
- Check URL status in diagnostics; replace broken main path instead of adding fallback chains.

### P5 — Design Asset Enhancement

Design assets should help agents make better-looking artifacts by default, not add decorative gimmicks.

Implementation sequence:

1. Add `theme-matrix.html` with 8 themes × core components and scan it.
2. Document surface presets (`engineering-plan`, `decision-brief`, `review-report`, `runbook`, `data-report-lite`, `proposal`, `documentation`) with examples.
3. Audit `components.css` for hardcoded colors and replace with semantic `--rk-*` tokens where it changes rendered quality.
4. Add visual smoke screenshots only after DOM render scan is stable.

## Component Cleanup Principle

If a component is worse-looking, rarely useful, or replaceable by a higher-level component, write a decision entry before removal. The decision must include:

- current usage in examples/cases
- replacement component or authoring pattern
- user-facing migration path
- removal checklist

Initial candidates to evaluate, not remove immediately:

| Candidate | Likely Replacement | Reason to Evaluate |
|---|---|---|
| `rk-sketch` | D2 / Mermaid | Hand-drawn style is niche and can look less professional |
| `rk-zdog` | `rk-model` or no replacement | Pseudo-3D illustration is hard for agents to author well |
| `rk-3d` | `rk-model` | Free-form Three.js scene is too broad and failure-prone |
| `rk-plot3d` | `rk-chart` / `rk-plot` | 3D charts are heavy and often less readable |
| `rk-graph3d` | `rk-graph` | 3D networks are visually noisy compared with 2D graph layouts |
| `rk-infographic` | `rk-chart` + `rk-metric` | Browser-only DOM library, uncertain value over simpler components |
