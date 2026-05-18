# PRD: RenderKit Web 应用交互重构 v1

> 基于 2026-05-18 对 `apps/web` 的 UX 诊断整理。源会话的诊断结论是本 PRD 的事实依据。

## 问题陈述

RenderKit 的核心闭环是 "Agent 写 HTML → push → 人评论 → Agent 读评论 → 改 → push"。当前 Web 端 (`apps/web`) 三个关键页面都在这条闭环上，但每个页面都有阻塞用户完成评审任务的交互缺陷：

- **列表页 (`app/page.tsx`)**：实际数据是 267 个 artifact，其中 80%+ 是 `rk-test-*` 命名的测试残留；无搜索、无排序、无批量操作、无测试隔离。用户找一个文档要靠肉眼扫卡片网格。
- **评审页 (`app/a/[id]/HtmlArtifactView.tsx`)**：加评论入口仅在 hover 时浮现；打开已有评论要点击 anchor 右侧 `e.clientX >= rect.right - 6` 的 6px 隐形触发带；评论模型只有 `text + status: open|resolved`，无 thread、无 author、无"已修复待验收"状态，agent 和人无法在同一条评论上来回；评论面板 `position: fixed` 覆盖文档，与正文争空间。
- **对比页 (`app/compare/[id]/page.tsx`)**：左右两栏独立滚动、无 anchor 级 diff 染色、不能在对比视图里评论。仓库已有 `lib/anchor-diff.ts` 但没有接进 UI。

结果：当前 Web 端能演示功能闭环，但不能支撑"agent 高频推送 + 人快速 review"的实际工作流。这是 RenderKit 项目当前阶段最直接的瓶颈。

## 目标

### 本次解决
1. 在列表页让用户能**在 100ms 内**定位到指定 artifact（搜索 + 排序 + 测试隔离）。
2. 在评审页让"加评论"和"打开已有评论"两个动作有**显式、可见、可键盘触发**的入口，不再依赖隐形触发带。
3. 把单条评论模型升级为 **thread + 状态机**，让 agent 和人能在同一锚点上多轮对话。
4. 把对比、版本切换、评论这三种状态合并到 artifact 页内，避免在 `/a/:id` 和 `/compare/:id` 之间来回跳。
5. 修掉当前为压住 Web Component ResizeObserver 问题而写的 `ref` 直接操作 DOM 的 hack（`HtmlArtifactView.tsx` 注释明确承认这是补丁），从结构上解决 React state 更新触发 WC 闪烁的问题。

### 本次不解决
- 多人协作 / 登录 / 权限：当前 `Comment` schema 无 author 字段，本次不引入身份。
- 移动端完整体验：以桌面 ≥ 1024px 为主，触屏只保证不被 hover 依赖完全锁死。
- 国际化：保持中文 UI。
- 渲染层（`<rk-*>` Web Components 本身）改动：本次只动 web app 外壳。

## 解决方案

### 用户可感知行为

**列表页**

- 顶栏出现搜索框（`⌘K` 或 `/` 聚焦），支持 title / tag 模糊匹配，输入即筛。
- 列表默认按更新时间倒序，可切换"标题字典序"。
- `rk-test-*` 命名的 artifact 默认进入"测试沙盒"分区，不出现在主列表。
- 卡片支持多选 checkbox + 顶部 bulk action bar（归档 / 删除 / 加 tag）。
- 删除走软删除 + Toast Undo（5 秒窗口），不再用浏览器 `confirm()`。
- 时间显示按"今天 / 昨天 / 本周 / 更早"分组，组内显示精确 `HH:mm`，不再让批量推送的项全部坍缩成"刚刚"。
- 移除外露的 `art_xxxxxxxx` ID 前缀，移到 hover tooltip。

**评审页**

- 在文档左侧增加 24px gutter，凡是有评论的 anchor 在 gutter 显示一条彩色短杠 + 评论数 badge；hover gutter 高亮整块、click 打开 thread。**6px 隐形触发带删除**。
- 加评论入口有两种显式触发：① hover anchor 后浮现的"+"按钮（保留现有），② 选中正文文本后浮现 "评论选区" 按钮。
- 评论面板从浮层覆盖改为**分栏 layout**：打开时文档主区收缩，关闭时还原。窄屏（< 1024px）退回浮层。
- 评论卡升级为 thread：可回复、可标记为 "已修复待验收 (addressed)"、可 "解决 (resolved)"、可 "重新打开 (reopened)"。
- 顶栏出现版本切换器（已有的 `rk-version-tab` 升级），右侧支持 "对比模式"开关：开启后主区变左右双栏，evolution 通过 `lib/anchor-diff.ts` 染色（新增 / 修改 / 删除）。
- 顶栏出现渲染错误徽标：当前 `rk-render-error` 事件只静默 POST 到 `/api/artifacts/[id]/render-errors`，用户看不到；改为可见徽标，点开列出失败的组件和错误信息。
- 键盘：`j/k` 跳上下评论，`r` 解决，`R` 重新打开，`c` 新建评论，`/` 聚焦搜索，`Esc` 关闭面板。

**对比相关**

- `/compare/:id` 退化为 artifact 页的一种模式（保留路由作为 deep link），不再是独立页。
- 左右双栏支持同步滚动（基于 anchor 对齐）。

### 系统结果

- `Comment` schema 增字段：`parentId: string | null`、`status: 'open' | 'addressed' | 'resolved'`、`author?: 'human' | 'agent'`（agent 字段只是占位，本次不强制写入）。
- `listArtifacts` 增 query 参数：`q`, `sort`, `includeTest`，落到 SQL 层而非内存过滤。
- artifact 入库时识别 `rk-test-*` 前缀，写入 `is_test` 列；列表默认 `is_test = 0`。
- 删除从硬删除（`DELETE /api/artifacts/[id]`）改为 `PATCH { deletedAt }`，保留 7 天后由后台任务真正清除（清除任务本次不实现，先打 tombstone）。
- 渲染错误从只写日志改为列表 API：`GET /api/artifacts/[id]/render-errors` 返回当前最新版本的错误集合。
- `HtmlArtifactView` 的文档子树用 `React.memo` + 稳定 props 隔离，使评论 state 变化不再触发 WC re-mount，移除现有 `addBtnRef.current.style.display` 等 DOM hack。

## 用户故事

1. 我在列表页输入 "report"，立刻看到 title 含 report 的 artifact，不必滚动。
2. 我在列表页按 ⌘K 聚焦搜索框，输 tag `#engineering`，回车后只看到该 tag 下的 artifact。
3. 我作为开发者跑了一轮 e2e 测试，产生了几十个 `rk-test-*` artifact，回到列表页主区不被这些测试条目污染，但仍可切换到"测试沙盒"看到。
4. 我选中 5 个过时 artifact，点 bulk delete，看到 Toast "已删除 5 项 [撤销]"，点撤销后全部恢复。
5. 我打开一个 artifact，看到文档左侧 gutter 上 3 条彩色短杠，对应 3 个有评论的位置。点其中一条，右侧评论面板打开，文档区滚到对应锚点，命中率 100%，不需要再去找 6px 隐形触发带。
6. 我选中文档里一段话，浮出 "评论选区" 按钮，点击后右侧出现新评论输入框，焦点已在 textarea。
7. 我对一条评论回复 "请改下单位"，agent 推送新版本后把这条评论状态置为 `addressed`，我在面板上看到这条评论变成"待验收"，验收后点 `r` 解决。
8. 我打开 v3 后想知道相比 v2 改了什么：在顶栏点 "对比"，主区变成左右双栏，新增的 anchor 染绿、修改的染橙、删除的染红，评论自动跟随到 v3 仍然存在的 anchor 上。
9. 我推送的 artifact 里有个 `<rk-chart>` 配置错了，渲染失败：顶栏出现红色徽标 "1 个组件渲染失败"，点开看到 `engine=echarts, message=..., anchor=...`，能定位修复。
10. 我在评审页快速 review 多条评论：`j` 跳下一条，`r` 解决，`j` 再下一条，全程不动鼠标。
11. （边界）我在窄屏（< 1024px）打开评审页，分栏不可行，评论面板退回浮层模式，gutter 锚点条仍然可点。
12. （边界）我打开一个被软删除的 artifact 链接（7 天内），看到 "此文档已删除 [恢复]" 页面，而不是 404。
13. （边界）我把当前评论面板打开着切换到对比模式，评论保持显示，但跨版本不存在的 anchor 上的评论显示为 "原锚点已不存在" 灰态。

## 实现决策

### 改动模块

- `apps/web/app/page.tsx`：搜索 / 排序 / 视图切换 / 多选 / 时间分组都在此页（或拆出 client 子组件）。
- `apps/web/app/a/[id]/HtmlArtifactView.tsx`：评审页的所有交互重构。本次最大单体改动。
- `apps/web/app/compare/[id]/page.tsx`：退化为 artifact 页的 deep link，路由保留但内部 redirect 或 server-render 一个壳，主要逻辑搬走。
- `apps/web/lib/store.ts`：`listArtifacts` 加 query 参数、`Comment` schema 增字段、软删除字段。
- `apps/web/lib/db.ts`：schema migration（新列）。
- `apps/web/lib/anchor-diff.ts`：接入对比模式的染色逻辑。
- `apps/web/app/api/artifacts/*`：query 参数、软删除、`render-errors` 的 GET。
- `apps/web/app/ArtifactActions.tsx`：批量 action 抽到列表层级，行内 action 简化。

### 接口与数据流变化

- **DB schema**：
  - `artifacts` 增 `is_test INTEGER DEFAULT 0`、`deleted_at INTEGER NULL`。
  - `comments` 增 `parent_id TEXT NULL`、`addressed_at INTEGER NULL`、`author TEXT NULL`；`status` 取值扩为 `open | addressed | resolved`。
  - 旧数据迁移：`status = 'open'` 保持；现有 hard-delete 操作的 artifact 不可恢复（迁移前数据无 tombstone）。
- **API**：
  - `GET /api/artifacts?q=&sort=&includeTest=&includeDeleted=` 取代当前无参数版本。
  - `POST /api/artifacts/[id]/comments`：body 增 `parentId?`。
  - `PATCH /api/artifacts/[id]/comments/[commentId]`：支持 `status: 'addressed' | 'resolved' | 'open'` 切换（当前只支持 resolved）。
  - `DELETE /api/artifacts/[id]` 变成软删除（写 `deleted_at`），新增 `POST /api/artifacts/[id]/restore`。
  - `GET /api/artifacts/[id]/render-errors`（list 形式）补齐，现有 POST 保持。
- **状态机**（comment）：

  ```
  open ─[人/agent 标记]→ addressed ─[人验收]→ resolved
   ↑                                                │
   └─────────[人 reopen]──────────────────────────┘
  ```

- **WC re-render**：把 `<div dangerouslySetInnerHTML={...}>` 抽成 `memo(BodyHtml)`，依赖只有 `displayedHtml`，所有评论 / 面板 state 提升到 sibling 组件，禁止穿透到 body 子树。验证标准：评论 add/edit/delete 时，body 不发生 DOM mutation 也不重跑 WC 的 `connectedCallback`。

### 已明确的约束

- 单用户、本地优先、SQLite，无网络依赖。
- 文档 HTML 由 server 端预处理后注入 `data-rk-anchor`（`html-processor.ts`），评论 anchor 与之绑定，本次不动这层。
- WC 组件本身不允许因为壳层 re-render 而 unmount，这是硬约束。
- 不引入新的 UI 框架 / 状态库；保持现有 React 19 + 自写 CSS。
- 测试 artifact 判定走 title 前缀 `rk-test-`（已有事实约定），不要求改 CLI。

### 待确认

- `Comment.author` 字段是否本次就写入。当前没有身份系统，默认值用什么（`'human'`？`'unknown'`？）。倾向：本次只加列、不强制写、UI 不展示。
- 软删除保留期 7 天是否合适。倾向：先实现 tombstone，清理任务延后。
- 测试 artifact 隔离的判定来源：仅靠 title 前缀，还是 CLI push 时显式带 flag。倾向：先按前缀，后续 CLI 加 flag 时切换。
- 对比模式下评论的版本归属语义：评论是属于某一版本，还是属于"逻辑 anchor"跨版本存在。倾向：评论绑 anchor，跨版本只要 anchor 还在就跟随，消失则保留显示但标灰。
- 键盘快捷键命名空间与现有 WC 内部快捷键（如有）是否冲突。需要在 artifact 页实际跑一遍检查。

## 验收标准

1. 列表页输入任意关键字，结果在一次 server roundtrip 内返回（无客户端二次过滤），且默认隐藏 `rk-test-*`。
2. 列表页删除 N 个 artifact，Toast 出现 "已删除 N 项 [撤销]"，5 秒内点撤销可恢复全部；超时后再次访问 `/a/:id` 返回"已删除"占位页（非 404）。
3. 评审页 `HtmlArtifactView.tsx` 中任何 React state 变化都不触发文档 body 子树的 DOM mutation：可用 `MutationObserver` 在测试里断言。
4. 评审页 anchor gutter 上每个有评论的 anchor 都能稳定 click 命中（实测 5 次连续点击 0 失败）。
5. 评论支持 reply：在已有评论上回复，返回的 `comment.parentId` 等于父评论 id；面板按 thread 折叠。
6. 评论可从 `open → addressed → resolved` 切换，也可 `resolved → open` reopen；状态切换走 PATCH，乐观更新失败时回滚。
7. 对比模式下，已存在 `lib/anchor-diff.ts` 的输出能映射到 UI 上的三色染色（新增 / 修改 / 删除）。
8. 渲染错误徽标的数字 = `GET /api/artifacts/[id]/render-errors` 返回数组长度。
9. 全部上述功能在 `pnpm dev`（端口 3737）下，针对当前 267 个 artifact 的数据库不报错、不掉性能（首屏 < 1s）。

## 测试与验证策略

### 真实链路验证（必跑）

- 在当前 `apps/web/.data` 的 267 项数据库上启动 dev server，跑完上述用户故事 1–10。
- 用 `pwcli` 或手动操作，覆盖：搜索 → 命中 → 进入 artifact → 加评论 → 回复 → 标记 addressed → push 新版本（CLI 侧）→ 状态保留 → 验收 → 解决。
- 对比模式：选两个已有 revision，验证 `anchor-diff.ts` 输出与 UI 染色一致。
- WC 闪烁回归：在 artifact 页对一个包含 `<rk-chart>` 的 artifact 反复 open/close 评论面板、add/edit 评论，断言图表不重新发起 ECharts init。

### 局部验证

- `lib/store.ts` 的 `listArtifacts` 新参数：单元测试覆盖 `q`、`sort`、`includeTest`、`includeDeleted` 组合。
- DB migration：在空库和有数据库两种情况下都能升级。
- Comment 状态机：单元测试覆盖所有合法迁移 + 拒绝非法迁移。
- 软删除：删除后 `getHtmlArtifact` 行为、`/a/:id` 页行为、restore 后行为。

### 回归

- 现有 `rk push / rk feedback / rk patch / rk append` CLI 命令不受影响（API contract 兼容）。
- `/gallery` 页不动，保证不破坏。

## 范围外

- 多人协作、登录、权限、author 真正写入。
- 评论 @mention、附件、富文本。
- 移动端深度优化（只保证 fallback 不死）。
- 实时推送（SSE / WebSocket）：本次仍是手动刷新或 `router.refresh()`。
- 渲染层 (`<rk-*>` WC、theme、html-processor) 改动。
- OG image 动态生成、URL slug 美化、字体本地化。
- 系统暗黑模式自适应。
- 软删除的真正清理后台任务。

## 风险与待确认项

### 风险

1. **WC re-render 结构性修复可能影响范围超预期**。当前 ref hack 是绕了 React，根治意味着重排状态边界，可能引出新 bug。**缓解**：先加 `MutationObserver` 测试夯实回归基线，再做迁移。
2. **DB schema migration on 267 项现网数据**。如果 migration 写错，本地数据丢。**缓解**：迁移前自动备份 `.data/` 到 `.data.bak-{ts}/`。
3. **键盘快捷键冲突**：`j/k/r` 这类单键容易和浏览器 / 用户输入冲突。**缓解**：仅在 panel 关闭且 focus 不在 textarea/input 时生效。
4. **对比模式 + 评论 + 版本切换三态组合**会让 `HtmlArtifactView` 复杂度爆炸。**缓解**：抽成 reducer，单测覆盖所有合法状态迁移。
5. **`rk-test-*` 前缀判定可能误杀正常文档**（如果用户真的命名了一个叫 `rk-test-foo` 的文档）。**缓解**：在测试沙盒分区里保留 "移回主列表" 操作。

### 待确认

- 见 "实现决策 → 待确认" 五条。
- 是否需要在本次 PRD 里同步给 CLI (`renderkit` 包) 加 `--test` flag。倾向：不需要，本次只动 web app。
- 列表页是否需要"按 tag 分组视图"作为额外排序模式。倾向：不做，过度设计。
- artifact 页对比模式下，新增的 anchor 上是否允许加评论（评论会被绑定到只在新版存在的 anchor）。倾向：允许，符合自然预期。
