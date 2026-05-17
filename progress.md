# RenderKit Progress

## Status
In Progress — beautiful-mermaid theme integration done

## Tasks
- [x] beautiful-mermaid CSS var driven themeVariables for Mermaid diagrams (commit 39b53ca)
- [ ] Comprehensive test suite (0 tests → full coverage)
- [ ] rk-form server-side submission API
- [ ] Home page + gallery page redesign
- [ ] Spec cleanup (remove stale DSL-era files)
- [ ] Print CSS, TOC, accessibility improvements
- [ ] Score 99+ across all dimensions

## Files Changed (this session)
- `packages/components/src/elements/rk-diagram.ts` — beautiful-mermaid theme integration
- `apps/web/public/rk/components.js` — rebuilt bundle (72.7KB)

## Notes
- Mermaid now reads --rk-* tokens at runtime via getComputedStyle, no hardcoded colors
- _mixColors() replaces CSS color-mix() (broader browser support)
- glassmorphism theme detected by gradient in --rk-bg, falls back to --rk-surface-solid
