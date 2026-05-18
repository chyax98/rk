# Journal - miaolong001 (Part 1)

> AI development session journal
> Started: 2026-05-17

---



## Session 1: web 应用交互重构 v1：list/artifact/compare + 容器尺寸修复

**Date**: 2026-05-18
**Task**: web 应用交互重构 v1：list/artifact/compare + 容器尺寸修复
**Package**: web
**Branch**: `master`

### Summary

RenderKit web app UX 全面重构（不兼容旧逻辑）。fix 卡片点击死区 bug。新增搜索/排序/视图分区/批量/软删除/Toast Undo/时间分组；评论 thread+状态机+gutter rail；compare 模式合并到 artifact 页 + anchor-diff 染色；删 /compare 路由；WC re-render 用 React.memo 根治；修与 design 包 CSS 命名空间撞车导致的容器尺寸失控（38%→97% 利用率）。75/75 tests pass。

### Main Changes

## 背景

Web app (`apps/web`) 当前是 RenderKit 闭环 (agent 写 → push → 人评 → agent 改) 的瓶颈：
- 列表页 267 个 artifact（其中 80%+ `rk-test-*` 测试残留），无搜索、无排序、无批量、无测试隔离
- **bug**：卡片点击有死区，只有夹缝才能命中
- 评审页加评论入口仅 hover 浮现；打开已有评论靠 6px 隐形触发带
- 评论模型只有 `text + status: open|resolved`，无 thread / addressed 状态
- `/compare/:id` 独立页，无 diff 染色，断 review 工作流
- WC ResizeObserver 闪烁靠 `ref` 直接操作 DOM 抑制（HtmlArtifactView 注释承认是补丁）

## 决策

- **不要向后兼容**，整体重构（用户明确）
- 路由优化：`/?view=&sort=&q=&tag=` + `/a/[id]?rev=&compare=&panel=`，删除 `/compare/[id]`
- 测试 artifact 按 title 前缀 `rk-test-` 自动隔离到独立 view
- 软删除 + Toast Undo 替代浏览器 confirm 弹窗
- 评论模型升级 thread + 状态机：`open → addressed → resolved` + reopen，author 字段（human/agent）
- artifact 页 gutter rail 替代 6px 隐形触发带
- compare 模式合并到 artifact 页（query param），接 `lib/anchor-diff.ts` 做染色
- WC 闪烁根治：把 `<div dangerouslySetInnerHTML>` 抽 `React.memo`，依赖只有 html string

## 关键代码

### DB schema 扩展 (`apps/web/lib/db.ts`)

```sql
-- artifacts
ALTER TABLE artifacts ADD COLUMN is_test    INTEGER DEFAULT 0;
ALTER TABLE artifacts ADD COLUMN deleted_at TEXT;
-- 回填存量
UPDATE artifacts SET is_test = 1 WHERE title LIKE 'rk-test-%';

-- comments
ALTER TABLE comments ADD COLUMN parent_id    TEXT;
ALTER TABLE comments ADD COLUMN addressed_at TEXT;
ALTER TABLE comments ADD COLUMN addressed_by TEXT;
ALTER TABLE comments ADD COLUMN author       TEXT NOT NULL DEFAULT 'human';
```

### store 新 API (`apps/web/lib/store.ts`)

- `listArtifacts({view, sort, q, tag})` —— 替代无参数版
- `getArtifactViewCounts()` —— sidebar tabs 计数
- `softDeleteArtifact / restoreArtifact / purgeArtifact` —— 替代 `deleteArtifact`
- `updateCommentStatus(artifactId, commentId, nextStatus, actor)` —— 带 transition matrix 校验

### 卡片点击 bug 根因

旧代码：
```tsx
<div className="rk-card">
  <a className="rk-card-overlay" />       // z-index:0
  <div className="rk-card-header z-1">…   // z-index:1 → 盖住 overlay
```

修复：整张卡是 `<a>`，互动子元素 `e.stopPropagation()`：
```tsx
<a href={`/a/${a.id}`} className="rk-card">
  <div className="rk-card-body">…</div>
  <div className="rk-card-actions" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
    <button>归档</button><button>删除</button>
  </div>
</a>
```

### 容器尺寸控制策略（关键教训）

第一次提交后发现 `.rk-artifact` 类名和 `packages/design/src/chrome.css` 撞车，被注入 `max-width:1320px; padding:32px 24px`，根容器被锁死、内容只用 38% 视口宽度。

**修复方案**：
1. 整个命名空间 rename `.rk-artifact*` → `.rk-doc-*`，避让 design 包
2. 根节点物理锁视口：
   ```css
   .rk-doc-app {
     position: fixed; inset: 0;
     width: 100vw; height: 100vh;
     margin: 0; padding: 0; max-width: none;
     display: grid;
     grid-template-rows: 48px 1fr;
     grid-template-columns: 1fr var(--rk-panel-w);
   }
   ```
3. `.rk-html-body` 在 standalone CLI 模式有 `max-width:780px`，review 应用里需覆写：
   ```css
   .rk-doc-frame .rk-html-body {
     max-width: none;
     padding: 28px clamp(24px, 4vw, 72px) 96px;
   }
   .rk-doc-frame .rk-html-body > * { max-width: 1280px; margin: auto; }
   /* 宽组件突破 cap */
   .rk-doc-frame .rk-html-body > rk-chart,
   .rk-doc-frame .rk-html-body > rk-table,
   .rk-doc-frame .rk-html-body > rk-grid,
   /* … */ { max-width: none; }
   ```

实测 38% → 97% 利用率。

## 验证

- `npm test` 75/75 通过（更新了 `tests/store-routes.test.ts` 对新 API）
- 端到端 curl smoke：search / view filter / soft delete / restore / thread reply / status transition (open→addressed→resolved) / illegal transition 拒绝 全部通过
- `pw code` 拉 DOM 几何审计：
  - 列表页 1200×712：topbar 1200×52 / sidebar 220×660 / 3 列卡 / 21 张占满主区
  - artifact 页 1200×712：root 100% / topbar 100% / htmlBody 97%（修复前 38%）/ 评论面板默认收起（1px）
- 卡片点击实测：title / time / revBadge 三个原死区全部命中 `/a/:id`

## 教训

1. **CSS 命名空间撞车防不胜防**。`.rk-artifact` 这种通用名 design 包提前占了。命名时优先具体语义（`.rk-doc-app` / `.rk-doc-frame`）而非泛指（`.rk-artifact`）。
2. **standalone vs embedded 双重消费**。同一份 `.rk-html-body` 样式既给 CLI 单文件渲染用又给 review 应用嵌入用，标准是不一样的。应该在嵌入容器作用域里覆写，不要去改根样式。
3. **`pw code` 是验收 UI 的硬通货**。逐个截图慢，直接拉 `getBoundingClientRect` + `getComputedStyle` 比目视准 100 倍：`98% 利用率` 是数字事实，"看起来宽了" 是主观。
4. **执行入口签名**：`pw code` 用法是把代码作为 `__fn__` 函数体，外部注入 `page: Playwright.Page`。直接 `document.xxx` 会 ReferenceError；要写 `async function __fn__() { return await page.evaluate(() => …) }`。
5. **优先 ref，不要 stopPropagation 海**。但卡片点击场景就是用 `<a>` 包整张卡 + 互动元素 stopPropagation —— 比绝对定位 overlay + z-index 战争干净。
6. **PRD 先写、再动手**：本次先出 PRD (`apps/web/docs/PRD-ux-v1.md`)，再实现。Phase 划分 (DB → list → artifact → compare → cleanup) 让 review 不会迷失。

## 范围外（明确不做）

- 多人协作 / 登录 / 权限（author 字段已加但 UI 不展示）
- 移动端深度优化（只保 narrow screen fallback）
- 实时推送 SSE / WebSocket
- 渲染层 `<rk-*>` WC、theme、html-processor 改动
- 软删除 7 天清理后台任务


### Git Commits

| Hash | Message |
|------|---------|
| `a88319a` | (see git log) |
| `2c0fb19` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete
