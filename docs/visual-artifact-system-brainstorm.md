# RenderKit Visual Artifact System Brainstorm

状态：规划草案，不是实现方案  
日期：2026-05-16

目标：在动手改 UI/design/block 之前，先明确 RenderKit 应该吸收哪些项目的思想、下一阶段要做哪些能力、这些能力落到哪些模块。

---

## 1. 北极星

RenderKit 不是 Markdown Preview。

RenderKit 是本地 Agent artifact renderer：

```text
Agent 写 .rk.md
→ RenderKit 编译成 typed blocks
→ Browser 渲染成高密度 artifact
→ 人在 block 上评论
→ Agent 拉 feedback 改源文件
```

所以视觉目标不是“文章好看一点”，而是：

- artifact 有明确 surface：方案、报告、决策、runbook、review brief、data report。
- block 是产品组件，不是 Markdown 标签。
- 页面有 review chrome：block id、评论、revision、source excerpt。
- 设计系统可切换，Agent 可稳定生成，不靠临场审美。

---

## 2. 参考项目与可吸收点

### 2.1 Open Design

来源：
- https://github.com/nexu-io/open-design
- https://github.com/nexu-io/open-design/blob/main/design-systems/README.md

关键事实：
- local-first Claude Design alternative。
- 由 skills + design systems 驱动。
- design systems 是独立文件夹，每个包含 `DESIGN.md`。
- picker 中选择 design system 后，每个 skill 都会读取它。
- design systems 包含 9-section schema：视觉主题、排版、布局、组件、motion、voice、brand、anti-patterns 等。
- 内置 product systems / design skills，且强调 inspiration，不是官方品牌资产。
- 有 5 个 visual directions：Editorial Monocle、Modern Minimal、Warm Soft、Tech Utility、Brutalist Experimental。
- 有 sandboxed preview、live todo、artifact-first mental model。

RenderKit 吸收：
- `theme/design-system` 不是几组颜色，而是 artifact 风格协议。
- 内置少量高质量 design presets，而不是一开始复制 70 个品牌。
- 每个 preset 应有：color、type、spacing、surface、block treatment、tone、anti-patterns。
- UI 需要一个 visible theme/design-system switch。

不吸收：
- 不做 agent daemon / PATH scan。
- 不做 media generation。
- 不做 Electron / Vercel / SQLite。
- 不复制品牌系统资产或模板。

### 2.2 html-anything

来源：
- https://github.com/nexu-io/html-anything

关键事实：
- 口号：Markdown is the draft. HTML is what humans read.
- 75 skill templates × 9 surface modes。
- surface 包括 magazine、deck、resume、poster、XHS/tweet、prototype、data report、Hyperframes。
- featured skills 包括：
  - magazine/e-ink editorial deck
  - Swiss International deck
  - warm-parchment editorial doc
  - newsprint poster
  - data report / dashboard / office docs
- 每个 skill 是 folder + `SKILL.md` frontmatter：mode / scenario / surface / preview / design_system。

RenderKit 吸收：
- artifact 应按 surface 组织，而不是只按 theme。
- 对 RenderKit 初期最有价值 surface：
  1. engineering-plan
  2. decision-brief
  3. review-report
  4. data-report-lite
  5. runbook
- 示例文档应该展示 surface 质量，而不只是 block 功能。
- 可以做 `examples/alpha-showcase.rk.md`，模拟高质量 agent artifact。

不吸收：
- 不生成任意 HTML。
- 不做导出 WeChat/X/Zhihu/PNG。
- 不做 75 skill catalog。
- 不做视频/Hyperframes。

### 2.3 Markdoc

来源：
- https://markdoc.dev/docs/tags
- https://markdoc.dev/docs/validation

关键事实：
- custom tags 映射到 React components。
- tag attributes 有 schema/type/default/matches。
- validation 会检查 tag/function/attribute。

RenderKit 吸收：
- block schema registry：每个 block 有 attrs/body/schema/compile/render。
- Agent 错误必须可修复：错误 code、line、message。

不吸收：
- 不引入完整 Markdoc syntax/runtime。
- 不加条件渲染/变量/partial。

### 2.4 MyST Markdown

来源：
- https://mystmd.org/guide/directives
- https://mystmd.org/guide/dropdowns-cards-and-tabs
- https://mystmd.org/guide/admonitions

关键事实：
- directives 是 block-level extension points。
- 用于 callout/admonition、tabs、cards、grids、figures、embedded charts。

RenderKit 吸收：
- `.rk.md` 继续用 directive block。
- block catalog 可从 MyST 的 docs patterns 吸收：callout、cards、tabs/dropdown、figure/table。

不吸收：
- 不做学术出版 / Sphinx / roles / cross-ref 全套。

### 2.5 Portable Text

来源：
- https://www.portabletext.org/specification
- https://github.com/portabletext/portabletext

关键事实：
- JSON array of typed blocks。
- block/spans 用 type/key 支撑 serializer。
- stable keys 让系统不依赖 array position。

RenderKit 吸收：
- 编译后 model 是 portable artifact contract。
- block id 是评论锚点，不能轻易漂移。
- 长期应减少 auto id 的风险。

不吸收：
- 不做 rich text editor。
- 不做 inline collaborative editing。

### 2.6 Observable Framework / Evidence.dev

来源：
- https://observablehq.com/framework/
- https://docs.evidence.dev/

关键事实：
- Observable Framework：Markdown + code 生成 data apps、dashboards、reports。
- Evidence：SQL + Markdown 生成 polished reports/data products。

RenderKit 吸收：
- `data-report-lite` surface：metric cards、tables、small charts、narrative sections。
- 先做静态表格/metrics，不做 SQL runtime。

不吸收：
- 不做数据源、SQL execution、DuckDB、复杂 chart runtime。

### 2.7 Radix Themes / Open Props

来源：
- https://www.radix-ui.com/themes/docs/theme/color
- https://open-props.style/

关键事实：
- Radix 用 12-step color scales、semantic tokens、light/dark modes。
- Open Props 是 CSS variables token library。

RenderKit 吸收：
- token 要 semantic，不要 `blue-500` 到处用。
- theme 应覆盖 bg/surface/text/border/accent/tone/focus。
- token surface 小而稳定，不引入巨大 UI framework。

不吸收：
- 不整套 Radix Themes。
- 不引入数百个 Open Props vars。

---

## 3. 下一阶段能力地图

### Capability A: Design Presets / Artifact Themes

系统新增：RenderKit 有一组内置 artifact visual systems。

初期 presets：

1. `dark-pro`
   - 默认工程/决策 artifact。
   - 深色、高对比、卡片化、dense。

2. `paper-light`
   - 适合长方案/报告。
   - 类纸面、低刺激、适合截图。

3. `amber-terminal`
   - 适配用户 amber/yellow terminal aesthetic。
   - 避免黑底黑字/低对比。

4. `editorial-kami`（可选）
   - 借鉴 html-anything warm-parchment / kami 思路。
   - 长文和 one-pager 更有出版感。

5. `tech-utility`（可选）
   - 借鉴 Open Design visual direction。
   - dashboard/runbook/data-report 更合适。

### Capability B: Artifact Surfaces

系统新增：artifact 不只是 document，而有 surface intent。

初期 surface：

1. `engineering-plan`
2. `decision-brief`
3. `review-report`
4. `runbook`
5. `data-report-lite`

来源：frontmatter：

```yaml
---
title: Auth Refactor Plan
surface: engineering-plan
theme: dark-pro
---
```

Alpha 可以只影响 layout/theme hints，不做复杂 routing。

### Capability C: Block System

系统新增：block registry + block components，不再把所有 renderer 堆在 `ArtifactView.jsx`。

核心 block：

- heading
- paragraph
- summary
- callout
- decision-card
- code
- table
- diagram
- checklist（可选）
- timeline（可选）

每个 block 有：

- schema
- compile
- render
- style class
- error fallback
- sourceRange/sourceExcerpt

### Capability D: Review Chrome

系统新增：artifact 页面围绕评论/feedback 优化。

应有：

- topbar：title / revision / theme / status
- block frame：id/type/comment count/hover button
- right rail：comments by selected block / all comments
- source affordance：source excerpt / line range
- orphaned/resolved states

### Capability E: Showcase Document

系统新增：一份能演示产品感的 `.rk.md`。

```text
examples/alpha-showcase.rk.md
```

必须覆盖：

- surface + theme frontmatter
- summary
- callout
- decision-card
- table
- code
- Mermaid diagram
- comments flow

目标：一 push 就能看出 RenderKit 不是 Markdown preview。

---

## 4. 模块落点

### packages/design

职责：RenderKit visual language。

目标结构：

```text
packages/design/src/
├── index.css
├── tokens.css
├── themes.css
├── surfaces.css
├── blocks.css
└── README.md
```

内容：

- semantic tokens
- tone tokens
- status tokens
- theme presets
- surface layout tokens
- block CSS

不做：React components。

### packages/blocks

职责：React block renderer。

目标结构：

```text
packages/blocks/src/
├── index.jsx
├── registry.jsx
├── BlockFrame.jsx
├── RenderBlock.jsx
└── blocks/
    ├── HeadingBlock.jsx
    ├── ParagraphBlock.jsx
    ├── SummaryBlock.jsx
    ├── CalloutBlock.jsx
    ├── DecisionCardBlock.jsx
    ├── CodeBlock.jsx
    ├── TableBlock.jsx
    └── DiagramBlock.jsx
```

内容：

- block registry
- per-block error isolation
- comment count/selected state hooks from props
- data attrs：`data-block-id` / `data-block-type`

不做：storage/api/comment mutation。

### packages/dsl

职责：`.rk.md` → artifact model。

下一步：

- block schema registry
- compile summary/code/table
- frontmatter surface/theme
- line-aware validation
- keep unknown directive fail

不做：render logic。

### apps/web

职责：local artifact app + review UI。

下一步：

- import `@renderkit/design/index.css`
- use `@renderkit/blocks`
- app shell/topbar/right rail
- theme selection from artifact model/frontmatter
- comments UX polish

不做：block internals。

### packages/shared

职责：shared contracts。

下一步：

- constants：version/default port
- maybe artifact/comment shape constants
- avoid overbuilding types until TS migration

### examples

职责：demo + regression fixtures。

下一步：

- `examples/alpha-showcase.rk.md`
- keep invalid fixtures for validation

---

## 5. 推荐实施 loop

### Loop 0: Reference digestion

输出：

- 本文档定稿
- 选 3 个 design directions
- 明确不复制资产，只复制结构思想

### Loop 1: Visual shell tracer bullet

目标：不扩 DSL 太多，先让现有 artifact 页面变像样。

包含：

- `packages/design/index.css`
- 3 themes
- Web topbar/right rail polish
- current blocks tokenized styling
- no block extraction yet if太慢

验收：`examples/plan.rk.md` 视觉明显提升。

### Loop 2: Block system extraction

目标：renderer 从 app 抽到 `packages/blocks`。

包含：

- BlockFrame
- RenderBlock registry
- existing 5 blocks migrated
- per-block error fallback

验收：功能不回退，build 通过。

### Loop 3: Showcase block catalog

目标：补能演示 artifact 的 block。

包含：

- summary
- code
- table
- alpha-showcase.rk.md

验收：showcase 页面能代表产品方向。

### Loop 4: Review UX

目标：评论/feedback 变好用。

包含：

- selected block panel
- comments grouped by block
- source excerpt display
- orphaned/resolved styling

验收：人工 review 流程顺。

---

## 6. 暂不做

- npm package/global install
- Open Design daemon
- arbitrary HTML generation
- export to WeChat/X/Zhihu/PNG
- SQLite
- auth/multi-user
- SQL/data runtime
- D2/PlantUML/ECharts/AntV
- 70 brand systems
- 75 skill templates

---

## 7. 下一个可执行大 issue

标题：Build RenderKit Visual Shell

目标：吸收 Open Design/html-anything 的 artifact-first 思路，让现有 artifact 页面具备主题、surface、topbar/right rail、tokenized block style，不再像临时 Markdown preview。

范围：

- `packages/design` 真正落地
- `apps/web` 接入 design css
- 当前 block 视觉 token 化
- topbar/right rail polish
- 支持 `theme` / `surface` frontmatter 的最小使用
- 不抽 `packages/blocks`，除非自然需要

验收：

- `pnpm --filter @renderkit/web build` 通过
- `examples/plan.rk.md` push 后页面视觉明显提升
- `dark-pro / paper-light / amber-terminal` 可用
- block 不直接硬编码主色值，主要走 `--rk-*`
- comment affordance 清晰
- 不破坏 feedback/status/push

风险：

- 设计 token 过度设计。
- 一次性抽 blocks + 重做 UI 容易太大。
- 需要先视觉 shell，再 block extraction。
