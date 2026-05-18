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


## Session 2: v2 闭环可用化：anchor rebind + CLI agent 通道 + CSS 拆分（5-worker 并发）

**Date**: 2026-05-18
**Task**: v2 闭环可用化：anchor rebind + CLI agent 通道 + CSS 拆分（5-worker 并发）
**Package**: web
**Branch**: `master`

### Summary

5 个 worker 并发垂直切片：A1(html-processor dedup) / A3(frontend selector capture) / B1(CLI 4 新命令 + 2 push flag) / C(style.css 2965→18 行 + design README + chrome deprecated) / AB2(store.ts rebind + getFeedback thread folding + isTest/author API + 6 新 tests)。foundation 先清 DB + 重写 schema。79/79 tests pass。pw geometry 验证三个页面布局无回归（list/artifact/compare）。端到端 CLI 闭环 reply→address→feedback waitingFor='human' 跑通。

### Main Changes

## 背景

v1（commits a88319a + 2c0fb19）UX 重构后 dogfood 发现闭环还是断的：
1. anchor 失配机制不完整（agent 改一段文字大小写就 orphan）
2. CLI 只有 push/feedback，不能 reply/address/resolve（agent 用不上 thread + 状态机）
3. design 包 chrome.css 仍被 import，下次有人写新组件还会撞

## 决策

- 用户决策：不向后兼容、清数据库（不做 migration）、CSS 拆 5 子文件、rk reply 默认 author=agent、rebound_at 加字段但 UI 不展示
- 执行：垂直切片 + 多智能体并发，5 个 worker 同时工作，文件零重叠
- 验收：跳 dogfood，pw geometry 看布局

## 5 个 workstream

| Slice | 文件 | 完成情况 |
|---|---|---|
| **Foundation** | `lib/db.ts` | 我自己做，新写干净 schema，无 migration |
| **A1** worker | `lib/html-processor.ts` + `tests/anchor-dedup.test.ts` | ✓ 4/4 测试过 |
| **A3** worker | `app/a/[id]/HtmlArtifactView.tsx` | ✓ buildSelector + 集成 submitDraft |
| **B1** worker | `packages/cli/bin/renderkit.mjs` | ✓ 4 新 command + 2 push flag |
| **C** worker | `app/style/*` + `packages/design/{chrome.css,README.md}` | ✓ 2965→18 行 |
| **AB2** worker | `lib/store.ts` + API routes + tests | ✓（context 在写 summary 时爆，但代码全写完了） |

## 关键代码

### anchor rebind 三段命中策略（store.ts pushHTML）

```ts
// 1. exact textPreview match
let cand = byExact.get(exact.slice(0, 200)) ?? [];
if (cand.length === 1) { rebind; continue; }

// 2. normalized match (lowercase + 折叠空白 + 去标点 + 去符号)
if (cand.length === 0) {
  const nk = normalizeText(exact.slice(0, 200));
  cand = nk ? (byNormalized.get(nk) ?? []) : [];
}
if (cand.length === 1) { rebind; continue; }

// 3. 多候选 → 前后兄弟节点 textPreview 与 selector.prefix/suffix 评分消歧
if (cand.length > 1) {
  const scored = cand.map(anchorId => {
    const ix = anchors.findIndex(a => a.anchor === anchorId);
    const prevText = anchors[ix - 1]?.textPreview ?? '';
    const nextText = anchors[ix + 1]?.textPreview ?? '';
    let score = 0;
    if (prefixHint && prevText.endsWith(prefixHint)) score += 2;
    if (suffixHint && nextText.startsWith(suffixHint)) score += 2;
    return { anchorId, score };
  });
  if (scored[0].score > 0 && (scored.length === 1 || scored[0].score > scored[1].score)) {
    rebind(scored[0].anchorId); continue;
  }
}
markOrphan();  // 全部失败
```

### getFeedback 输出形状（thread 折叠 + waitingFor）

```json
{
  "comments": [{
    "id": "cmt_xxx",
    "author": "human",
    "status": "addressed",
    "selector": {...},
    "replies": [
      { "id": "cmt_yyy", "author": "agent", "text": "已修复" }
    ],
    "waitingFor": "human"   // 最后一条是 agent → 等人验收
  }]
}
```

agent 用法：`waitingFor='agent'` 的处理，`waitingFor='human'` 的跳过。

### CLI 新命令

```
rk push <file> --test --author agent     # 新 flag
rk reply <file> <commentId> <text>       # 默认 author=agent
rk address <file> <commentId>            # 标待验收
rk resolve <file> <commentId>            # 解决
rk reopen <file> <commentId>             # 重开
```

### CSS 拆分

```
apps/web/app/style.css           18 行（只 import）
apps/web/app/style/
  base.css         1496 行  reset + standalone + .rk-html-body typography
  list.css          724 行  studio shell + topbar + sidebar + main + card grid + toast
  doc-app.css       687 行  artifact view: .rk-doc-app + gutter + thread + rev menu
  compare.css        60 行  .rk-compare-*
  deleted-state.css  33 行  .rk-deleted-*
```

`packages/design/README.md` 新增，明确每个 CSS 文件 audience；chrome.css 顶部加 DEPRECATED 注释。

## 端到端验证（curl + pw）

闭环 dogfood（跳过完整流程，按用户决策只看核心点）：

1. `rk push examples/cases/content-base.html --author agent` → ok
2. 人 POST 评论带 selector → ok
3. `rk reply` 加 agent 回复 → ok（DB 中 parent_id 正确、author='agent'）
4. `rk address` 标 addressed → ok（status='addressed', addressedBy='agent', addressedAt 非 null）
5. `rk feedback` 返回 thread + replies[0].author='agent' + **waitingFor='human'** ✓

pw geometry 验证：

| 页 | 关键指标 |
|---|---|
| list 1200×712 | topbar 100% / sidebar 220 / main 980 / 3 列卡 303×90 |
| artifact 1200×712 | root pos=fixed padding=0 / htmlBody 97%w / panel 默认收起 1px |
| compare 1200×664 | 左右各 600×1627 对称 |

## 测试

`npm test`: 79/79 pass（75 老 + 4 anchor-dedup 新 + 6 store-routes 新 case，含 thread/waitingFor/rebind 4 case）

## 教训

1. **垂直切片设计要看文件交集**。A2/B2/B3 都改 store.ts 应该合并成一个 worker（AB2），不然 merge 必爆。我合并了，但是 context window 也跟着爆——下次更激进切分（A2 / B2 / B3 独立但串行），或先让 worker 写 summary 再写代码（防代码写完 summary 没写）。
2. **worker 写完代码再爆 summary 不致命**。git diff 还在，verify 即可。要点：从 git 看输出而非 worker 的 summary 文件。
3. **package.json 用 edit 工具时小心多行**。一次 edit 替换跨行操作把后续多条 script value 全删了。教训：JSON 文件直接 python json.tool 全文写。
4. **pw geometry audit 是 CSS 重构的硬通货**。拆 5 个子文件最大风险是 cascade 错位，pw 直接 box 数字对比比目视准 100 倍。
5. **多智能体并发的真实效率**：5 个 worker 并发 5-8 分钟做完一天半的工作量。前提：每个 worker 任务自包含、文件零重叠、有验收 checklist。

## 不在本次范围

- anchor rebind UI 提示（"已自动 rebind, [确认/撤回]"）
- chrome.css 真删除（本次只 deprecate）
- render error source location
- WC re-render 架构性重写
- design 包物理拆 render/app 两包


### Git Commits

| Hash | Message |
|------|---------|
| `1b10a88` | (see git log) |
| `d2a786e` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete
