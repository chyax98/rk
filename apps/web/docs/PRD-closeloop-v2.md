# PRD: RenderKit 闭环可用化 v2 — anchor rebind + CLI agent 通道 + design 包清理

> 基于 2026-05-18 v1 重构（commits `a88319a`, `2c0fb19`）之后的代码现状。三个 workstream（A/B/C）独立可并行，但合并完成才能让 RenderKit 的"agent 写 → 人评 → agent 改"闭环第一次真正可用。

## 问题陈述

v1 把 web app 的 UX 重构清楚了（列表搜索、卡片点击修复、评论 thread + 状态机、compare 合并、容器尺寸修复），但 dogfood 一遍会发现闭环还是断的，原因有三个：

1. **anchor 失配机制不完整**。`processHTML` 把 anchor ID 算成 `${tag}-${slug(text)}`，agent 把 "q2" 改成 "Q2" 就换 anchor，所有评论瞬间 orphan。`Comment.selector` 字段（`TextQuoteSelector`）schema 已留，但 `HtmlArtifactView.tsx` 创建评论时没传，所以现网评论 selector 全是 NULL。`anchor-diff.ts` 也只做纯 set diff，不做 fuzzy rebind。
2. **agent 这一侧是哑的**。CLI 只能 `push / feedback`，**不能 reply / address / resolve**。v1 加的 `author` 字段、`addressed` 状态、thread 模型在 CLI 没有任何入口，所以现网数据库里 author 永远是 human，thread 永远只有一层。`rk feedback` 也返回平面 comment 列表，agent 看不到 "这是我之前回过的"，每次都会重读自己的回复。
3. **CSS 命名空间撞车的根因没解**。`packages/design/src/chrome.css` 的 `.rk-artifact`（24 条规则的旧 web app shell）已被 v1 的 `.rk-doc-app` 替代，但仍然 import 进 web app，下次有人再写新组件还会撞。design 包没有 README，也没明确"哪个 CSS 给谁用"。

结果：v1 UX 漂亮，但 review 一改文档评论就丢、agent 不能闭环回复、技术债仍在累积。

## 目标

### 本次解决

1. agent 改文档时，**只要原评论锚定的那段文本仍可识别（哪怕大小写、空格、轻微改写不同），评论自动 rebind 到新 anchor**，不再 orphan。
2. agent 通过 CLI 能完成完整闭环：`push → feedback → reply → address → resolve`，每条评论的 author 字段真实反映来源（human / agent），`rk feedback` 输出按 thread 折叠并明确"等谁动"。
3. `packages/design/src/chrome.css` 不再被 web app 误引，每个 design CSS 文件的 audience 在 README 里写明，web app 的 `style.css` 拆成可维护的多文件。

### 本次不解决

- 不引入登录 / 多人 / 权限。`author` 字段仍只区分 human / agent 两值。
- 不改 anchor ID 生成算法本身（保留 `${tag}-${slug(text)}`），只在失配时多走一层 selector fuzzy rebind。
- 不动 `packages/design/blocks.css` / `themes.css` / `tokens.css` 的内容，只调用方决策和 chrome.css 状态。
- 不补 render error 的 source location（agent 仍只拿到 message + anchor）。
- 不上 anchor rebind 的 UI 提示（"评论被自动 rebind 了, [确认/撤回]"），第一版只在 schema 留 `rebound_at` 字段位置，UI 不显示。

## 解决方案

### Workstream A · anchor fuzzy rebinding

**用户可感知行为**：

- 我在某段文字旁写了评论"单位错了"。agent 把 "q2 revenue" 改成 "Q2 Revenue" 后重新 push。评论仍然挂在那段文字旁，状态保持 `open`，没变成 orphan。
- agent 整段重写但语义相近（前后兄弟节点文本几乎不变），评论也能 rebind 上。
- agent 把那段彻底删了，评论才真正 orphan。
- 同一文档里出现两个 `<h2>结论</h2>`，各自的 anchor 不会碰撞，评论挂对块。

**系统结果**：

- 创建评论时，前端会把 `TextQuoteSelector { exact, prefix, suffix }` 一并 POST，落到 `comments.selector` 列。
- `pushHTML` 在标 orphan 之前多一步：用 `selector.exact` 在新版 anchor 的 `textPreview` 里精确 / 模糊 / prefix-suffix 消歧，能找到唯一目标就 rebind（更新 `comments.anchor`）。
- `processHTML` 的 `generateAnchorId` 加 dedup：相同 slug 第二次出现时追加 `-2`、`-3`，避免碰撞。

### Workstream B · CLI agent 闭环通道

**用户可感知行为**：

- agent 推送时可以显式标记：`rk push doc.html --test`（隔离到测试沙盒）/`rk push doc.html --author agent`（标记本次推送来源）。
- agent 看到人评论后可以直接回复：`rk reply doc.html cmt_xxx "已修复，单位改为 USD"`。回复在 web 里显示为 thread 的二级评论，作者标"🤖"。
- agent 改完代码可以打"待验收"标：`rk address doc.html cmt_xxx`。人在 web 里看到这条评论状态从 `open` 变成 `addressed`，对应 thread 左边的状态条变蓝。
- agent 拿到 `rk feedback` 返回时，每个 thread 自带 `replies[]` 和 `waitingFor: 'human' | 'agent'` 字段，能直接判断"我之前回过的、人没动 → 跳过"。

**系统结果**：

- CLI 新增 4 个 command：`reply / address / resolve / reopen`，都接受 `<file> <commentId> [text]`，从 `.renderkit.lock` 反查 `artifactId`，直接调现有 API（v1 已支持 author / parentId / 状态机转移）。
- `rk push` 加 `--test` `--author <human|agent>` 两个 flag，对应 `POST /api/artifacts` body 增 `isTest`、`author` 字段。
- `rk feedback`（对应 `lib/store.ts → getFeedback`）输出形状改为 thread 折叠：root + replies[]，root 上携带 `waitingFor` 派生字段（基于最后一条回复的 author 推断）。
- `.pi/skills/renderkit-author/SKILL.md` 更新"闭环命令"段。

### Workstream C · design 包清理 + style.css 拆分

**用户可感知行为**：

- 无（纯重构）。视觉、几何、行为完全不变。

**系统结果**：

- `apps/web/app/style.css` 不再 `@import "@renderkit/design/index.css"`，改为显式 import 用到的子文件（`tokens.css` / `themes.css`）。`chrome.css` 不再被 web app 引用。
- `packages/design/src/chrome.css` 顶部加 DEPRECATED 注释，标明该文件仅供历史 CLI standalone 模式参考，新代码请使用 `.rk-doc-*` 命名空间。
- `packages/design/README.md` 新增（或更新），写明每个 CSS 的 audience：`tokens/themes/blocks/surfaces` 是 shared；`chrome` 是 deprecated。
- `apps/web/app/style.css` 从单文件 2965 行拆成 `app/style/{base,list,doc-app,compare,deleted-state}.css`，主 `style.css` 只做 `@import` 聚合。

## 用户故事

1. 我在 `/a/abc` 上选中某段 `<rk-callout>` 的标题文本写了评论 "标题歧义"，agent 把标题从 "Q2 净收益" 改成 "Q2 净收入" 后 push，刷新页面评论仍在原位、状态 `open`。
2. agent 在中间插了一个新 `<rk-callout>`，原有所有评论的 anchor ID 不受影响，因为 ID 是 content-based（已是当前行为，本次不回归）。
3. 我评论的那段文字被 agent 彻底删除了，评论变成 orphan，UI 在 thread 头部显示 "锚点已失效" 灰态（v1 已实现）。
4. 文档里有两个 `<h2>结论</h2>`。第一次 push 时 anchor 分别是 `h2-结论` 和 `h2-结论-2`，我分别在两块上写评论，不会跟错块。
5. agent 跑 `rk push doc.html --test`，文档落到 web 列表的"测试沙盒"分区，主列表看不到。
6. agent 跑 `rk feedback doc.html`，返回 JSON 包含 `comments[]`，每个 root 评论附带 `replies[]` 和 `waitingFor`。agent 看 `waitingFor === 'human'` 的 thread（自己回过了等人验收），可以跳过；看 `waitingFor === 'agent'` 的（人新评论或人 reopen），需要处理。
7. agent 修完代码后跑 `rk reply doc.html cmt_xxx "已改, 见 v3"` 加 `rk address doc.html cmt_xxx`。我刷新 web，看到 thread 多了一条 🤖 回复，root 评论状态变成"待验收"（蓝色左边条 + "验收 / 重开"按钮）。
8. 我在 web 上点"验收"，状态变成 `resolved`，thread 从列表消失（resolved 不显示，v1 已实现）。
9. （边界）agent 推送的新版本里某段文本被改写成完全不同的句子，selector fuzzy 找不到唯一匹配 → 评论 orphan，行为同今天。
10. （边界）agent 推送了一个新版本，相邻兄弟节点变化很大，prefix/suffix 消歧失败，但 `exact` 仍在新文档里唯一出现一次 → 仍然 rebind 成功。
11. （边界）老评论（selector=NULL，在 v1 之前创建）失配时，跳过 fuzzy 走旧逻辑直接 orphan，不影响行为。
12. （边界）`rk reply` 在 file 没有 `.renderkit.lock` 的情况下报错并提示 `rk push doc.html first`。
13. （重构验证）拆完 `app/style/*` 后，列表页 / 评审页 / 对比页用 `pw code` 拉的几何 box 与拆分前数字完全一致。

## 实现决策

### 改动模块

**Workstream A**

- `apps/web/lib/html-processor.ts`：`generateAnchorId` 加 dedup map。
- `apps/web/lib/store.ts → pushHTML`：在 orphan 标记之前插 rebind 阶段。
- `apps/web/lib/anchor-diff.ts`：可保持不变（仅做 set diff），rebind 逻辑放 store.ts 里。或者扩展成 `rebindAnchors(prev, next, comments)` 返回 `{ rebound, removed, kept }`，倾向后者，单测好写。
- `apps/web/app/a/[id]/HtmlArtifactView.tsx → submitDraft`：构造 selector 并 POST。
- `apps/web/lib/store.ts → addComment`：已支持 selector 入参（v1），无需改。

**Workstream B**

- `packages/cli/bin/renderkit.mjs`：新增 4 个 command + `push` 两个 flag。
- `apps/web/app/api/artifacts/route.ts → POST`：接收 `isTest`、`author`。
- `apps/web/lib/store.ts → pushHTML`：接收 `isTest`、`author` 入参（auto-detect 仍作为 fallback）。
- `apps/web/lib/store.ts → getFeedback`：输出按 thread 折叠，加 `waitingFor` 派生字段。
- `apps/web/app/api/artifacts/[id]/feedback/route.ts`：透传新结构。
- `.pi/skills/renderkit-author/SKILL.md`：更新闭环命令章节。

**Workstream C**

- `apps/web/app/style.css`：拆成 `app/style/{base,list,doc-app,compare,deleted-state}.css`，主文件只 `@import`。
- `apps/web/app/style.css` 头部：移除 `@import "@renderkit/design/index.css"`，改成 `tokens.css` + `themes.css` 显式 import。
- `packages/design/src/chrome.css`：头部加 DEPRECATED 注释。
- `packages/design/README.md`：新建或重写。

### 接口与数据流变化

- **DB schema**：
  - `comments` 增 `rebound_at TEXT NULL` 字段（rebind 时打时间戳；UI 本次不展示）。
  - `comments.selector` 字段无 schema 改动，但实际写入开始非 NULL。
- **API**：
  - `POST /api/artifacts` body 增可选 `isTest: boolean`、`author: 'human' | 'agent'`。
  - `POST /api/artifacts/[id]/comments` 在 v1 基础上要求前端开始传 `selector`（v1 已支持入参，但前端没传）。
  - `GET /api/artifacts/[id]/feedback` 输出从平面 `openComments[]` 改为 thread 折叠 `comments[].replies[]`、root 上加 `waitingFor: 'human' | 'agent'`。
- **状态机**：comment 状态机 v1 已定（`open ↔ addressed → resolved ↔ open`），本次不动；rebind 是值变更（更新 anchor 字段），不是状态变更。

### 已明确的约束

- v1 是不向后兼容的重构基线，本次延续这条原则。
- selector 用 W3C Web Annotation 标准的 `TextQuoteSelector`，schema 已有，不引入新类型。
- CLI 的 commentId 反查 artifactId 通过 `.renderkit.lock` 文件，不引入新 API。
- design 包结构（5 个 CSS 文件）不改，只动调用关系和文档。
- 不动 `data-rk-anchor` 注入逻辑、不动 WC 渲染层。

### 待确认

- `rk reply` 默认 author 是 `agent` 还是要求显式 `--author`？倾向默认 `agent`（CLI 主要是 agent 用），人想以 human 身份回复可走 web。
- `rebound_at` 字段：本次只加列、不暴露 UI、不暴露 API。下一版再决定是否做"自动 rebind 提示"。
- `rk feedback` 旧输出形状是否完全废弃？倾向是的（v1 已是不兼容基线）。
- selector 的 `prefix`/`suffix` 取相邻 element 的全部 textContent 还是末尾/开头 80 字符？倾向 80 字符（W3C 推荐区间）。
- fuzzy 匹配的归一化策略：lowercase + 折叠空白 + 去标点。是否要去除全角符号？倾向不做（中文场景会误伤）。

## 验收标准

### Workstream A

1. 在 v2 部署后新建的评论，DB 里 `selector` 字段非 NULL，含 `exact / prefix / suffix` 三个键。
2. 创建一个文档含 `<p>Hello World</p>`，写评论；agent push 改成 `<p>Hello, World!</p>`；评论自动 rebind 到新 anchor，`status='open'`，`rebound_at` 非 NULL。
3. 同一文档 push 含两个 `<h2>结论</h2>`，DB 里 anchor 表中存 `h2-结论` 和 `h2-结论-2` 两条不同 ID。
4. 删掉评论锚定的整段文本后 push，评论变 `orphaned`（不回归 v1 行为）。
5. 旧评论（手动 UPDATE `selector=NULL`）在 push 后仍走 orphan 路径，不报错。
6. 单元测试：`tests/anchor-rebind.test.ts` 覆盖上述 1–5 + 多 anchor 候选时的 prefix/suffix 消歧。

### Workstream B

1. `rk push doc.html --test` 后 `GET /api/artifacts?view=test` 包含该 artifact，`view=active` 不含。
2. `rk reply doc.html <cmt_id> "..."` 成功后 DB 中新评论 `parent_id = cmt_id`、`author = 'agent'`。
3. `rk address doc.html <cmt_id>` 成功后 DB 中 `status = 'addressed'`、`addressed_by = 'agent'`、`addressed_at` 非 NULL。
4. `rk feedback doc.html` 输出 JSON 中 `comments` 是数组，每项含 `id / anchor / text / author / status / replies[] / waitingFor`，`waitingFor` 在 root.author='human' 且最后一条 reply.author='agent' 时为 `'human'`。
5. `rk reply` / `rk address` 在没 `.renderkit.lock` 时报错并给修复提示，exit code 非 0。
6. CLI 帮助文档 `rk --help` 列出新 command，`rk reply --help` 显示用法。

### Workstream C

1. `apps/web/app/style.css` 不再含 `@import "@renderkit/design/index.css"`，改为只 import `tokens.css` + `themes.css`。
2. `packages/design/src/chrome.css` 顶部含 `/* DEPRECATED */` 注释。
3. `packages/design/README.md` 存在，明确列出每个 CSS 的 audience 和废弃状态。
4. `apps/web/app/style/` 目录存在，至少含 `base.css / list.css / doc-app.css / compare.css / deleted-state.css`。
5. `apps/web/app/style.css` 体积 < 200 行（只做 import 聚合）。
6. 拆分前后用 `pw code` 跑同一份 geometry audit 脚本，输出的所有 `box.{x,y,w,h}` 数字完全一致（zero pixel diff）。
7. `npm test` 仍 75/75 通过。

## 测试与验证策略

### 真实链路验证（必跑）

1. **闭环 dogfood**（B + A 联动）：
   - 人手写一个 `examples/demo-v2.html`，push 后写 3 条评论（含 selector）。
   - agent 改其中一段文字大小写，push 新版本，跑 `rk feedback` 验证 3 条评论全部仍在、status='open'、anchor 已更新。
   - agent 跑 `rk reply cmt_id "ok"` + `rk address cmt_id`，再跑 `rk feedback`，验证 `waitingFor='human'`。
   - 人在 web 上点验收，agent 再跑 `rk feedback`，确认该 thread 不再返回。
2. **anchor 失配边界**（A）：
   - 同上文档，agent 完全删除某段文本，验证该条评论变 `orphaned`，其它评论不受影响。
3. **CSS 重构无回归**（C）：
   - 部署 v1 baseline 跑 `pw code --file audit-list.js + audit-doc.js + audit-compare.js`，保存输出。
   - 部署 v2，重跑同样脚本，diff 输出，确认零像素差异。
4. **测试沙盒隔离**（B）：
   - `rk push doc.html --test`，确认 `/?view=active` 不显示、`/?view=test` 显示。

### 局部验证

- `tests/anchor-rebind.test.ts`：单测覆盖 rebind 所有命中策略（精确 / 模糊 / prefix-suffix 消歧 / 失败回退）。
- `tests/store-routes.test.ts`：扩充 thread 折叠 + waitingFor 推断的断言。
- `tests/cli.test.ts`：扩充 reply / address / resolve / reopen + push flag 的 e2e 走通。
- DB migration：在含 v1 数据的 sqlite 上跑迁移，验证 `rebound_at` 字段加成功且老数据不变。

### 回归

- 老 `rk push / rk feedback / rk validate / rk archive` 行为不变（除 feedback 输出形状）。
- 老评论（selector=NULL）在 push 后行为不变。
- web 列表 / 评审 / 对比页视觉无变化。

## 范围外

- 多人协作 / 登录 / 权限 / author 多值。
- anchor rebind 的 UI 提示（"已自动 rebind, [确认/撤回]"）。
- `chrome.css` 真删除（本次只 deprecate，不动文件位置避免破坏 CLI standalone 模式）。
- render error 的 source location 增强。
- WC re-render 架构性重写（v1 已用 React.memo 兜住）。
- design 包的真正物理拆分（拆成 `@renderkit/design-render` + `@renderkit/design-app` 两包）。
- `rk feedback --include-resolved` 等新 flag（如果需要后续再加）。

## 风险与待确认项

### 风险

1. **fuzzy rebind 错配**。两段相似文本（如多个 `"完成"` `"待办"`）可能让评论挂错块。**缓解**：① prefix/suffix 消歧失败时直接 orphan，不强行猜；② 在 DB 留 `rebound_at` 字段，未来上 UI 提示后人可一键回退；③ 单测覆盖多候选场景。
2. **`rk feedback` 输出形状改变破坏未知的下游脚本**。v1 已是不兼容基线，但仍要在 release notes 明确说明。
3. **CSS 拆分次序错乱**。`@import` 顺序影响 cascade，拆完可能某些样式 specificity 错位。**缓解**：拆完用 `pw code` geometry audit 验证零像素差异。
4. **CLI 加 command 后 `.renderkit.lock` 必须可读**。如果用户在另一台机器 / 另一个 lock 路径下跑 `rk reply`，会报错。**缓解**：错误信息明确指向 `rk push` 重建 lock。
5. **rebind 性能**。orphan 候选 × 当前 anchor 数 = O(N×M)。当前规模（< 100 anchor / < 50 评论 / 文档）忽略不计，未来超大文档可能要 index。本次不优化。

### 待确认

- 见"实现决策 → 待确认"五条。
- `rebound_at` 字段是否要扩展为 `rebound_history JSON[]`（多次 rebind 留全部历史）？倾向不做，第一版只留最后一次。
- 是否同步把 `examples/cases/*.html` 测试一遍 rebind，验证用真实文档场景 OK？倾向是，作为 e2e 测试的一部分。
- `rk reply` 是否支持多行文本（heredoc / `--file replies.md`）？倾向支持 `--file`，简单。
- design 包的 README 是否包含历史 chrome.css 设计原因？倾向加一段"为什么 deprecated"解释，避免未来 contributor 再去用。
