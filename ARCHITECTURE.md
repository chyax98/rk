# RenderKit Architecture

> HTML-first artifact renderer. Agent 写 HTML + `<rk-*>` WC → Server 注入 anchor →
> 浏览器渲染 → 人评论 → Agent 用 `rk reply/address` 闭环 → 迭代。

## 闭环（v2）

```
Agent                                       Human
  │                                           │
  │ rk push doc.html --author agent           │
  ├──────────────────────────────────────────►│
  │  HTML 注入 anchor + Shiki SSR + 存 SQLite │
  │                                           │
  │                                           │ 浏览器评论（飞书式右侧面板）
  │                                           │ POST /api/.../comments
  │                                           │   { anchor, text, author: 'human',
  │                                           │     selector: TextQuoteSelector }
  │                                           │
  │ rk feedback doc.html                      │
  │◄──────────────────────────────────────────┤
  │  comments[].waitingFor:                   │
  │    'agent' = 需处理                       │
  │    'human' = agent 已回复，等验收         │
  │                                           │
  │ rk reply  doc.html cmt_x "已修复"         │
  │ rk address doc.html cmt_x                 │
  ├──────────────────────────────────────────►│
  │                                           │  人确认 → resolve
  │ rk push doc.html --author agent           │
  ├──────────────────────────────────────────►│
  │  pushHTML 检测到 anchor 变动              │
  │  → 三策略 rebind 评论：                   │
  │    1. exact textPreview 命中              │
  │    2. normalized 命中（去大小写/标点）    │
  │    3. prefix/suffix 评分消歧              │
  │    4. 失败 → orphaned                     │
  │  保留 rebound_at 时间戳                   │
```

## 系统层

```
CLI (packages/cli)
  bin/renderkit.mjs        commander，10+ 命令
  src/utils.mjs            endpoint / lock / output / paths
  └─ env: RENDERKIT_ENDPOINT (default http://localhost:3737)
  └─ 锁文件: <file_dir>/.rk-lock/<basename>.json
       记录 { artifactId, endpoint, lockedAt }
        ↓ HTTP
Server (apps/web — Next.js 16, Turbopack)
  app/api/...              POST/GET/PATCH/DELETE 各 route
  lib/html-processor.ts    linkedom: 注入 [data-rk-anchor]
                           generateAnchorId + 重复时 -2/-3 dedup
                           Shiki SSR (rk-code)
                           Kroki SSR (PlantUML/Graphviz)
  lib/store.ts             pushHTML / addComment / getFeedback ...
                           anchor rebind 三策略
                           getFeedback thread 折叠 + waitingFor
  lib/db.ts                better-sqlite3 schema
                           env: RENDERKIT_DATA_DIR
                           default: ~/.renderkit/data/renderkit.db
  app/a/[id]/HtmlArtifactView.tsx
                           飞书式右侧 panel，按 anchor y 排序
                           创建评论时 buildSelector 抓 TextQuoteSelector
        ↓ HTML
Browser
  /rk/components.js        18 KB ESM bundle，24 个 <rk-*> Light DOM WC
  /rk/components.css       全局组件样式（design 包导出）
  Mermaid / D2 / ECharts / Three.js   全部 CDN 动态加载
```

## 包结构

| 包 | 职责 | publishable? |
|---|---|---|
| `apps/web` | Next.js server: API + UI（artifact 视图 + 评论面板） | private |
| `packages/cli` | CLI: push/feedback/reply/address/resolve/reopen/... | private (本地自用) |
| `packages/components` | 24 个 `<rk-*>` Web Components（Light DOM） | private |
| `packages/design` | CSS tokens + 主题 + 8 套预设 | private |

## 数据库 schema（v2，无 migration）

```
artifacts        (id, title, current_revision, is_test, deleted_at, created_at, updated_at)
revisions        (id, artifact_id, revision, html, anchors_json, created_at)
comments         (id, artifact_id, anchor, text, author, status,
                  parent_id, selector,
                  created_at, created_at_revision, rebound_at,
                  addressed_at, addressed_by,
                  resolved_at, resolved_by)
form_submissions (id, artifact_id, form_id, payload_json, created_at)
render_errors    (id, artifact_id, component, message, created_at)
```

字段语义：
- `author`: `'human'` | `'agent'`
- `status`: `'open'` | `'addressed'` | `'resolved'` | `'orphaned'`
- `parent_id`: NULL 是 root，非 NULL 是 reply
- `selector`: TextQuoteSelector JSON，rebind 用
- `rebound_at`: 上次 fuzzy rebind 的时间（UI 不展示）

## Web Components（24 个）

**内容**: rk-callout · rk-code · rk-quote · rk-highlight · rk-summary · rk-collapsible
**数据**: rk-metric · rk-stat · rk-chart · rk-progress
**图表**: rk-diagram（Mermaid/D2/Graphviz/PlantUML）
**布局**: rk-grid · rk-tabs · rk-table · rk-section · rk-card
**交互**: rk-checklist · rk-steps · rk-timeline · rk-decision · rk-comparison · rk-form · rk-kanban
**媒体**: rk-image · rk-3d · rk-globe · rk-map
**标记**: rk-badge · rk-badge-group · rk-diff

## CSS 组织（v2 拆分）

```
apps/web/app/style.css      18 行：纯 import 入口
apps/web/app/style/
  base.css         1496 行  reset + .rk-html-body typography
  list.css          724 行  studio shell + topbar + sidebar + cards + toast
  doc-app.css       687 行  artifact view + gutter + thread panel + rev menu
  compare.css        66 行  并排 diff（含 grid+flex min-height:0 修复）
  deleted-state.css  33 行  软删占位

packages/design/src/
  index.css         入口
  tokens.css        CSS 变量
  themes/*.css      8 套主题
  surfaces.css      表面层（卡片/分隔）
  blocks.css        块级布局原语
  chrome.css        ⚠ DEPRECATED — 与 apps/web app shell 撞名空间
```

## 开发约定

- 主分支 `master`；并发开发用 worktree 或 subagent
- 跳 pre-commit: `LEFTHOOK=0 git commit ...`
- WC bundle 重建：`node packages/components/build.mjs`
- 全 import 路径必须有 `.ts` 后缀（Node strip-types）
- 测试：`pnpm test`（79 cases）

## Trellis 留痕

每次大改动一份 `.trellis/spec/journal-*.md`：
- session #1 — v2 foundation（schema 重写 + PRD）
- session #2 — v2 闭环可用化（5-worker 并发）
