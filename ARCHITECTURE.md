# RenderKit Architecture

> HTML-first artifact renderer. Agent 写 HTML + `<rk-*>` WC → Server 注入 anchor → 浏览器渲染 → 人评论 → Agent 迭代。

## 系统总览

```
Agent
  ↓  写 HTML + <rk-*> 组件
  rk push artifact.html
  ↓
CLI (packages/cli)
  POST /api/artifacts { html }
  ↓
Server (apps/web — Next.js)
  html-processor.ts:
    • Shiki 代码高亮（SSR）
    • Kroki SSR（PlantUML / Graphviz → inline SVG）
    • linkedom anchor 注入（评论定位点）
  存入 SQLite（better-sqlite3）
  ↓
Browser
  加载 /rk/components.js（69KB ESM，24 个 WC）
  加载 /rk/components.css
  data-rk-theme="xxx" 触发设计系统主题
  Mermaid / D2 CDN 客户端渲染
  ↓
Human
  飞书式评论面板（右侧，按 anchor 位置排序）
  点击评论卡片 → 滚动到对应段落
  ↓
  rk feedback artifact.html → JSON 评论给 Agent
  ↓
Agent 根据评论修改 HTML，再次 rk push（循环）
```

## 包结构

| 包 | 职责 |
|---|---|
| `packages/cli` | CLI 工具（push/feedback/open/status/serve）|
| `packages/components` | 24 个 `<rk-*>` Web Components（Light DOM）|
| `packages/design` | CSS token 系统 + 8 套主题 |
| `apps/web` | Next.js 服务端（API + 评论面板 UI）|

## Web Components（24 个）

**内容组件**: rk-callout, rk-code, rk-quote, rk-highlight, rk-summary, rk-collapsible

**数据可视化**: rk-metric, rk-stat, rk-chart（ECharts）, rk-progress

**图表**: rk-diagram（Mermaid/D2/Graphviz/PlantUML）

**布局**: rk-grid, rk-tabs, rk-table

**交互**: rk-checklist, rk-steps, rk-timeline, rk-decision, rk-comparison

**媒体**: rk-image, rk-3d（Three.js）

**新增**: rk-badge, rk-badge-group, rk-kanban, rk-form, rk-card, rk-section, rk-diff

## 关键设计决策

见 `docs/decisions.md`（ADR-01~09）。

## 开发约定

- 所有新功能在 `develop` 分支（worktree: `../RenderKit-dev`）开发
- 用 `LEFTHOOK=0 git commit` 跳过 pre-commit hook
- bundle 重建：`npx esbuild packages/components/src/bundle.ts --bundle --format=esm --outfile=apps/web/public/rk/components.js --resolve-extensions=.ts,.tsx,.js --loader:.ts=ts --platform=browser`
- 所有 import 路径加 `.ts` 后缀（Node strip-types 要求）
