# RenderKit 1.0 第 17 轮飞轮：Store/API Typed Boundary

状态：已实现并验证  
日期：2026-05-17

## 目标

第 16 轮给 DSL package 增加了 typed `parseRK()` 边界。本轮继续 TypeScript Stage 2/3 的低风险路径：不机械迁移 runtime，而是先把 Web store 与 API payload 的公共边界类型化，降低 CLI/Web/Agent feedback 的契约漂移风险。

## 改动

新增：

```text
apps/web/lib/store.d.ts
apps/web/lib/api-contracts.d.ts
```

更新：

```text
packages/shared/src/contracts.d.ts
apps/web/app/api/artifacts/[id]/route.js
scripts/verify-contracts.mjs
```

### 1. Store typed boundary

`apps/web/lib/store.d.ts` 为以下函数声明返回类型：

```text
ensureStore()
listArtifacts()
createArtifact()
addRevision()
getArtifactMeta()
getArtifact()
getRevision()
getComments()
addComment()
updateCommentStatus()
getFeedback()
```

类型来源于 shared contracts：

```text
ArtifactBundle
ArtifactComment
ArtifactMeta
ArtifactRevision
FeedbackPayload
TextQuoteSelector
RenderKitModel
Diagnostic
```

### 2. API payload contracts

`apps/web/lib/api-contracts.d.ts` 声明 API 请求/响应：

```text
CreateArtifactRequest / Response
AddRevisionRequest / Response
ArtifactStatusResponse
AddCommentRequest / Response
UpdateCommentStatusRequest / Response
FeedbackResponse
ApiErrorResponse
```

这些类型让 CLI/API/Agent feedback 后续可以共享 payload 形状，而不是靠路由实现细节猜测。

### 3. Shared contracts 对齐 store 实际形状

修正：

- `ArtifactMeta.currentRevision` 对齐 `store.mjs`。
- `ArtifactRevision.number/sourceText/sourceHash/blockIds` 对齐 SQLite row mapping。
- `ArtifactComment.blockSnapshot` 允许 `null`。
- `FeedbackPayload` 对齐实际 `/feedback` 输出：`artifactId/currentRevision/url/openComments`。

### 4. API route 使用 shared comment status

`apps/web/app/api/artifacts/[id]/route.js` 不再硬编码 `open/resolved/orphaned`，改为从 `COMMENT_STATUSES` 派生。

## 验证

```bash
pnpm verify:contracts
# Results: 66 passed, 0 failed

pnpm verify
# Results: 218 passed, 0 failed
```

新增 verifier 检查：

- Store 是否暴露 typed artifact/comment/feedback boundary。
- Store d.ts 是否使用 shared contracts。
- API contracts 是否声明核心 request/response payloads。
- Artifact status route 是否使用 shared comment status contracts。

## 后续

1. Store/API runtime 可以继续逐步迁移到 `.ts` 或 typed JSDoc。
2. Renderer registry 和 `ArtifactView` 高状态组件仍是后续 typed implementation 重点。
3. 不建议一次性迁移全仓；继续用小 boundary + verifier 的方式推进。
