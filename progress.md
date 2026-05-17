# RenderKit Progress

## 当前状态：HTML-first 生态完备

**日期**: 2026-05-18  
**主分支**: master (稳定) | develop (开发)  
**Worktree**: `/Users/xd/Worker/tools/RenderKit-dev`  
**Server**: `http://localhost:3737`（`pnpm dev` 或 `rk serve`）

---

## ✅ 已完成

### 核心系统
- [x] HTML-first 架构：Agent 写 HTML + `<rk-*>` WC，无 DSL 编译
- [x] 24 个 Web Components（Light DOM，69KB bundle）
- [x] Shiki 服务端代码高亮
- [x] linkedom anchor 注入（评论定位）
- [x] 飞书式评论面板（右侧，按文档位置排序）
- [x] Revisions API（`POST /api/artifacts/:id/revisions`）

### 图表生态（4 种引擎）
- [x] Mermaid（CDN 客户端，主题感知）
- [x] D2（WASM CDN 客户端）
- [x] Graphviz（Kroki SSR，@viz-js/viz）
- [x] PlantUML（Kroki SSR）
- [x] ECharts（JSON 多系列 + K/M 格式化）

### 设计系统
- [x] 8 套主题（paper-light / dark-pro / notion-clean / linear-app / amber-terminal / glassmorphism / ibm-enterprise / editorial-kami）
- [x] Inter + Noto Sans SC（Google Fonts）
- [x] `--rk-*` 语义 token 系统

### CLI
- [x] `rk push <file.html>` — 上传/更新 artifact
- [x] `rk feedback <file.html>` — 获取评论 JSON
- [x] `rk open <file.html>` — 浏览器打开
- [x] `rk status <file.html>` — 查看状态
- [x] `rk serve` — 启动本地 server

### 知识库
- [x] `.pi/skills/renderkit-author/SKILL.md`（Agent 使用手册）
- [x] `docs/design-system.md`（主题使用文档）
- [x] `docs/decisions.md`（ADR-01~09 技术决策记录）
- [x] Trellis 6 个任务全部 done

---

## 📦 关键文件

```
packages/
  cli/bin/renderkit.mjs          # CLI 入口
  components/src/bundle.ts       # 24 WC 注册
  components/src/elements/       # 各 WC 源码
  design/src/tokens.css          # token 系统
  design/src/themes.css          # 8 套主题

apps/web/
  lib/html-processor.ts          # Shiki + Kroki SSR + anchor 注入
  lib/store.ts                   # SQLite 数据层
  app/a/[id]/HtmlArtifactView.tsx # 飞书评论面板
  public/rk/components.js        # 构建产物（69KB ESM）

.pi/skills/renderkit-author/SKILL.md  # Agent 使用手册
docs/decisions.md                     # 技术决策 ADR
```

---

## 🔄 下一步可扩展方向

- `rk-kanban/rk-form` 数据提交后端集成
- beautiful-mermaid 主题感知集成
- D2 客户端稳定性验证
- ui-ux-pro-max-skill 推理规则强化 SKILL.md
