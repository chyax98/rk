# 设计系统架构

## 分层模型

```
┌─────────────────────────────────────┐
│  chrome.css                         │  App 级布局：shell / topbar / sidebar / rail / buttons
├─────────────────────────────────────┤
│  blocks.css                         │  组件块样式：每个 rk-* 组件的 CSS
├─────────────────────────────────────┤
│  surfaces.css                       │  Surface 上下文：按文档类型调整布局/密度
├─────────────────────────────────────┤
│  themes.css                         │  语义 token per theme：颜色/状态/交互
├─────────────────────────────────────┤
│  tokens.css                         │  基础 token：spacing/radius/typography/shadow/motion
└─────────────────────────────────────┘
```

依赖方向：上层依赖下层，下层不知道上层的存在。

## 数据流

1. `tokens.css` 在 `:root` 定义基础 token（原始值：`4px`、`15px`、`#xxx`）
2. `themes.css` 在 `[data-rk-theme="xxx"]` 选择器内定义语义 token，**引用**基础 token 或写具体颜色值
3. `surfaces.css` 在 `[data-rk-surface="xxx"]` 上下文中调整布局变量（max-width、density）
4. `blocks.css` 和 `chrome.css` **只消费**语义 token（`var(--rk-bg)`），不写硬编码值

## 主题切换机制

通过 HTML `data-rk-theme` 属性：

```html
<html data-rk-theme="dark-pro">
  <!-- 所有子元素自动获得 dark-pro 的语义 token -->
</html>
```

也支持 CSS class 切换（但当前代码统一用 `data-rk-theme`）。

## Surface 上下文

通过 `data-rk-surface` 属性指定文档类型，调整内容区域布局：

```html
<div data-rk-surface="engineering-plan">
  <div class="rk-content">...</div>
</div>
```

已定义的 surface 类型：
- `engineering-plan` — 全宽、紧凑密度
- `decision-brief` — 窄居中、宽松密度、决策卡片强调
- `review-report` — 全宽、表格友好、callout 强调
- `runbook` — 中等宽居中、步骤导向、代码块突出
- `data-report-lite` — 全宽、紧凑、表格/图表优先
- `proposal` — 中等宽居中、平衡
- `documentation` — 窄居中、宽松行高、适合长文阅读

## 与 @renderkit/components 的关系

- `@renderkit/design` 负责 **CSS 样式**（纯 CSS 文件）
- `@renderkit/components` 负责 **Web Components 定义**（JS，注册 custom elements）
- Components 包在 Shadow DOM 中 `adoptedStyleSheets` 导入 design 包的 CSS
- 两者通过 class 命名约定（`.rk-*`）和 token 变量对接
