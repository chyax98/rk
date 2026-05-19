# RenderKit Maintenance Audit — 2026-05-18

Scope:
- `apps/web` review shell / list shell
- `packages/cli`
- `packages/components` registry/catalog
- no `build`

## What was reviewed

- `apps/web`
  - comment thread flow
  - comment rebind behavior across revisions
  - review-shell CSS layering
  - list-shell CSS layering
- `packages/cli`
  - feedback output contract
  - command surface vs README / smoke check alignment
- `packages/components`
  - component registry completeness
  - registry duplication vs source of truth

## Confirmed issues found

1. Comment rebind only handled `open` comments.
   - Impact: `addressed` threads could lose anchor continuity after a new push.
   - Fixed in [store.ts](/Users/xd/Worker/tools/RenderKit/apps/web/lib/store.ts:773).

2. CLI markdown feedback formatter still depended on legacy `openComments`.
   - Impact: `rk feedback --format md` drifted from v2 thread-shaped feedback.
   - Fixed in [utils.mjs](/Users/xd/Worker/tools/RenderKit/packages/cli/src/utils.mjs:55) and [renderkit.mjs](/Users/xd/Worker/tools/RenderKit/packages/cli/bin/renderkit.mjs:240).

3. CLI/README/registry drift around `rk components`.
   - Impact: README advertised a command that did not exist; component inventory was incomplete and misleading.
   - Fixed by adding the command and switching to source-derived catalog.

4. Hand-maintained component registry had drifted from actual registered components.
   - Before: 21 documented items vs 46 registered tags.
   - After: 46 catalogued items, 46 documented items, 0 derived leftovers.
   - Implemented in [catalog.mjs](/Users/xd/Worker/tools/RenderKit/packages/components/src/catalog.mjs:1) and [index.ts](/Users/xd/Worker/tools/RenderKit/packages/components/src/index.ts:1).

5. Review shell and list shell bypassed design tokens heavily.
   - Impact: app chrome had its own visual system instead of consuming `@renderkit/design`.
   - Progress made in [doc-app.css](/Users/xd/Worker/tools/RenderKit/apps/web/app/style/doc-app.css:1) and [list.css](/Users/xd/Worker/tools/RenderKit/apps/web/app/style/list.css:1).

## Changes completed

- Rebind now includes `addressed` comments.
- CLI markdown feedback now renders v2 thread data with `waitingFor`.
- Added `rk components`.
- Added source-derived component catalog with per-component overrides.
- Reduced hard-coded shell color usage in `apps/web` list/review surfaces.

## Verification evidence

Commands run:

```bash
node --experimental-strip-types --test tests/store-routes.test.ts tests/cli-format.test.ts
node --experimental-strip-types --test tests/components-catalog.test.ts tests/cli.test.ts tests/cli-format.test.ts
pnpm exec biome check apps/web/app/style/doc-app.css apps/web/app/style/list.css
pnpm exec biome check 'apps/web/app/a/[id]/HtmlArtifactView.tsx'
pnpm exec biome check packages/components/src/catalog.mjs packages/components/src/index.ts packages/cli/src/utils.mjs packages/cli/bin/renderkit.mjs tests/components-catalog.test.ts tests/cli.test.ts package.json
node packages/cli/bin/renderkit.mjs components
```

Observed results:

- component catalog:
  - `count: 46`
  - `documentedCount: 46`
  - `derivedCount: 0`
- `apps/web` shell hard-coded `#hex/rgba(...)` count in:
  - `list.css + doc-app.css`
  - reduced from roughly `125` to `0`

## Remaining risk / not yet proven

1. No browser-level verification was rerun after the latest token refactor.
   - Static checks passed, but no new screenshot / interaction audit was executed in this pass.

2. A few local workspace files were already dirty before this work and were intentionally untouched.
   - Examples:
     - `packages/components/src/elements/rk-map.ts`
     - `packages/components/src/elements/rk-globe.ts`
     - `apps/web/public/rk/components.js`
     - `examples/cases/*.html`
     - `scripts/render-scan.mjs`

3. `packages/components` catalog is now complete, but some descriptions are still implementation-oriented.
   - They are accurate enough for tooling.
   - They can still be improved for author-facing docs later.

## Recommended next steps

1. Run one browser verification pass on the review shell and list shell after the token refactor.
2. Decide whether `apps/web/public/rk/components.js` should be regenerated in a later build-only window.
3. If desired, upgrade component descriptions from implementation notes to author-oriented usage guidance.
