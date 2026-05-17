# RenderKit Architecture

## 概览

RenderKit 是一个本地优先的 AI 文档渲染和评审系统。核心数据流：

```
.rk.md 文件 → CLI push → DSL 编译 → SQLite 存储 → Web 渲染 → 评论
```

## Monorepo 结构

```
packages/
  shared/     合约层 - 所有包共享的类型、常量、验证器
  dsl/        编译器 - .rk.md → RenderKitModel (JSON)
  blocks/     渲染层 - RenderKitBlock → React 组件
apps/
  web/        Next.js 15 前端 + API + SQLite 存储
packages/
  cli/        renderkit CLI (validate/push/status/feedback 等)
scripts/
  verify-contracts.ts  合约漂移守门员 (CI 唯一验证点)
```

## 核心包职责

### @renderkit/shared
- `contracts.ts` — BLOCK_TYPES, TABLE_PROFILES, RENDERER_SCHEMA 等常量
- `validateRenderKitModel()` — 运行时模型验证
- `validateTextQuoteSelector()` — 评论锚点验证
- **规则**: 其他包只能从 `@renderkit/shared/contracts` 导入，不能反向依赖

### @renderkit/dsl
- 入口: `parseRK(source: string): ParseResult`
- 16 个 block 编译器在 `src/compilers/` 各自一个文件
- 所有 block type 必须在 BLOCK_COMPILERS 中注册，且与 shared 的 BLOCK_TYPES 对齐

### @renderkit/blocks
- `RenderBlock` — 纯渲染组件，根据 block.type 分发
- `BlockFrame` — 带 data-block-id 的 section 包装
- 分发器模式：`createBlockDispatcher()` 支持同类型多变体（table profiles、code renderers）

### apps/web
- API routes: `/api/artifacts/[id]/*` — 全 TypeScript，返回 JSON
- Store: `lib/store.ts` — SQLite 操作，有完整 DB row 接口
- ArtifactView: **飞书文档模型** — 纯展示 + 右侧气泡评论

## ArtifactView 交互模型（飞书风格）

```
┌─────────────────────────────────────────┬────┐
│  block content (flex: 1)                │ 44 │  ← rk-block-row
│  ...                                    │ [1]│  ← amber bubble (有评论)
│  ...                                    │ [+]│  ← add button (hover 显示)
└─────────────────────────────────────────┴────┘
                                    ┌──────────────┐
                                    │ CommentThread│  ← fixed 右侧悬浮
                                    │ (300px)      │
                                    └──────────────┘
```

- 无 review mode 切换、无侧边栏 tabs、无 BlockInspector
- 点击气泡 → CommentThread 悬浮面板
- hover 块 → 显示 `+` 按钮，点击打开 CommentThread 并自动聚焦输入框

## DSL Block 类型

| 类型 | 说明 |
|---|---|
| heading / paragraph | 基础文本 |
| callout | 提示框（info/warning/danger/tip/note/success） |
| code | 代码块（shiki/hljs，支持 frame=editor/terminal） |
| table | 数据表（5 种 profile：matrix/status/key-value/cards/compact） |
| chart | 数据图表（bar/line/pie/kpi，ECharts） |
| diagram | 流程图（mermaid/d2/plantuml） |
| summary | 文章摘要卡片 |
| quote | 引语块 |
| stat | KPI 指标卡 |
| decision-card | 决策记录 |
| comparison | 方案对比 |
| checklist | 检查清单 |
| grid | 块级网格布局 |
| tabs | 标签页容器 |
| image | 图片 |
| timeline | 时间线 |

## 本地运行

```bash
pnpm dev          # Next.js dev server (apps/web)
pnpm renderkit validate examples/alpha-showcase.rk.md
pnpm renderkit push examples/alpha-showcase.rk.md --open
pnpm ci           # lint + verify:contracts
pnpm verify:contracts  # 合约漂移检查 (76 checks)
```

## 技术选型

| 问题 | 选择 | 原因 |
|---|---|---|
| TypeScript 运行 | Node 24 --experimental-strip-types | 无编译步骤，CLI 直跑 .ts |
| 代码高亮 | Shiki (server) / hljs (client fallback) | 服务端渲染，无 bundle 膨胀 |
| 图表 | ECharts | 支持丰富图表类型，无 license 问题 |
| 数据库 | SQLite (better-sqlite3) | 本地优先，零配置 |
| 样式 | 纯 CSS custom properties | 无 Tailwind/antd 依赖 |
| 表格 | 自定义 5 profile | TanStack Table 保留为 future opt-in |
