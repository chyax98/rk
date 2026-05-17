# Progress

## Status
In Progress

### Wave 1 — 核心重构（已完成 2026-05-17）
- packages/shared: TS + renderer schema + chart block type
- packages/dsl: compiler 拆分 16 个文件 + chart compiler
- packages/blocks: dispatch + table profiles + Shiki code + ChartBlock
- apps/web: ArtifactView 拆分 94 行 + ReviewPanel 三 tab + 4 个 P0 bug 修复
- packages/cli: 模块化 lib/ + sourceFile lock + DELETE API

### Wave 1.5 — Skill 文档更新
- skills/renderkit-authoring/SKILL.md: 追加 v2 新增章节（chart/code/table 新属性）

### Wave 2 — CSS + fixtures
- packages/design/src/blocks.css: table profiles + code frames + chart/KPI CSS
- apps/web/app/style.css: ReviewPanel tabs + comment status badge CSS
- examples/capabilities/chart-gallery.rk.md: chart block fixture
- examples/capabilities/table-profiles.rk.md: table profiles fixture
- examples/capabilities/code-presentation.rk.md: code block fixture

## Tasks
- [ ] Wave 3: strict TS per-package
- [ ] Wave 3: Mermaid SVG a11y
- [ ] Wave 3: 中文 UI 全量 pass
- [ ] Wave 3: skill 文档更新

## Notes
- verify:contracts 全绿 (72/72)
- 不跑测试 (用户机器扛不住)
- DSL package.json exports 已修正为 src/index.mjs
