# RenderKit Progress

## Completed
- [x] packages/shared: .mjs → .ts
- [x] packages/dsl: split into 16 compiler files
- [x] packages/blocks: all .jsx → .tsx
- [x] API routes: all 8 .js → .ts
- [x] ArtifactView → Feishu model
- [x] CSS quality lift (~1900 lines)
- [x] CI/lint: biome + lefthook
- [x] HTML + Web Components architecture decided
- [x] 11 initial Web Components built
- [x] **20 Web Components** — added 9 more: tabs, grid, image, quote, collapsible, highlight, progress, steps, metric
- [x] HTML push pipeline working (processHTML → anchors → render)
- [x] HtmlArtifactView with anchor bubbles

## In Progress
- [ ] Remove rkmd dual path (packages/dsl, packages/blocks deletion)
- [ ] Comment system integration in HTML artifact
- [ ] More reference repo components integrated
- [ ] 3D/interactive components

## Bundle Stats
- components.js: 39.7kb (20 custom elements)
- components.css: 1183 lines
- theme.css: CSS variables only
