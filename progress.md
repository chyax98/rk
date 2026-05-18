# Progress

## Status
In Progress

## Tasks

### Done
- [x] rk-narrative WC implemented (pure vanilla, no CDN)
  - Inline text + sparklines + value highlights + badges + mini bars
  - 5 phrase types: text, value, sparkline, bar, badge
  - Zero external dependency
- [x] CLI improvements completed
  - D2 WASM removed, clear fallback message
  - `_reportRenderError` added to rk-diagram + rk-chart (5 error points)
  - `render_errors` DB table + `recordRenderError` / `getRenderErrors` in store
  - `POST /api/artifacts/:id/render-errors` endpoint
  - `rk feedback` now includes `renderErrors[]`
  - `rk doctor` checks d2 CLI availability
- [x] New WC components batch (background agents)
  - `rk-infographic` — @antv/infographic CDN
  - `rk-map` — Leaflet CDN (no API key needed, OpenStreetMap)
  - `rk-plot` — Observable Plot CDN
  - `rk-datagrid` — AG Grid Community CDN

### In Progress
- [ ] rk-sketch (Rough.js)
- [ ] model-viewer integration
- [ ] rk-plot-3d (Plotly.js)
- [ ] rk-zdog (Zdog)

## Build
- Bundle: 130.1KB (apps/web/public/rk/components.js)
- Tests: 75/75 pass
- TypeScript: no errors

## Files Changed (this session)
- `packages/components/src/elements/rk-diagram.ts` — D2 fix + _reportRenderError
- `packages/components/src/elements/rk-chart.ts` — _reportRenderError in 3 catch blocks
- `apps/web/lib/db.ts` — render_errors table migration
- `apps/web/lib/store.ts` — recordRenderError, getRenderErrors, getFeedback, deleteArtifact
- `apps/web/app/api/artifacts/[id]/render-errors/route.ts` — NEW endpoint
- `packages/cli/bin/renderkit.mjs` — d2 check in doctor
- `apps/web/public/rk/components.js` — rebuilt
