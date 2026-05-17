# Progress

## Status
In Progress

## Tasks

### Done
- [x] HTML-first architecture rewrite (DSL + React blocks deleted)
- [x] 21 Web Components (Light DOM, no shadow DOM)
- [x] rk-3d interactive 3D component (Three.js CDN)
- [x] ECharts charts via CDN (bar/line/pie/kpi)
- [x] Comment system: anchor injection + bubble rail + fixed panel
- [x] CLI: push/feedback/patch/append/anchors/components
- [x] CSS theme from md2html warm palette
- [x] Documentation updated (README, ARCHITECTURE, CONTRIBUTING)

### In Progress
- [ ] rk-grid nesting bug (DOM move instead of innerHTML capture)
- [ ] Comment bubble Y-position tracking (getBoundingClientRect)
- [ ] Comment submission end-to-end verification

### Next
- [ ] Agent workflow docs (SKILL.md update)
- [ ] rk-tabs click handler browser verification

## Files Changed
- README.md — new (HTML-first overview + 21 components table)
- ARCHITECTURE.md — rewritten (system flow, DB schema, CLI commands)
- CONTRIBUTING.md — rewritten (how to add WC, CSS theme, dev setup)
- docs/test-plan.md — deleted (obsolete, DSL-era)
- docs/alpha-0.0.2-plan.md — deleted (obsolete)
- docs/theme-strategy.md — deleted (obsolete)

## Notes
- Git reset incident: reflog recovery at commit 4ac5b7f restored all work
- packages/dsl, packages/blocks, packages/shared are empty dirs (only node_modules remain)
