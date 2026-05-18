# 组件模式

## 服务端/客户端边界

### 规则

1. **page.tsx 永远是服务端组件**（不加 `'use client'`），负责数据获取和 metadata
2. **交互组件标记 `'use client'`**，通过 props 接收数据，通过 fetch 发起写操作
3. **store.ts 只在服务端使用**（page.tsx 和 api/ route），客户端通过 API route 间接访问

### 两种视图模式

| 组件 | 格式 | 渲染方式 | 状态 |
|------|------|----------|------|
| `HtmlArtifactView.tsx` | HTML | `dangerouslySetInnerHTML` | **当前主力** |
| `ArtifactView.tsx` | rkmd block model | `BlockFrame` 组件 | 旧格式，维护中 |

## HtmlArtifactView（主力模式）

**数据来源**: `page.tsx` 调用 `getHtmlArtifact(id)` → 传 `HtmlArtifactBundle`

**核心交互**:
- 右侧固定评论面板（Feishu 风格），sticky 定位
- 评论卡片点击 → `scrollToAnchor()` → 文档区滚动到对应 `data-rk-anchor` 元素
- 新评论：选择 anchor 下拉 + 文本框，`Cmd+Enter` 提交
- 面板可收起/展开

**样式加载**:
```tsx
<link rel="stylesheet" href="/rk/theme.css" />
<link rel="stylesheet" href="/rk/components.css" />
```
通过 `<link>` 标签引入静态 CSS，非 import。

**dangerouslySetInnerHTML 规则**:
```tsx
{/* biome-ignore lint/security/noDangerouslySetInnerHtml: server-processed HTML */}
<div dangerouslySetInnerHTML={{ __html: revision.processedHtml || '' }} />
```
HTML 经过服务端 `processHTML()` 处理，可安全渲染。每处使用必须加 biome-ignore 注释。

## ArtifactView（旧格式）

**数据来源**: 接收 `model.blocks`（旧格式 artifact 的 JSON model）

**组件组合**:
```
ArtifactView
├── useReviewState()    — review 模式、drawer、outline 状态
├── useComments()       — 评论 CRUD
├── useSelection()      — 文本选择 + TextQuoteSelector
├── useHighlights()     — CSS Highlight API 高亮
├── useKeyboard()       — Escape 键处理
├── OutlineDrawer       — 目录侧栏
├── ReviewPanel         — 评论面板
├── SelectionMenu       — 选中文本后的浮动按钮
└── ContextMenu         — 右键上下文菜单
```

## Hooks 模式

所有 hook 在 `app/a/[id]/hooks/` 下，每个文件一个 hook。

### useComments(artifactId, initial)
- 管理 `Comment[]` state
- `submitComment(anchor, text, selector)` → fetch POST
- `setCommentStatus(commentId, status)` → fetch PATCH
- `commentsFor(anchor)` → 过滤函数
- `commentStatusForAnchor(anchor)` → 返回 'open' | 'orphaned' | 'resolved' | null

### useReviewState()
- reviewMode / drawerOpen / drawerMode / selected / outlineOpen / menu
- 提供便捷方法：`openDrawer()`, `closeDrawer()`, `openMenu()`
- 所有 setter 通过 `useCallback` 包裹

### useSelection()
- `captureSelection()` — `onMouseUp` 回调，捕获用户选中文本
- 构造 TextQuoteSelector（exact/prefix/suffix），使用 Range API
- 降级策略：Range API 失败时用 `indexOf` 查找

### useHighlights(comments)
- 使用 CSS Custom Highlight API（`CSS.highlights`）
- `findTextRange()` — TextQuoteSelector → DOM Range 定位，支持 prefix/suffix 消歧
- 降级：API 不可用时静默跳过

### useKeyboard(opts)
- Escape 键优先级：menu > selectionMenu > drawer > outline > clearSelection
- 仅绑定 Escape，其他快捷键在各组件内处理

## 子组件

位置：`app/a/[id]/components/`

| 组件 | 职责 |
|------|------|
| `CommentCard.tsx` | 单条评论卡片 |
| `CommentFilters.tsx` | 评论过滤（open/resolved/all） |
| `CommentInput.tsx` | 评论输入框 |
| `CommentThread.tsx` | 评论线程 |
| `ContextMenu.tsx` | 右键菜单（inspect/comment/copy） |
| `OutlineDrawer.tsx` | 文档大纲侧栏 |
| `ReviewPanel.tsx` | 评论面板容器 |
| `AgentHandoff.tsx` | Agent 交接 |
| `BlockInspector.tsx` | Block 属性查看器 |
| `SelectionMenu.tsx` | 文本选择浮动按钮 |

## 样式约定

- **全局 CSS**: `app/style.css`，`@import "@renderkit/design/index.css"` 引入 design tokens
- **CSS 变量**: 全部使用 `--rk-*` 前缀（来自 `@renderkit/design`）
- **BEM 风格**: `.rk-comment-panel__header`, `.rk-comment-card__anchor-text`
- **状态类**: `.is-active`, `.is-open`, `.is-closed`
- **data 属性驱动**: `[data-rk-theme]`, `[data-rk-surface]`, `[data-rk-anchor]`
- **静态资源**: `public/rk/` 下的 CSS 文件通过 `<link>` 加载
- **无 Tailwind / CSS Modules / styled-components**
