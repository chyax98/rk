# RenderKit Architecture

> HTML-first artifact renderer. Agent writes HTML, server injects anchors, browser renders Web Components.

## 系统总览

```
┌─────────────────────────────────────────────────────────┐
│                    Agent / Human                        │
│  writes artifact.html with <rk-*> components           │
└──────────────────┬──────────────────────────────────────┘
                   │ renderkit push artifact.html
                   ▼
┌─────────────────────────────────────────────────────────┐
│                CLI (packages/cli)                       │
│  POST /api/artifacts { html, file }                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              Server (apps/web)                          │
│  1. linkedom 解析 HTML                                  │
│  2. 注入 data-rk-anchor（每个顶层元素）                  │
│  3. Shiki 预渲染 <rk-code>                              │
│  4. 存入 SQLite（artifacts + revisions + anchors）      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              Browser (HtmlArtifactView)                 │
│  1. dangerouslySetInnerHTML 渲染 processedHtml          │
│  2. <script> 注册 21 个 Web Components                  │
│  3. 右侧气泡 rail（绝对定位跟随 block）                  │
│  4. 点击气泡 → CommentPanel（固定右侧面板）              │
└─────────────────────────────────────────────────────────┘
```

## 包结构

```
RenderKit/
├── apps/web/                    # Next.js 应用
│   ├── app/
│   │   ├── a/[id]/              # Artifact 查看页
│   │   │   ├── page.tsx         # Server Component，读 DB
│   │   │   └── HtmlArtifactView.tsx  # Client Component，评论交互
│   │   └── api/artifacts/       # REST API
│   ├── lib/
│   │   ├── db.ts                # SQLite schema + migration
│   │   ├── store.ts             # pushHTML, getHtmlArtifact, addComment
│   │   └── html-processor.ts   # linkedom anchor 注入 + Shiki 预渲染
│   └── public/rk/              # Web Components bundle
│       ├── components.js        # 21 个 WC（esbuild ESM bundle）
│       ├── components.css       # BEM 样式
│       └── theme.css            # CSS custom properties
├── packages/
│   ├── cli/                     # renderkit CLI
│   │   └── bin/renderkit.mjs   # push/feedback/patch/append/components
│   └── components/              # Web Components 源码
│       └── src/elements/        # 21 个 .ts 文件
└── docs/architecture/
    └── html-wc-plan.md         # HTML+WC 改造方案（已验证）
```

## DB Schema

```sql
artifacts   -- id, title, format='html', current_revision
revisions   -- id, artifact_id, number, html_source, processed_html
anchors     -- id, revision_id, artifact_id, anchor, element_tag, position
comments    -- id, artifact_id, block_id(=anchor), text, status, selector
```

## Web Components 设计原则

1. **Light DOM**（无 shadow DOM）— Selection API 兼容，评论可精准定位
2. **connectedCallback 一次性**（`_rendered` flag）— 避免重复渲染
3. **DOM Move 替代 innerHTML 序列化**（rk-grid）— 避免子 WC 重复升级
4. **CSS custom properties**（`var(--rk-*)`）— Agent 可用 `<style>` 覆盖主题
5. **CDN 动态 import**（echarts、mermaid、three.js）— 减小 bundle，按需加载

## 评论系统

- **anchor 注入**：Server 给每个顶层元素注入 `data-rk-anchor`
- **气泡定位**：`getBoundingClientRect() + scrollY` 动态跟随元素
- **面板**：固定右侧 320px 抽屉，Cmd+Enter 提交
- **存储**：`comments.block_id` 存 anchor 值
- **孤儿检测**：新 revision push 时 diff anchor 列表，消失的 anchor 对应评论标为 orphaned

## CLI 命令

| 命令 | 说明 |
|---|---|
| `push <file.html> [--open]` | 推送/更新 artifact |
| `feedback <file.html> [--json]` | 拉取评论 |
| `patch <file.html> --anchor <id> --fragment <f.html>` | 增量更新 section |
| `append <file.html> --fragment <f.html>` | 追加 section |
| `anchors <file.html> [--json]` | 列出所有 anchor |
| `components [--json]` | 列出可用组件 |
| `server [--port]` | 启动本地 server |
