# API Routes

## 通用约定

- **位置**: `app/api/` 目录，遵循 Next.js App Router Route Handler 规范
- **参数**: Next.js 15 的 `params` 是 `Promise`，必须 `await params` 后使用
- **响应格式**: 统一 `{ ok: boolean, ... }`
  - 成功：`Response.json({ ok: true, ... })`
  - 失败：`Response.json({ ok: false, error: ... }, { status: xxx })`
- **不使用 try/catch 全包**的错误处理：仅在外部边界（POST body 解析、store 调用）使用
- **错误码**: 特定错误用 `{ code: 'RK_ARTIFACT_NOT_FOUND', message: '...' }` 格式

## 路由清单

### `GET /api/health`
健康检查。返回 `{ ok: true, name: 'renderkit', version }`。

### `GET /api/artifacts`
列出所有 artifact。调用 `listArtifacts()`。

### `POST /api/artifacts`
推送新 HTML artifact。

**请求体**: `{ html: string, file?: string, title?: string }`
**响应**: `{ ok: true, artifactId, revision, url, format: 'html' }`

`url` 通过 `absolute(req, path)` 转为完整 URL。

### `GET /api/artifacts/:id`
获取 artifact 概要（不含 HTML 内容）。

**响应**: `{ ok: true, artifact: ArtifactMeta, revision: number, comments: { open, resolved, orphaned } }`

### `DELETE /api/artifacts/:id`
删除 artifact 及所有关联数据。

### `POST /api/artifacts/:id/comments`
创建评论。

**请求体**: `{ blockId: string, text: string, selector?: TextQuoteSelector }`
**响应**: `{ ok: true, comment }` 或 `{ ok: false, error }`

注意：请求体用 `blockId`，store 内部映射为 `block_id`（anchor）。

### `PATCH /api/artifacts/:id/comments/:commentId`
更新评论状态。

**请求体**: `{ status: 'open' | 'resolved' }`
**响应**: `{ ok: true, comment }`

仅允许 `open` 和 `resolved` 两个状态值。

### `GET /api/artifacts/:id/feedback`
CLI 反馈接口。返回 open + orphaned 评论摘要。

### `POST /api/render/code`
服务端代码高亮。`runtime = 'nodejs'`。

**请求体**: `{ code: string, language?: string, theme?: string }`
**响应**: `{ ok: true, html }` — shiki 渲染的 HTML

支持语言别名映射（`js` → `javascript`, `sh` → `bash` 等）。

### `POST /api/render/diagram`
服务端图表渲染。`runtime = 'nodejs'`。

**请求体**: `{ engine: 'd2' | 'plantuml', code: string }`
**响应**: `{ ok: true, engine, svg }`

D2 使用 `@terrastruct/d2`，PlantUML 使用 `java -jar plantuml.jar -tsvg -pipe`。
SVG 输出经过 `sanitizeSvg()` 清理（去除 script、event handler、javascript: 协议）。

## 模式总结

```
请求 → parse body (try/catch) → store 函数 → 统一响应格式
                                    ↓
                              失败 → { ok: false, error, status }
                              成功 → { ok: true, data }
```

## 禁止模式

- ❌ 不要在 API route 中直接操作 SQLite（一律通过 `store.ts` 函数）
- ❌ 不要用 Next.js `NextResponse`（统一使用 `Response.json()`）
- ❌ 不要忘记 `await params`（Next.js 15 要求）
