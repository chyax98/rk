# Design System Deepening — Multi-theme Token System

## Goal

把 `packages/design/` 从 4 套主题扩展为完整的多主题设计系统，让 21 个 Web Components 真正消费 `--rk-*` token，并从参考 repo 提取设计精华落地到 RenderKit 的视觉语言。

## 当前状态

- 4 套主题：`dark-pro`、`paper-light`、`amber-terminal`、`editorial-kami`
- token 定义在 `packages/design/src/tokens.css`（spacing/radius/typography）
- **问题**：WC 的 CSS（`components.css`）大量硬编码颜色，没有消费 `--rk-*` 语义 token
- 参考 repo 已 clone：`md2html`、`ui-ux-pro-max-skill`、`html-anything`、`fireworks-tech-graph`

## 参考资源

| Repo | 核心价值 |
|---|---|
| `open-design/design-systems/` | **这是主要来源**：这里有近90 套设计系统，每套都有 `tokens.css` + `DESIGN.md`，可直接移植到 RenderKit 主题 |
| `html-anything` | 共享设计指令（anti-slop），CJK 字体规范，75 个模板 |
| `md2html` | 阅读优先排版规范，温暖纸质色系 |
| `fireworks-tech-graph` | 7 种图表风格 token |

## 目标

1. **WC 消费 token**：所有 21 个组件 CSS 改用 `--rk-bg`、`--rk-text`、`--rk-border`、`--rk-tone-*` 等语义变量
2. **主题扩展**：至少 8 套主题
3. **排版质量**：对齐 md2html 的阅读体验（正文宽度、行高、字体栈）
4. **Agent 创作指令**：提炼 anti-slop 设计规范写入 authoring skill

## 主题方向（待确认）

| 主题名 | 审美来源 | 适用场景 |
|---|---|---|
| `paper-light` | md2html 温暖纸质 | 默认，文档阅读 |
| `dark-pro` | 深色专业 | 技术报告 |
| `editorial-kami` | 日式留白 | 设计提案 |
| `amber-terminal` | 复古终端 | 工程 runbook |
| `notion-clean` | Notion 风格 | 协作文档 |
| `blueprint` | 蓝图/工程制图 | 架构图 |
| `glassmorphism` | 玻璃磨砂 | 产品发布 |
| `ibm-plex` | IBM 设计系统 | 企业报告 |

## 决策

- **执行方式**：两个 subagent 并行 — ① WC token 消费改造 ② 新主题设计，同步进行

## 核心设计模型

Agent 是 design system 的消费者，不是设计师：
- Agent 写 HTML 时加 `<body data-rk-theme="dark-pro">`，21 个 WC 自动跟随主题
- Skill 里告诉 Agent：哪种场景用哪个主题
- Agent 不需要懂 CSS，只需要选一个名字
- 目标：每套主题定义完整、够好看，Agent 选了之后出来的东西就是专业的

## 开放问题

1. ~~优先级~~（已决定：并行）
2. ~~主题审美基调~~（已决定：所有主题并存，各有定位）
3. ~~字体~~（已决定：Google Fonts — Inter + Noto Sans SC，好看优先）
4. **主题切换**：Agent 在 HTML 里通过 `data-rk-theme="xxx"` 指定，无需 UI 切换器

## Acceptance Criteria

- [ ] 所有 21 个 WC 改用语义 token（无硬编码颜色）
- [ ] 至少 8 套完整主题（每套覆盖所有语义 token）
- [ ] paper-light 主题对齐 md2html 排版水准
- [ ] `examples/capabilities/` 各有对应主题的示例 HTML
- [ ] `docs/design-system.md` 记录 token 用法 + 主题清单

## Out of Scope

- UI 主题切换器（Agent 写 HTML 时直接指定 data-rk-theme）
- 深色模式自动适配（`prefers-color-scheme`）
- 动画/微交互系统
