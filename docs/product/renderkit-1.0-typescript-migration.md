# RenderKit 1.0 TypeScript Migration Plan

Status: Stage 1 implemented; later stages planned  
Date: 2026-05-17

## Decision

RenderKit started with JavaScript / `.mjs` / `.jsx` to quickly prove the local Agent-to-UI loop. That was correct for Alpha speed, but it should not remain the long-term 1.0 architecture.

The product now has enough structured contracts that TypeScript becomes valuable:

- DSL model shape: blocks, props, diagnostics, source ranges.
- Artifact/revision/comment schema in SQLite.
- Selector metadata: exact/prefix/suffix.
- Block renderer registry and props.
- CLI/API feedback contracts consumed by Agents.

TypeScript should be adopted before 1.0 architecture freeze, but it should not interrupt the current product flywheel for reading UI, comment UX, design assets, and verification.

## Migration principles

1. **Contracts first, runtime later.** Start with shared type definitions and generated/checked contracts before renaming every file.
2. **Do not block product delivery.** TS migration is a hardening track, not a reason to pause UI/comment/storage improvements.
3. **Prefer clean architecture over compatibility.** If a typed module boundary is better, migrate directly instead of preserving awkward legacy shapes.
4. **Keep Agent-facing JSON stable.** TypeScript is internal safety; CLI/API shapes should remain intentionally designed.
5. **Add verification gates.** `tsc --noEmit` should become a green gate only after the first typed package exists.

## Proposed stages

### Stage 1 — Shared contracts（已完成）

Add a shared type package surface:

```text
packages/shared/src/types.ts
packages/shared/src/index.ts
```

Initial types:

```text
RenderKitModel
RenderKitBlock
BlockType
SourceRange
Diagnostic
ThemeName
SurfaceName
ArtifactMeta
ArtifactRevision
ArtifactComment
TextQuoteSelector
FeedbackPayload
```

Implemented files:

```text
packages/shared/src/contracts.d.ts
packages/shared/src/contracts.mjs
scripts/verify-contracts.mjs
```

Current success gate:

```bash
pnpm verify:contracts
pnpm verify
pnpm verify:sqlite
```

Latest evidence:

```text
pnpm verify:contracts -> Results: 52 passed, 0 failed
pnpm verify           -> Results: 213 passed, 0 failed
```

`pnpm typecheck` remains a later gate after the first `.ts/.tsx` source module exists.

### Stage 2 — DSL type boundary

Migrate DSL compiler types first:

```text
packages/dsl/src/index.mjs -> index.ts or typed JSDoc bridge
```

Focus:

- `parseRK()` return type.
- `BLOCK_COMPILERS` registry type.
- per-block `props` discriminated unions.
- diagnostics type and error codes.

### Stage 3 — Store/API contracts

Migrate or type-check:

```text
apps/web/lib/db.mjs
apps/web/lib/store.mjs
apps/web/app/api/**/route.js
```

Focus:

- SQLite row mapping.
- comment lifecycle state machine.
- feedback shape returned to Agents.
- selector normalization.

### Stage 4 — Blocks renderer

Migrate renderer package:

```text
packages/blocks/src/*.jsx -> *.tsx
```

Focus:

- `RenderBlock` discriminated union.
- block component props.
- registry typing: every block type must have a renderer.

### Stage 5 — Web UI components

Migrate high-state UI last:

```text
apps/web/app/a/[id]/ArtifactView.jsx -> ArtifactView.tsx
```

Focus:

- selection/comment state.
- highlight range functions.
- review filters.
- API payload types.

## Non-goals for now

- Do not convert the whole repository in one mechanical pass.
- Do not introduce complex codegen until contracts stabilize.
- Do not add TypeScript just to satisfy style preferences; it must reduce product risk.

## Current priority

Current product flywheel remains higher priority:

1. Reading-first UI polish.
2. Lightweight but strong comments.
3. SQLite hardening and migration tooling.
4. Diagram visual language and design assets.
5. Browser verification with `pw`.

Stage 1 shared contracts are now implemented. Remaining TypeScript work is Stage 2+ migration of DSL, Store/API, renderer, and high-state Web UI components.
