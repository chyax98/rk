---
title: RenderKit 当前缺口评审
version: 1
theme: paper-light
surface: review-report
---

# RenderKit 当前缺口评审

:::sum{id="review-summary" title="结论先行" width="wide"}
当前 RenderKit 已有可运行的 Agent-to-UI 主链路，但不能再说“完整 OK”。之前的完成判断过于乐观：它主要验证了主链路和若干产品能力，却没有把 TypeScript 深迁移、代码结构收束、侧边栏减负、中文优先一致性、测试数据污染等问题作为硬性验收项。本文档把当前缺口整理成可裁决的产品评审材料，同时用 RenderKit 自身能力生成一篇可评论 artifact。
:::

::::grid{id="top-risk-grid" columns="3" title="当前最影响产品力的三类问题" width="wide"}
:::alert{id="risk-review-pane" title="评审侧边栏负担过重"}
侧边栏同时承载评论列表、当前块、输入框、Agent handoff、source metadata、raw id/status，信息架构混杂。
:::

:::warn{id="risk-engineering" title="工程收束不足"}
TypeScript 仍停留在 typed boundary，runtime 代码仍以 `.mjs/.jsx` 为主；代码结构还需要拆分状态机和组件。
:::

:::warn{id="risk-test-data" title="测试数据污染 Demo"}
smoke/browser verifier 多次往同一 artifact 写入 `Smoke test quote comment`，真实侧边栏出现重复评论。
:::
::::

:::table{id="gap-table" title="缺口清单与证据" width="wide"}
| Area | 当前状态 | 证据 | 影响 | 建议优先级 |
|---|---|---|---|---|
| TypeScript 深迁移 | 只完成 shared/DSL/Store/API/Blocks typed boundary，runtime 未迁移 | `packages/**/*.mjs`、`apps/web/**/*.jsx` 仍是主实现 | 长期可维护性和重构安全不足 | P1 |
| Web 代码结构 | `ArtifactView.jsx` 承担 review state、selection、drawer、comments、context menu、highlight | 单文件高状态组件 | 交互继续增长会难维护 | P1 |
| 侧边栏信息架构 | `drawerMode` 存在但 `ReviewPanel` 没按 mode 分支 | `ReviewPanel({ mode })` 中 mode 未被使用 | 用户不知道当前是在看评论、选中块还是 Agent metadata | P0 |
| 评论数据结构展示 | UI 直接展示 `blockId`、`commentId`、英文 status | 侧边栏显示 `project-summary`、`cmt_xxx`、`open` | 像数据库行，不像评审产品 | P0 |
| 测试数据污染 | 同一 artifact 累积 10 条 smoke comment | `feedback` 返回多个 `Smoke test quote comment` | Demo 看起来脏，干扰真实评审 | P0 |
| Feedback command | UI 生成 `rk feedback <artifactId>` | CLI bin 是 `renderkit`；source-file feedback 才更符合 Agent 回路 | Agent handoff 命令不可靠 | P0 |
| 中文优先 | 文档部分中文化，但 UI 和示例仍中英混杂 | `Review`、`All comments`、`Selected block`、`Agent metadata` | 用户评审体验不统一 | P1 |
| Outline 语义 | outline 现在是顶层 block 列表，不是真文档目录 | `outlineItems = blocks.map(...)` | 更像调试导航，不像文档产品 | P2 |
| Mermaid 可访问文本 | `pw read-text` 读出大量 SVG/CSS | 真实页面 text extraction 出现 `#mya...{font-family...}` | 影响可访问性和 Agent 阅读 | P1 |
| 完成审计标准 | 之前把大量 proxy signal 当完成证明 | final audit 没覆盖用户刚指出的交互/工程细项 | 目标完成判断不可信 | P0 |
:::

::::compare{id="done-vs-not-done" title="已完成能力 vs 未完成产品化" width="wide"}
| 维度 | 已完成 | 未完成 / 不应再混淆 |
|---|---|---|
| 主链路 | validate → push → render → comment → feedback 可运行 | 反馈命令语义和 demo 数据隔离需要修正 |
| 视觉展示 | 文档优先布局、rich blocks、主题 token 已有基础 | 侧边栏/评论产品体验仍像调试工具 |
| 评论 | block comment、selection quote、resolve/reopen 已实现 | 评论线程分组、定位、状态语言、人类可读结构不足 |
| Agent 能力 | recipes、design recommend、skill、contracts 已有 | Agent handoff UI 命令不可靠，缺更清晰的工作流面板 |
| TypeScript | `.d.ts` 边界和 drift gate 已有 | runtime TS/TSX migration 没做完 |
| 文档资产 | pass docs、research docs 很多 | 中文优先和当前交互评审文档需要继续补齐 |
::::

:::dec{id="completion-decision" q="当前项目是否应继续保持 goal complete 判断？" chosen="不应继续视为完整完成；应进入收束迭代" status="proposed" width="wide"}
- 之前完成判断基于主链路、browser gate、contract gate 和设计资源归档，这些证据有效但不充分。
- 用户明确提出的 TypeScript、代码优化、侧边栏减负、中文优先仍有真实缺口。
- 后续应该改用“产品力收束 backlog”而不是“已完成”叙事。
:::

:::fig{id="interaction-map" caption="当前交互模型与问题位置" width="wide"}
flowchart LR
  A[Reading mode] --> B[Review button]
  B --> C[Review mode]
  C --> D[Right review pane]
  D --> E[Filters]
  D --> F[Selected block inspector]
  D --> G[All comments]
  D --> H[Agent handoff]
  G --> I[Raw blockId/commentId/status]
  F --> J[Source metadata]
  I --> K[Human burden]
  J --> K
  H --> L[Command reliability risk]
:::

:::roadmap{id="next-work-plan" title="建议下一批飞轮" width="wide"}
- [active] P0 交互收束：重构侧边栏为 `评论 / 当前块 / Agent` 三个明确 tab，隐藏 raw ids，评论按 block/thread 分组。
- [active] P0 数据卫生：verifier 使用临时 artifact 或测试 namespace，避免污染真实 demo；提供 cleanup 命令。
- [next] P0 Handoff 修正：UI 中所有 feedback command 改为真实 `renderkit feedback <source-file>` 或明确 artifact/source 映射。
- [next] P1 中文优先：Web UI 文案、状态、按钮、空态、评审面板统一中文，技术名保留英文。
- [planned] P1 TypeScript runtime：先迁移 `ArtifactView.jsx` 拆出的状态/评论组件，再迁移 blocks registry。
- [planned] P1 代码结构：把 selection、comment lifecycle、panel state、highlight anchoring 从 `ArtifactView.jsx` 拆成独立模块。
- [planned] P1 A11y/text extraction：修正 Mermaid/SVG 的可访问文本污染。
- [planned] P2 Outline：改成真正文档目录，headings first，titled blocks optional。
:::

:::todo{id="review-checklist" title="下一轮验收清单" width="wide"}
- [ ] 打开 demo artifact 时没有重复 smoke comments。
- [ ] 侧边栏默认显示“评论”视图，且只展示人类评审需要的信息。
- [ ] 点击评论能定位到对应 block，并高亮当前评论上下文。
- [ ] 当前块信息和 Agent metadata 分离，metadata 默认折叠。
- [ ] UI 主要文案中文优先：待处理、已解决、当前块、全部评论、复制反馈命令。
- [ ] feedback command 在终端直接可执行。
- [ ] `ArtifactView.jsx` 拆分后单文件职责明显变少。
- [ ] 至少一条 runtime TS/TSX migration 落地，而不只是 `.d.ts`。
- [ ] `pnpm verify`、`pnpm verify:browser`、真实 `pw` 交互验证通过。
:::

:::note{id="review-note" title="本 artifact 的用途" width="wide"}
这不是最终方案，而是裁决材料。建议你直接在这个 RenderKit 页面上评论：哪些问题是 P0，哪些可以延期，侧边栏要走 Notion 式 comments thread、飞书式批注列表，还是更偏代码 review 的 review queue。
:::

:::src{id="commands-used" language="bash" title="生成和验证本文档的命令" width="wide"}
```bash
node packages/cli/bin/renderkit.mjs validate docs/product/renderkit-current-gap-review.rk.md --json
node packages/cli/bin/renderkit.mjs push docs/product/renderkit-current-gap-review.rk.md --open --json
```
:::
