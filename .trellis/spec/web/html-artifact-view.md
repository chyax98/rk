# HtmlArtifactView 架构规范

> 飞书式评论面板 + anchor 系统 + 主题提取

## 文件位置

`apps/web/app/a/[id]/HtmlArtifactView.tsx` — 客户端组件（`'use client'`）

## 整体架构

```
<div class="rk-layout" data-rk-theme="{theme}">
  <div class="rk-html-body">
    <div dangerouslySetInnerHTML={processedHtml} />   ← 服务端注入的 HTML
  </div>
  <button class="rk-add-comment-btn" />               ← 浮动 "+" 按钮（JS 定位）
  <button class="rk-panel-tab" />                      ← 面板切换 tab
  <aside class="rk-comment-panel" />                   ← 右侧评论面板
</div>
```

## 关键子系统

### 1. Theme 提取

Agent 在 HTML 里设置 `<body data-rk-theme="paper-light">`，经过 `html-processor.ts` 处理后，`processedHtml` 中保留了该属性。

React 端用 `useMemo` + regex 提取：
```typescript
const theme = useMemo(() => {
  const m = revision.processedHtml?.match(/data-rk-theme="([^"]+)"/);
  return m?.[1] || 'paper-light';  // 默认 paper-light
}, [revision.processedHtml]);
```

设置到最外层 `<div class="rk-layout" data-rk-theme={theme}>`，CSS 变量自动继承到所有 `--rk-*` token。

### 2. Anchor 系统

`html-processor.ts` 在处理 HTML 时，为每个顶层块元素注入 `data-rk-anchor` 属性：
```
<h1 data-rk-anchor="anc_0">标题</h1>
<rk-callout data-rk-anchor="anc_1" ...>...</rk-callout>
```

锚点数据存储在 `anchors` 数组中，每个包含：
- `id`: 唯一 ID（`anc_xxxx`）
- `anchor`: 锚点名称（同 `data-rk-anchor` 属性值）
- `elementTag`: 元素标签名
- `position`: 文档位置序号
- `textPreview`: 文本预览（最多 200 字符）

可见锚点过滤规则：`rk-*` 开头 + `h1/h2/h3/h4/p/section/div`。

### 3. 飞书式评论面板

**默认状态**：面板折叠（`panelOpen = false`），文档占满宽度。

**交互流程**：
1. 鼠标 hover 到带 `data-rk-anchor` 的元素
2. JS `mouseover` 事件计算 `getBoundingClientRect()`
3. 浮动 "+" 按钮出现在块元素右侧（`position: fixed`）
4. 点击 "+" → 面板展开 → 输入框出现（自动 focus）
5. Cmd+Enter 提交 → `POST /api/artifacts/:id/comments`
6. 面板中按文档位置排序显示所有评论
7. 点击评论卡片 → `scrollToAnchor` → 文档滚动到对应位置

**自动展开**：有评论时（`openComments.length > 0`）面板自动展开。

**布局推挤**：面板展开时 `.panel-open .rk-html-body { max-width: 600px; margin-right: 0 }`，真实占据布局空间，不是 overlay。

### 4. "+" 按钮定位机制

**关键**：不能在 `dangerouslySetInnerHTML` 内渲染 React 元素。

正确做法：
1. 单个 React `<button>` 组件，`position: fixed`
2. JS 事件监听 `mouseover`/`mouseout` on `bodyRef`
3. `getBoundingClientRect()` 计算 `top` 和 `left`
4. 隐藏用 300ms `setTimeout` 延迟，鼠标移到按钮上时取消定时器

### 5. 评论数据流

```
POST /api/artifacts/:id/comments
  body: { anchor: "anc_0", text: "评论内容" }

  → SQLite comments 表

GET /api/artifacts/:id/feedback
  → store.ts getFeedback()
  → 返回 { openCount, comments: [...] }
```

`rk feedback` CLI 命令读取此 API，返回 JSON 给 Agent。

## 已知约束

- Light DOM only — 评论定位依赖 `querySelector` 遍历 DOM，不能用 Shadow DOM
- 主题在 push 时固定 — 不支持运行时切换主题（Agent 写 HTML 时指定）
- 锚点只覆盖顶层块元素，不支持行内选择
