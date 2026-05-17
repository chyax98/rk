# Progress

## Status
In Progress

## Tasks
- [x] apps/web/lib/store.ts — typed (0 any remaining)
- [x] apps/web/lib/db.ts — typed
- [x] packages/blocks strict: true — all type errors fixed

## Files Changed
- `apps/web/lib/store.ts` — added interfaces: DbArtifact, DbRevision, DbComment, ParsedModel, ArtifactMeta, Revision, TextQuoteSelector, Comment, BlockDiff, RkBlock; replaced all `any` with specific types; added return types to all exports
- `apps/web/lib/db.ts` — migrate() return type void, closeDb() return type void
