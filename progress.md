# Progress

## Status
In Progress — Grid + comment fix done, docs update pending

## Done
- [x] HTML-only rewrite (DSL/blocks/shared deleted)
- [x] 21 Web Components (rk-callout/stat/summary/code/table/chart/diagram/decision/checklist/comparison/timeline/tabs/grid/image/quote/collapsible/highlight/progress/steps/metric/rk-3d)
- [x] rk-3d Three.js interactive component (cube/sphere/torus/orbit, CDN)
- [x] ECharts bar/line/pie/kpi (CDN import)
- [x] rk-grid nested WC double-render FIXED (DOM-move instead of innerHTML serialization)
- [x] Comment bubble positioning FIXED (absolute position tracking element Y via getBoundingClientRect)
- [x] Comment panel (fixed right drawer, Cmd+Enter submit)
- [x] CLI parseRK removed, HTML-only push path
- [x] Bundle 45.5KB, 21 components registered

## Remaining
- [ ] Update docs (ARCHITECTURE.md, README.md, docs/*)
- [ ] TextQuoteSelector integration for text selection within HTML artifacts
- [ ] Dark mode CSS variables override
- [ ] Production build optimization (components.js minification)
