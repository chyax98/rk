# 架构概览

## 核心架构：服务端/客户端分离

项目严格遵循 Next.js App Router 的服务端/客户端边界。

### 服务端（React Server Components）

所有数据获取在服务端完成，直接调用 `lib/store.ts` 的同步 SQLite 函数：

- `app/page.tsx` — 首页，`listArtifacts()` 渲染 artifact 列表
- `app/a/[id]/page.tsx` — 详情页，`getHtmlArtifact()` 获取完整 bundle，传给客户端组件
- `app/gallery/page.tsx` — 直接 `fs.readFileSync` 读 `examples/gallery.json`

服务端组件**不使用** `'use client'`，直接 import store 函数。

### 客户端（`'use client'` 组件）

两大客户端视图，对应两种 artifact 格式：

1. **`ArtifactView.tsx`** — 旧格式（rkmd block model），接收 `model.blocks`，用 `BlockFrame` 渲染
2. **`HtmlArtifactView.tsx`** — HTML 格式（当前主力），接收 `HtmlArtifactBundle`，`dangerouslySetInnerHTML` 渲染处理后的 HTML

客户端组件通过 `fetch('/api/...')` 与后端交互（评论 CRUD）。

## 数据流

```
CLI push → POST /api/artifacts { html }
                ↓
          store.pushHTML(rawHtml)
                ↓
          html-processor.processHTML()
          ├─ linkedom 解析 DOM
          ├─ shiki 代码高亮（best-effort）
          ├─ 遍历顶层元素，生成 data-rk-anchor
          └─ 返回 { processedHtml, anchors, title }
                ↓
          SQLite 写入 artifacts + revisions + anchors
          anchor-diff → 标记 orphaned comments
                ↓
          返回 { artifactId, revision, url }

浏览器访问 → GET /a/:id
                ↓
          page.tsx (RSC) → getHtmlArtifact(id)
                ↓
          HtmlArtifactView (client) 接收 bundle
                ↓
          用户评论 → POST /api/artifacts/:id/comments
```

## HTML 处理管线

`lib/html-processor.ts` 的 `processHTML()` 是核心：

1. **linkedom 解析**: `parseHTML()` 构造服务端 DOM
2. **代码高亮**: shiki 双主题（github-dark / github-light），best-effort 失败不阻塞
3. **Anchor 生成**: 遍历 `<body>` 顶层子元素，匹配 `TOP_LEVEL_TAGS` 白名单，为每个块生成 `data-rk-anchor` 属性
4. **序列化**: `body.innerHTML` 输出处理后的 HTML

## 评论系统

### 数据模型

- **Comment** 通过 `block_id`（anchor）关联文档位置
- **TextQuoteSelector**（W3C 标准）：`{ exact, prefix, suffix }` 精确定位文本
- 三态：`open` → `resolved` / `orphaned`

### 版本间 Anchor Diff

`pushHTML()` 时执行 anchor diff：
- 新 anchor 不影响已有评论
- 被删除的 anchor → 关联的 open 评论自动标记 `orphaned`
- 实现：`anchor-diff.ts` 的 `diffAnchors()` 简单 Set 对比

## 关键文件

| 文件 | 职责 |
|------|------|
| `lib/db.ts` | SQLite 初始化、schema migration、单例连接 |
| `lib/store.ts` | 全部 CRUD：artifact/revision/anchor/comment |
| `lib/html-processor.ts` | HTML → anchor 标注 + 代码高亮 |
| `lib/anchor-diff.ts` | 版本间 anchor 集合对比 |
| `app/a/[id]/page.tsx` | 详情页入口（RSC） |
| `app/a/[id]/HtmlArtifactView.tsx` | HTML artifact 客户端视图 |
| `app/a/[id]/ArtifactView.tsx` | 旧格式 block artifact 客户端视图 |
