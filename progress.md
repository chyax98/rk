# Progress

## Status
In Progress

## Tasks

### Done
- [x] HTML artifact comment panel (click rail dot → open drawer, submit via API, local state update)
- [x] CSS quality lift: md2html warm palette (#FAFAF7 bg, #D97757 accent)
- [x] theme.css rewritten with warm paper-light semantic colors
- [x] style.css: +295 lines (HTML layout, native typography, comment rail, comment panel, responsive)
- [x] HtmlArtifactView.tsx full rewrite (comment interaction + panel)

### In Progress
- [ ] HTML-only full rewrite (remove rkmd dual path — packages/dsl, packages/blocks, packages/shared)
- [ ] More Web Components (tabs, grid, image, quote, collapsible, highlight, progress, steps, metric)
- [ ] Reference repo integration (md2html patterns, fireworks diagram primitives)
- [ ] biome config fix (currently blocking commits without LEFTHOOK=0)
- [ ] CLI cleanup (remove rkmd commands, add HTML-only commands)

### Blocked
- None

## Files Changed
- apps/web/app/a/[id]/HtmlArtifactView.tsx — complete rewrite
- apps/web/public/rk/theme.css — complete rewrite (warm palette)
- apps/web/app/style.css — +295 lines (comment panel CSS)
- apps/web/public/rk/app-style-backup.css — backup

## Notes
- Commit: 9142700 feat: HTML artifact comment panel + CSS quality lift from md2html
- Comment system: rail dots on right → click → panel opens → textarea + submit → POST API → local state update
- Responsive: rail hidden below 768px, panel goes full width
