# RenderKit Design System

Agent 只需要在 `<body>` 上加一个属性，整个页面（包括所有 21 个 Web Components）自动切换风格：

```html
<body data-rk-theme="dark-pro">
  <!-- 所有 <rk-*> 组件自动匹配主题 -->
</body>
```

---

## 主题清单

| 主题名 | 风格 | 适用场景 |
|---|---|---|
| `paper-light` | 温暖纸质，无衬线 | **默认**。长文档、报告、方案、README |
| `dark-pro` | 深蓝暗色，科技感 | 技术报告、系统设计、架构文档 |
| `notion-clean` | 暖白极简，Notion 风 | 协作文档、知识库、项目 Wiki |
| `linear-app` | 黑底靛紫，工程精密 | 产品 roadmap、sprint 回顾、issue 追踪 |
| `amber-terminal` | 琥珀深棕，复古终端 | 运维 Runbook、故障排查、SRE 文档 |
| `glassmorphism` | 渐变毛玻璃，视觉强 | 产品发布、营销页、功能展示 |
| `ibm-enterprise` | 白底蓝字，Carbon 风 | 企业报告、合规文档、年度总结 |
| `editorial-kami` | 日式留白，衬线字体 | 设计提案、品牌文档、创意简报 |

---

## 快速选择指南（Agent 用）

```
写技术文档？→ dark-pro 或 paper-light
写商业报告？→ ibm-enterprise 或 paper-light
写产品文档？→ notion-clean 或 linear-app
写运维手册？→ amber-terminal
做产品发布？→ glassmorphism
做设计提案？→ editorial-kami
默认/不确定？→ paper-light（最安全）
```

---

## 语义 Token 系统

所有主题覆盖以下语义 token（在 `packages/design/src/tokens.css` 中定义默认值，各主题覆盖）：

### 背景层

| Token | 用途 |
|---|---|
| `--rk-bg` | 页面背景 |
| `--rk-surface` | 卡片/组件背景 |
| `--rk-surface-solid` | 无透明度的 surface（用于需要遮挡的场景）|
| `--rk-surface-raised` | 悬浮层背景（tooltip, dropdown）|
| `--rk-surface-sunken` | 凹陷背景（input, code block）|

### 文字

| Token | 用途 |
|---|---|
| `--rk-text` | 主文字（标题、正文）|
| `--rk-text-secondary` | 次要文字（副标题）|
| `--rk-text-tertiary` | 辅助文字（描述、说明）|
| `--rk-muted` | 最淡文字（时间戳、占位符）|

### 强调色

| Token | 用途 |
|---|---|
| `--rk-accent` | 主强调色（链接、按钮、高亮）|
| `--rk-accent-hover` | 悬停强调色 |
| `--rk-accent-muted` | 淡强调背景（tag, badge）|
| `--rk-accent-subtle` | 极淡强调背景（选中行）|

### 语义色（tone）

| Token | 用途 |
|---|---|
| `--rk-tone-info-bg` | 信息提示背景 |
| `--rk-tone-info-border` | 信息提示边框/图标 |
| `--rk-tone-warning-bg` | 警告提示背景 |
| `--rk-tone-warning-border` | 警告提示边框/图标 |
| `--rk-tone-danger-bg` | 危险提示背景 |
| `--rk-tone-danger-border` | 危险提示边框/图标 |
| `--rk-tone-success-bg` | 成功提示背景 |
| `--rk-tone-success-border` | 成功提示边框/图标 |

### 边框

| Token | 用途 |
|---|---|
| `--rk-border` | 标准边框 |
| `--rk-border-hover` | 悬停/激活边框 |
| `--rk-border-subtle` | 极淡边框（分隔线）|

### 代码块

| Token | 用途 |
|---|---|
| `--rk-code-bg` | 代码块背景 |
| `--rk-code-text` | 代码文字颜色 |
| `--rk-code-border` | 代码块边框 |

### 字体（所有主题共享基础值）

| Token | 值 |
|---|---|
| `--rk-font-sans` | Inter, Noto Sans SC, system-ui |
| `--rk-font-mono` | JetBrains Mono, ui-monospace |
| `--rk-font-serif` | Iowan Old Style, Georgia |

> Google Fonts 通过 `packages/design/src/tokens.css` 的 `@import` 自动加载。

---

## WC 与主题的关系

所有 21 个 Web Component 的 CSS 消费上述语义 token：

```
rk-callout   → --rk-tone-{type}-bg, --rk-tone-{type}-border
rk-code      → --rk-code-bg, --rk-code-text, --rk-font-mono
rk-metric    → --rk-accent, --rk-text, --rk-surface
rk-stat      → --rk-text, --rk-text-tertiary, --rk-surface
rk-table     → --rk-border, --rk-surface, --rk-text
...（其余 16 个同理）
```

改变 `data-rk-theme` 属性 → 所有 token 重新解析 → 所有 WC 自动切换外观。

---

## 示例文件

- `examples/capabilities/theme-showcase.html` — 8 套主题并排展示
- `examples/capabilities/diagram-engines.html` — 4 种图表引擎展示
- `examples/capabilities/hello.html` — 最简单的 Hello World

---

## 设计来源

| 主题 | 参考 |
|---|---|
| paper-light | md2html 阅读优先规范 |
| dark-pro | internal |
| notion-clean | open-design/design-systems/notion |
| linear-app | open-design/design-systems/linear-app |
| glassmorphism | open-design/design-systems/glassmorphism |
| ibm-enterprise | open-design/design-systems/ibm (Carbon Design System) |
| amber-terminal | internal |
| editorial-kami | internal |
