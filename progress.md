# RenderKit Progress — Web Layer (apps/web)

## Status: DONE

### Completed
- [x] Bug 1: feedbackCmd → `renderkit feedback ${artifactId}`
- [x] Bug 2: ReviewPanel 3-tab (评论/当前块/Agent) real branching
- [x] Bug 3: CommentCard no raw ID/English status, Chinese status labels
- [x] Bug 4: BlockInspector block.id in `<details>` collapse
- [x] ArtifactView.tsx → 94 lines (from 235)
- [x] page.jsx → page.tsx with typed props
- [x] lib.ts extracted (flattenBlocks, blockLabel, copyToClipboard)
- [x] useReviewState updated with menu state + openMenu
- [x] All 12 components verified correct
- [x] Old .jsx files deleted

### Blocked (not in scope)
- `pnpm verify` broken due to packages/dsl dist build issue (parallel agent)
- `pnpm verify:browser` depends on packages/dsl fix
