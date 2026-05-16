# RenderKit Visual Artifact System PRD

状态：草案，可评审、可继续拆解  
日期：2026-05-16  
关联文档：
- `docs/decisions.md`
- `docs/alpha-0.0.2-plan.md`
- `docs/visual-artifact-system-brainstorm.md`

---

## 问题陈述

当前 RenderKit 已经跑通本地核心链路：

```text
Agent 写 .rk.md
→ CLI validate/push
→ Web 渲染 artifact
→ 人在 block 上评论
→ CLI feedback 返回评论与 sourceRange
→ Agent 修改 .rk.md 再 push
```

但当前系统仍只是“能跑的骨架”，还没有成为真正的 Agent artifact 产品：

- Web 页面视觉仍偏临时 demo，不像可日常使用的 artifact renderer。
- `packages/design` 只有 token stub，没有真正设计系统。
- `packages/blocks` 仍是空壳，block renderer 没形成可扩展组件体系。
- `.rk.md` 虽然不是普通 Markdown，但 Agent 还缺少明确 authoring skill，不知道如何稳定写出高质量 RenderKit 文档。
- 还没有 surface/template 概念，Agent 只能写“文档”，不能按 engineering plan、decision brief、review report、runbook、data report 等目标产物来组织。
- 当前示例 `examples/plan.rk.md` 能验证链路，但不能展示“高密度、可评论、可审阅、视觉有设计感”的 artifact 价值。

用户期望 RenderKit 吸收 Open Design / html-anything 这类项目的成熟思路：

- Open Design 的 design systems、visual directions、artifact-first loop。
- html-anything 的 surface/template 思路：Markdown 是草稿，HTML/browser artifact 才是给人看的最终形态。
- Markdoc/MyST 的 schema/directive 思路。
- Portable Text 的 typed block/stable key 思路。
- Radix/Open Props 的 semantic token 思路。

结论：RenderKit 下一阶段要建设的是一套 **Visual Artifact System + Agent Authoring Skill**，不是单纯“把页面 CSS 改好看”。

---

## 目标

本 PRD 覆盖 RenderKit Visual Artifact System 的完整产品模块方向，并允许后续继续拆成多个实施 issue。

### 要解决什么

1. 建立 RenderKit 自己的设计系统基础：tokens、themes、surfaces、block styles。
2. 建立少量高质量 artifact themes / visual directions，借鉴 Open Design，但不盲目复制。
3. 建立 artifact surfaces / templates，让 Agent 可按产物类型生成内容。
4. 建立 RenderKit Agent authoring skill，让 Agent 知道如何写 `.rk.md`、如何选 surface/theme、如何 validate/push/feedback。
5. 扩展 block catalog，让 artifact 不再只是 heading/paragraph/callout/decision/diagram。
6. 把 Web 页面升级为 artifact review surface：topbar、right rail、block chrome、comment affordance、source excerpt。
7. 产出能演示产品方向的 showcase artifact。

### 分阶段目标

#### Phase 1：Visual Shell + Design Foundation

- `packages/design` 成为真实 CSS design system。
- Web app 接入统一 design CSS。
- 支持 `dark-pro`、`paper-light`、`amber-terminal`。
- `.rk.md` frontmatter 中 `theme` / `surface` 最小生效。
- 当前已有 blocks tokenized styling。
- Web shell 有 title/revision/theme/surface/right rail。

#### Phase 2：Agent Authoring Skill + Showcase

- 新增 RenderKit authoring skill。
- Skill 说明：何时使用 RenderKit、如何选择 surface/theme、如何写 block、如何 validate/push/feedback。
- 新增 `examples/alpha-showcase.rk.md`。
- Showcase 覆盖关键 artifact surfaces 和 block patterns。

#### Phase 3：Block Catalog + Block System

- 扩展 `.rk.md` blocks：`summary`、`code`、`table`、`checklist`、`timeline`。
- `packages/blocks` 从空壳变成真实 block registry / renderer。
- Web app 使用 block registry。

#### Phase 4：Open Design-inspired Design Systems / Recipes

- 引入更完整的 design preset / recipe 层。
- 借鉴 Open Design 的 `DESIGN.md` 思路，为 RenderKit 定义轻量 `design-system`/`recipe` 格式。
- 初期不需要 70 个品牌系统，但要形成可扩展目录结构。
- 后续可以加入更多 Open Design/html-anything 风格的 artifact recipes。

---

## 解决方案

### 用户可感知行为

Agent 使用 RenderKit skill 后，可以生成这样的 `.rk.md`：

```yaml
---
title: Auth Refactor Decision Brief
surface: decision-brief
theme: dark-pro
---

# Auth Refactor Decision Brief

:::summary{id="exec-summary"}
...
:::

:::decision-card{id="auth-decision"}
question: 认证方式选择
chosen: JWT + Redis
status: proposed
...
:::
```

然后执行：

```bash
node packages/cli/bin/renderkit.mjs validate plan.rk.md --json
node packages/cli/bin/renderkit.mjs push plan.rk.md --open --json
```

用户在浏览器看到：

- 页面不是普通 Markdown preview，而是针对当前 surface 优化的 artifact。
- 顶部显示 artifact title、revision、theme、surface。
- 每个 block 有清晰的卡片/分区/评论入口。
- 右侧评论栏可以按 block 进行 review。
- theme 改变只改变视觉，不破坏评论和 feedback。
- feedback 仍返回 sourceRange/sourceExcerpt，Agent 可继续改源文件。

### 系统结果

系统新增或强化这些能力：

1. `packages/design`
   - token/theme/surface/block css。
   - 内置 visual systems。

2. `packages/dsl`
   - frontmatter metadata：`theme`、`surface`。
   - 新 block schema/compile。
   - 继续严格处理 unknown directive。

3. `packages/blocks`
   - block registry。
   - block components。
   - block-level error fallback。

4. `apps/web`
   - artifact shell。
   - review chrome。
   - theme/surface data attributes。
   - comments rail。

5. `skills/renderkit-authoring`
   - Agent-facing authoring guide。
   - 让 Agent 知道怎么生成 RenderKit source，而不是随便写 Markdown。

6. `examples`
   - showcase documents。
   - fixture documents。

---

## 用户故事

1. **作为 Agent，我知道什么时候应该使用 RenderKit**
   - 当需要生成计划、决策、review、runbook、报告等需要人审阅的 artifact 时，使用 RenderKit。
   - 不把 RenderKit 当普通 Markdown preview。

2. **作为 Agent，我知道如何选择 surface**
   - `engineering-plan` 用于实施方案。
   - `decision-brief` 用于决策对比。
   - `review-report` 用于审查反馈。
   - `runbook` 用于操作步骤。
   - `data-report-lite` 用于轻量数据/表格报告。

3. **作为 Agent，我知道如何选择 theme**
   - `dark-pro`：默认工程 artifact。
   - `paper-light`：长文/报告/截图友好。
   - `amber-terminal`：用户偏好的 amber/yellow aesthetic。
   - 后续可扩展 Open Design-inspired presets。

4. **作为用户，我打开 artifact 后能感知这是一个“设计过的产物”**
   - 页面不是简单 Markdown。
   - 有 topbar、revision、surface、right rail、block chrome。
   - block 有清晰层级与视觉密度。

5. **作为用户，我可以继续按 block 评论**
   - 任意 block 可评论。
   - comment count / selected state 清楚。
   - feedback 能定位源文件。

6. **作为开发者，我可以扩展一个 block**
   - 在 DSL 定义 schema/compile。
   - 在 blocks registry 添加 renderer。
   - 使用 design tokens 写样式。
   - validate/build/showcase 能验证。

7. **作为开发者，我可以扩展一个 theme/recipe**
   - 在 design system 目录添加 token/theme/surface 配置。
   - 不需要改每个 block 的逻辑。

8. **边界情况：Agent 写错 block 或属性**
   - `validate` 给出 code/line/message。
   - unknown directive 失败。
   - Agent 能根据错误修复。

---

## 实现决策

### 1. Design System 层

模块：`packages/design`

目标结构：

```text
packages/design/src/
├── index.css
├── tokens.css
├── themes.css
├── surfaces.css
├── blocks.css
└── recipes.css        # 可选，后续
```

职责：

- semantic tokens：`--rk-bg`、`--rk-surface`、`--rk-text`、`--rk-muted`、`--rk-border`、`--rk-accent`。
- tone tokens：info/warning/danger/success/neutral。
- status tokens：draft/proposed/approved/blocked/resolved/orphaned。
- theme presets：`dark-pro`、`paper-light`、`amber-terminal`。
- surface layout：engineering-plan、decision-brief、review-report、runbook、data-report-lite。
- block base styles。

Open Design 参考方式：

- 吸收 design-system-as-context 思路。
- 后续可定义轻量 `DESIGN.md` 或 `recipe.md`。
- 不直接复制品牌资产、CSS、模板。

### 2. Surface / Recipe 层

模块：可先在 `packages/design` + `packages/dsl` 中最小实现，后续独立目录。

初期 surface：

```text
engineering-plan
decision-brief
review-report
runbook
data-report-lite
```

每个 surface 至少定义：

- 推荐 theme。
- 推荐 block sequence。
- layout density。
- block emphasis rules。
- anti-patterns。

例：`decision-brief`

```text
recommended blocks:
- summary
- decision-card
- callout risk
- alternatives table
- diagram optional
```

### 3. Agent Authoring Skill

新增能力：RenderKit 自己的 skill。

目标路径待确认，建议：

```text
skills/renderkit-authoring/SKILL.md
```

或如果要直接给 Pi 使用，可后续安装到：

```text
~/.agents/skills/renderkit-authoring/SKILL.md
```

Skill 内容必须包含：

- 何时使用 RenderKit。
- `.rk.md` 基本结构。
- frontmatter：`title`、`surface`、`theme`。
- block catalog。
- 每种 surface 推荐结构。
- 每种 theme 的使用场景。
- 写作约束：
  - directive block 必须有 stable id。
  - 不要随意改已有 id。
  - 不使用 MDX/JSX/HTML。
  - 人类只在 Web 评论，不编辑正文。
- CLI loop：
  - `validate`
  - `push --open`
  - `status`
  - `feedback`
- feedback 修订流程。
- 常见错误与修复。

该 skill 是关键产品能力。没有它，Agent 不知道如何稳定生成高质量 RenderKit artifact。

### 4. DSL 层

模块：`packages/dsl`

要变：

- model 增加 `theme` / `surface`。
- 支持新增 blocks：
  - `summary`
  - `code`
  - `table`
  - `checklist`
  - `timeline`
- 引入 block schema registry 思路。
- unknown directive 继续 validate fail。
- 错误保持 Agent-fixable：code、line、column、message。

待确认：

- unknown `theme/surface` 是 warning fallback 还是 validate error。
- table 是解析 GFM table 还是 directive table。

### 5. Blocks 层

模块：`packages/blocks`

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
    ├── DiagramBlock.jsx
    ├── ChecklistBlock.jsx
    └── TimelineBlock.jsx
```

职责：

- block renderer registry。
- block-level error isolation。
- data attrs：`data-block-id`、`data-block-type`。
- selected/comment states。
- 不负责 storage/API。

### 6. Web App 层

模块：`apps/web`

要变：

- 引入 `@renderkit/design/index.css`。
- 根据 model 设置 `data-rk-theme` / `data-rk-surface`。
- Artifact shell：topbar / main / right rail。
- Comments rail：selected block、all comments、orphaned/resolved 状态。
- Theme switch UI：建议做。是否写回 artifact source 待确认，默认只做本地 UI state。
- 继续保留 Mermaid 局部错误隔离。

### 7. Examples / Showcase

模块：`examples`

新增：

```text
examples/alpha-showcase.rk.md
examples/surfaces/engineering-plan.rk.md      # 后续
examples/surfaces/decision-brief.rk.md        # 后续
examples/surfaces/review-report.rk.md         # 后续
examples/surfaces/runbook.rk.md               # 后续
examples/surfaces/data-report-lite.rk.md      # 后续
```

用途：

- 产品演示。
- Agent authoring skill 示例。
- 回归验证。

---

## 验收标准

### 总体验收

- RenderKit 生成的页面明显不是普通 Markdown preview。
- Agent 有明确 skill 可以指导生成 `.rk.md`。
- 至少一个 showcase artifact 能完整展示：theme、surface、blocks、comments、feedback。
- 核心 CLI/Web loop 不回退。

### Design System 验收

- `packages/design` 有统一入口 `index.css`。
- 至少有 `tokens.css`、`themes.css`、`surfaces.css`、`blocks.css`。
- `dark-pro`、`paper-light`、`amber-terminal` 可用。
- theme 影响 bg/surface/text/border/accent/tone/focus。
- block 样式主要走 `--rk-*`。
- `amber-terminal` 不出现黑字不可见或黑底突兀问题。

### Surface 验收

- `.rk.md` frontmatter 支持 `surface`。
- Web container 可检查到：

```html
data-rk-surface="decision-brief"
```

- 至少 `engineering-plan`、`decision-brief`、`review-report` 有推荐结构说明。

### Agent Skill 验收

- 存在 RenderKit authoring skill 文件。
- Skill 能指导 Agent 写出有效 `.rk.md`。
- Skill 包含 validate/push/feedback loop。
- Skill 包含 block id 稳定性规则。
- 使用 skill 生成的 showcase 可 validate 通过。

### Block Catalog 验收

至少支持并演示：

- heading
- paragraph
- summary
- callout
- decision-card
- code
- table
- diagram

后续可加：

- checklist
- timeline

### Review UX 验收

- 顶部显示 title/revision/theme/surface。
- 每个 block 有 `data-block-id` / `data-block-type`。
- block hover/selected/comment count 清楚。
- 右侧 comments rail 可创建评论。
- feedback 仍返回 sourceRange/sourceExcerpt。
- orphaned/resolved 评论有视觉区分或至少不丢失。

### 链路验收

```bash
node packages/cli/bin/renderkit.mjs validate examples/alpha-showcase.rk.md --json
node packages/cli/bin/renderkit.mjs push examples/alpha-showcase.rk.md --open --json
node packages/cli/bin/renderkit.mjs status examples/alpha-showcase.rk.md --json
node packages/cli/bin/renderkit.mjs feedback examples/alpha-showcase.rk.md --json
pnpm --filter @renderkit/web build
```

全部通过。

---

## 测试与验证策略

### 真实链路验证

- 启动 server。
- push showcase。
- 浏览器人工看三个 themes。
- 创建评论。
- 拉 feedback。
- 修改 `.rk.md` 再 push。
- 验证 revision/status/comments 不回退。

### 局部验证

#### DSL

- frontmatter `theme/surface` 进入 model。
- 新 block validate 成功。
- bad fixtures 继续失败。
- unknown directive 继续失败。

#### Skill

- 用 skill prompt 生成一份 `.rk.md`。
- validate 通过。
- 若失败，错误能被 Agent 修复。

#### CSS/UI

- theme 切换只影响 CSS variables。
- block 不散落硬编码主色。
- mobile/narrow width 不崩。
- Mermaid error 不白屏。

#### Manual review

人工评审项：

- 页面是否有 Open Design/html-anything 启发的 artifact 感。
- `amber-terminal` 是否符合用户审美。
- comment affordance 是否清楚。
- 是否真的比 Markdown preview 好看。

---

## 范围外

以下不是产品路线外，而是本 PRD 当前不要求立即完成或需要另开 PRD/issue 的事项：

- npm publish / global install。
- 将 Next server 打包进单 npm 包。
- Open Design 式 daemon、agent runtime、PATH scan。
- 任意 HTML 生成器。
- WeChat/X/Zhihu/PNG/PDF export。
- SQLite / DB migration。
- auth / 多用户 / cloud sync。
- MCP。
- Docker。
- SQL runtime / DuckDB / data source integration。
- D2 / PlantUML / ECharts / AntV 完整图表生态。
- 70+ brand systems 一次性导入。
- 75 skills 一次性导入。

注意：

- Open Design-inspired design systems 是本产品方向内。
- html-anything-inspired surfaces/templates 是本产品方向内。
- RenderKit authoring skill 是本产品方向内，而且应尽早做。

---

## 风险与待确认项

### 风险

1. **只做 UI 美化，没做系统**
   - 缓解：必须落到 design tokens、surfaces、skills、blocks。

2. **Open Design 参考变成盲抄**
   - 缓解：吸收结构和思想，不复制资产/品牌 CSS/模板。

3. **Agent 不会写 RenderKit**
   - 缓解：RenderKit authoring skill 是核心交付，不是文档附属品。

4. **一次性做太大**
   - 缓解：按 phase 拆，但 PRD 保持完整产品方向。

5. **theme/surface 复杂度膨胀**
   - 缓解：先做 3 themes + 5 surfaces + 少量 recipes。

6. **block id/comment 锚点漂移**
   - 缓解：skill 强制稳定 id；后续减少 auto id 依赖。

7. **license / attribution 风险**
   - 缓解：Open Design/html-anything 只做参考；复制代码/模板/资产前必须查 license。

### 待确认项

1. RenderKit authoring skill 放在 repo 内 `skills/renderkit-authoring/SKILL.md`，还是直接安装到用户 skill 目录。
2. unknown `theme/surface` 是 warning fallback 还是 validate error。
3. theme switch UI 是否写回 artifact source，还是仅本地预览状态。
4. table block 用 GFM table 还是 directive table。
5. 第一批 Open Design-inspired presets 除 `dark-pro/paper-light/amber-terminal` 外，是否加入 `editorial-kami`、`tech-utility`。
6. 是否需要在 repo 内保留 Open Design/html-anything 参考摘要文档。
