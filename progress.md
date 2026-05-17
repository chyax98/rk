# RenderKit Progress

## 当前状态：rk-form API + Home 页面完成

**日期**: 2026-05-18
**主分支**: master (稳定)
**评分**: 96/100 (A 级 — 优秀)
**测试**: 61 个单元测试全部通过 (html-processor: 17, wc-render: 35, cli: 9)

---

## ✅ 已完成

### 核心系统
- [x] HTML-first 架构：Agent 写 HTML + `<rk-*>` WC，无 DSL 编译
- [x] 24 个 Web Components（Light DOM，69KB bundle）
- [x] Shiki 服务端代码高亮
- [x] linkedom anchor 注入（评论定位）
- [x] 飞书式评论面板（hover + 按钮，真实布局顶开）
- [x] Revisions API（`POST /api/artifacts/:id/revisions`）
- [x] Hydration 修复（extractBodyContent 剥离完整 HTML 包装）
- [x] 浮动评论按钮（JS getBoundingClientRect 定位）
- [x] rk-form 提交 API（`POST /api/artifacts/:id/submissions`）
- [x] form_submissions 数据库表 + store 函数
- [x] rk-form WC 自动检测 artifactId → fetch POST
- [x] HtmlArtifactView 注入 `data-rk-artifact-id` 供 rk-form 使用
- [x] Home 页面重设计（Logo + 统计 + 卡片网格 + 空状态）
- [x] `examples/gallery.json` 创建（3 个 surface）
- [x] 版本历史 API + UI（`GET /api/artifacts/:id/revisions/list`）

### 图表生态（4 种引擎）
- [x] Mermaid（CDN 客户端，主题感知 dark/default）
- [x] D2（WASM CDN 客户端）
- [x] Graphviz（Kroki SSR + @viz-js/viz 客户端 fallback）
- [x] PlantUML（Kroki SSR）
- [x] ECharts（JSON 多系列 + K/M 格式化）

### 设计系统
- [x] 8 套主题（paper-light / dark-pro / notion-clean / linear-app / amber-terminal / glassmorphism / ibm-enterprise / editorial-kami）
- [x] 132 个 CSS token
- [x] Inter + Noto Sans SC + JetBrains Mono（Google Fonts）
- [x] `--rk-*` 语义 token 系统
- [x] 打印样式（@media print）

### CLI
- [x] `rk push <file.html>` — 上传/更新 artifact
- [x] `rk feedback <file.html>` — 获取评论 JSON（含 form submissions）
- [x] `rk open <file.html>` — 浏览器打开
- [x] `rk status <file.html>` — 查看状态
- [x] `rk serve` — 启动本地 server

### 测试套件
- [x] `tests/html-processor.test.ts` — 17 个测试（extractBodyContent, anchor, title, security, Kroki SSR）
- [x] `tests/wc-render.test.ts` — 35 个测试（24 WC 属性 + 结构验证）
- [x] `tests/cli.test.ts` — 9 个测试（push/feedback/status + 错误处理）
- [x] `examples/test-all-wc.html` — 全 24 WC × 多变体
- [x] `examples/test-diagrams.html` — Mermaid/D2/Graphviz/PlantUML 全覆盖
- [x] `examples/test-themes.html` — 8 主题对比
- [x] `scripts/score.ts` — 5 维度评分系统（94/100）

### 知识库
- [x] `.pi/skills/renderkit-author/SKILL.md`（Agent 使用手册）
- [x] `docs/design-system.md`（主题使用文档）
- [x] `docs/decisions.md`（ADR-01~09 技术决策记录）
- [x] Trellis 6 个任务全部 done

---

## 📊 评分报告（96/100）

| 维度 | 得分 | 状态 |
|------|------|------|
| 渲染质量 | 20/20 | ✅ 24 WC, 4 图表引擎, ECharts, Kroki SSR |
| 设计系统 | 20/20 | ✅ 8 主题, 132 token, Google Fonts |
| CLI 成熟度 | 18/20 | ✅ 5 命令, 错误处理, JSON/MD 输出, form submissions |
| 测试覆盖 | 20/20 | ✅ 3 测试文件, 3 测试 HTML, 评分系统 |
| 生产就绪 | 18/20 | ✅ a11y, hydration fix, ADR, home page, form API |

---

## 📦 关键文件

```
packages/
  cli/bin/renderkit.mjs          # CLI 入口
  components/src/bundle.ts       # 24 WC 注册
  components/src/elements/       # 各 WC 源码
  design/src/tokens.css          # 132 token
  design/src/themes.css          # 8 套主题

apps/web/
  lib/html-processor.ts          # Shiki + Kroki SSR + anchor 注入
  lib/store.ts                   # SQLite 数据层（含 form submissions）
  app/a/[id]/HtmlArtifactView.tsx # 飞书评论面板 + 版本历史
  app/api/artifacts/[id]/submissions/route.ts  # rk-form 提交 API
  app/style.css                  # 评论面板 + 布局 + Home 样式
  app/page.tsx                   # Home 页（重设计）
  public/rk/components.js        # 构建产物（74KB ESM）

tests/
  html-processor.test.ts         # 17 tests
  wc-render.test.ts              # 35 tests
  cli.test.ts                    # 9 tests

examples/
  test-all-wc.html               # 全 WC 测试
  test-diagrams.html             # 图表引擎测试
  test-themes.html               # 主题对比
  gallery.json                   # Gallery 数据

scripts/score.ts                 # 评分系统
.pi/skills/renderkit-author/SKILL.md  # Agent 使用手册
docs/decisions.md                     # 技术决策 ADR
```

---

## 🔄 下一步

- 评论面板 UX 重设计（不压缩文档宽度 — overlay 模式）
- 评论编辑/删除功能
- md2html TOC 侧边栏模式
- rk-form 字段类型扩展（date, file）
- SKILL.md 扩展 + CLI 命令增强
- 评分从 96 → 99+

---

## 2026-05-18 — 任务 C：版本历史 UI + Print CSS

- [x] `apps/web/lib/store.ts` 增加 `RevisionSummary`、`listRevisions()`、`getRevision()`。
- [x] 新增 `GET /api/artifacts/:id/revisions/list`，返回按版本倒序排列的历史版本摘要。
- [x] 新增 `GET /api/artifacts/:id/revisions/:rev`，返回指定版本的 `processedHtml`。
- [x] `HtmlArtifactView.tsx` 增加版本历史入口、版本面板、历史版本预览状态。
- [x] 查看历史版本时禁用新评论浮动 `+`，避免评论写到非当前版本。
- [x] `style.css` 增加版本历史浮层样式和 print CSS 增强。

注意：当前 revision schema 实际字段名是 `number` / `created_at`，实现已按真实 DB schema 适配，而不是使用过时的 `revision_number` 字段名。
