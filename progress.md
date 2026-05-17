# RenderKit Progress

## Status
In Progress — spec cleanup + SKILL.md update done

## Tasks
- [x] beautiful-mermaid CSS var driven themeVariables for Mermaid diagrams (commit 39b53ca)
- [x] Spec cleanup (remove stale DSL-era `spec/cli/frontend/` dir)
- [x] SKILL.md 全面更新（24 WC、新评论 UX、评分标准）
- [ ] Comprehensive test suite (0 tests → full coverage)
- [ ] rk-form server-side submission API
- [ ] Home page + gallery page redesign
- [ ] Print CSS, TOC, accessibility improvements
- [ ] Score 99+ across all dimensions

## Files Changed (this session)
- `packages/components/src/elements/rk-diagram.ts` — beautiful-mermaid theme integration
- `apps/web/public/rk/components.js` — rebuilt bundle (72.7KB)
- `.trellis/spec/cli/frontend/` — deleted (7 stale DSL-era placeholder files)
- `.trellis/spec/web/html-artifact-view.md` — created (comment UX architecture)
- `.trellis/spec/components/index.md` — updated (21 → 24 WC)
- `.trellis/spec/scoring.md` — created (quality scoring rubric)
- `.pi/skills/renderkit-author/SKILL.md` — full rewrite (24 WC, new comment UX)

## Notes
- Mermaid now reads --rk-* tokens at runtime via getComputedStyle, no hardcoded colors
- _mixColors() replaces CSS color-mix() (broader browser support)
- glassmorphism theme detected by gradient in --rk-bg, falls back to --rk-surface-solid
- SKILL.md updated with: explicit close tags warning, new comment hover+add UX, 24 WC reference
- Scoring rubric: current 71/100, target 99/100
