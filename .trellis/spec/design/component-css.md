# 组件 CSS 编写规范

## 命名约定

### Class 命名

```
.rk-{component}
.rk-{component}-{part}
.rk-{component}-{part}-{state}
```

- 前缀固定 `rk-`
- 连字符分隔单词
- 不用 BEM 双下划线，用单连字符模拟（`rk-block-heading`、`rk-code-header`）
- 状态通过 `data-*` 属性表达，不通过 class

示例：
```css
.rk-block { }                        /* 组件 */
.rk-block-heading { }                /* 组件变体 */
.rk-code-header { }                  /* 子部件 */
.rk-block-callout[data-tone="warning"] { }  /* 状态 */
```

### data 属性状态

优先用 `data-*` 属性表达状态：

```html
<div class="rk-block" data-rk-selected>          <!-- 选中 -->
<div class="rk-block" data-rk-has-comments>       <!-- 有评论 -->
<div class="rk-block-callout" data-tone="warning"><!-- 语气 -->
<div class="rk-pill" data-status="approved">      <!-- 状态 -->
<div class="rk-chip" data-active="true">          <!-- 激活 -->
```

不用 `.is-active`、`.is-selected` 这类 class。

## 编写规则

### 1. 只消费 token，不硬编码

**正确**：
```css
.rk-card {
  background: var(--rk-surface-solid);
  border: var(--rk-border-width) solid var(--rk-border);
  color: var(--rk-text);
  padding: var(--rk-space-4);
  border-radius: var(--rk-radius-lg);
}
```

**错误**：
```css
.rk-card {
  background: #ffffff;        /* ❌ 硬编码颜色 */
  border: 1px solid #dfe3ea;  /* ❌ 硬编码 */
  color: #1a1a1a;             /* ❌ 硬编码 */
  padding: 16px;              /* ❌ 硬编码尺寸 */
}
```

### 2. 排版用 preset shorthand

**正确**：
```css
.rk-block-heading h1 {
  font: var(--rk-type-h1);
  color: var(--rk-text);
  letter-spacing: var(--rk-tracking-tight);
}
```

**错误**：
```css
.rk-block-heading h1 {
  font-size: 40px;           /* ❌ 拆开写 */
  font-weight: 700;          /* ❌ 应该用 preset */
  line-height: 1.25;
  font-family: Inter, ...;
}
```

### 3. 间距用 space token

```css
margin: var(--rk-space-4) 0;
padding: var(--rk-space-3) var(--rk-space-4);
gap: var(--rk-space-2);
```

### 4. 阴影用 shadow token

```css
box-shadow: var(--rk-shadow-sm);   /* 卡片默认 */
box-shadow: var(--rk-shadow-lg);   /* 弹出层 */
```

主题通过 `--rk-shadow` 控制默认阴影级别。

### 5. 动效用 motion token

```css
transition: border-color var(--rk-ease), background var(--rk-ease);
```

### 6. 层级用 z-index token

```css
z-index: var(--rk-z-dropdown);   /* 下拉菜单 */
z-index: var(--rk-z-modal);      /* 模态框 */
```

## 组件块分类

### 基础块（无容器感）

这些块去掉了默认卡片的边框/阴影/背景：

- `.rk-block-heading` — 标题（h1-h3）
- `.rk-block-paragraph` — 正文段落

特点：`background: transparent; border: 0; box-shadow: none;`

### 卡片块（有容器感）

- `.rk-block-summary` — 摘要（左边框 + 信息色背景）
- `.rk-block-callout` — 提示框（左边框 + tone 背景色）
- `.rk-block-decision-card` — 决策卡
- `.rk-block-code` — 代码块
- `.rk-block-diagram` — 图表
- `.rk-block-table` / `.rk-table-block` — 表格
- `.rk-block-image` — 图片
- `.rk-block-tabs` — 标签页
- `.rk-block-stat` — 统计数字
- `.rk-block-checklist` — 检查列表
- `.rk-block-quote` — 引言
- `.rk-block-comparison` — 对比
- `.rk-block-timeline` — 时间线
- `.rk-block-grid` — 网格布局

### 内联元素

- `.rk-pill` — 标签（圆角胶囊）
- `.rk-badge` — 徽章（通知数字）
- `.rk-chip` — 筛选标签

### 功能块

- `.rk-menu` — 上下文菜单
- `.rk-command-palette` — 命令面板
- `.rk-inspector` — 检查面板
- `.rk-comment-thread` / `.rk-comment-card` — 评论
- `.rk-source-excerpt` — 源码摘录
- `.rk-error-box` — 错误提示
- `.rk-code-frame` — 终端/编辑器模拟框
- `.rk-scrollable` — 可滚动容器

## 代码高亮（highlight.js）

代码高亮在 `.rk-block-code` 内部，使用 `.hljs-*` class。

亮色主题默认色：
- keyword/selector/literal → `#7c3aed`（紫）
- string/title/type → `#047857`（绿）
- comment/quote → `var(--rk-muted)`（灰）
- number/regexp/variable → `#b45309`（棕）

暗色主题（`dark-pro`）覆盖为更亮的变体：
- keyword → `#c4b5fd`
- string → `#86efac`
- number → `#fcd34d`

## 响应式规则

只有一个断点：`760px`（移动端）。

```css
@media (max-width: 760px) {
  .rk-grid-cells { grid-template-columns: 1fr; }
  /* 其他网格降级为单列 */
}
```

Chrome 层还有 `900px` 断点用于侧边栏隐藏：
```css
@media (max-width: 900px) {
  .rk-artifact { grid-template-columns: 1fr; }
  .rk-sidebar-left { display: none; }
}
```

## 与 @renderkit/components 协作

- `@renderkit/components` 注册 Web Components（如 `<rk-callout>`）
- Components 在 Shadow DOM 内通过 `adoptedStyleSheets` 引入 design CSS
- 外层设置 `data-rk-theme` → CSS 变量穿透 Shadow DOM → 组件自动跟随主题
- Components 的 class 命名必须与 `blocks.css` 中的 `.rk-*` 一致

## 常见错误模式

1. **硬编码颜色**：`color: #1a1a1a` → 应该用 `var(--rk-text)`
2. **硬编码字号**：`font-size: 14px` → 应该用 `var(--rk-text-sm)` 或 `font: var(--rk-type-*)`
3. **硬编码间距**：`padding: 12px` → 应该用 `var(--rk-space-3)`
4. **硬编码圆角**：`border-radius: 8px` → 应该用 `var(--rk-radius-md)`
5. **在 blocks.css 定义新 token** → token 只能在 `tokens.css` 和 `themes.css` 定义
6. **用 class 表达状态** → 用 `data-*` 属性
