# RenderKit Progress

## Completed
- [x] packages/shared: .mjs → .ts (DELETED — no longer needed)
- [x] packages/dsl: split into 16 compiler files (DELETED — no longer needed)
- [x] packages/blocks: all .jsx → .tsx (DELETED — no longer needed)
- [x] API routes: all 8 .js → .ts, rewritten for HTML-only
- [x] ArtifactView → Feishu model (DELETED — replaced by HtmlArtifactView)
- [x] CSS quality lift (~1900 lines)
- [x] CI/lint: biome + lefthook
- [x] HTML + Web Components architecture decided and implemented
- [x] **20 Web Components** — callout, chart, checklist, code, comparison, decision, diagram, stat, summary, table, timeline + tabs, grid, image, quote, collapsible, highlight, progress, steps, metric
- [x] HTML push pipeline (processHTML → anchors → SQLite → render)
- [x] HtmlArtifactView with anchor bubbles + inline comment thread
- [x] **HTML-only complete** — all rkmd dual path removed:
  - Deleted packages/dsl, packages/blocks, packages/shared
  - Rewritten store.ts (no parseRK, no createArtifact, no addRevision)
  - Rewritten API routes (always HTML)
  - Rewritten page.tsx (only HtmlArtifactView)
  - Rewritten CLI (push/status/feedback/delete only)
  - Comment system inline in HtmlArtifactView
  - All @renderkit/dsl, @renderkit/shared, @renderkit/blocks refs purged

## In Progress
- [ ] CSS refinement for comment thread panel
- [ ] More reference repo components integrated (md2html patterns, fireworks diagrams)
- [ ] 3D/interactive component consideration

## Next Steps
1. Verify end-to-end: push HTML → render → comment cycle works
2. Build components bundle (pnpm build in packages/components)
3. Add more components from reference repos
4. CSS quality pass for comment cards and thread
