# Handoff Brief

## 目标
RenderKit v2 闭环可用化（anchor fuzzy rebind + CLI agent 通道 reply/address/resolve/reopen + CSS 拆分），然后清理仓库、维护文档、CLI 本地全局安装、部署到 chyax 云端（域名 https://diagram.chyax.site，端口 3000，pm2 托管）。

## 当前状态
**所有主目标完成**。Server 在线、CLI 全局可用、Skill 软链分发到位、代码已 commit 并推送 origin/master。剩 3 个 CLI 易用性改善已记 todo 但**未实施**。仓库里有 8 个无关 dirty 文件（之前会话遗留，不要动）。

## 已完成

### v2 闭环（commits `1b10a88` + `d2a786e`）
- [x] `apps/web/lib/db.ts` — 新干净 schema，无 migration。备份 `~/.renderkit/data/renderkit.db.bak-v2-1779108939`
  - 新字段：`comments.parent_id`, `author`, `selector`, `rebound_at`, `is_test`, `deleted_at`, `addressed_at/by`, `resolved_at/by`
- [x] `apps/web/lib/store.ts`
  - `pushHTML(rawHtml, file?, opts: {isTest?, author?})` 新签名
  - 三策略 anchor rebind：exact textPreview → normalized（去大小写/空白/标点）→ prefix/suffix 邻居评分消歧 → 失败 orphan
  - `getFeedback` 重写：root 评论 + replies[] thread 折叠 + `waitingFor: 'human'|'agent'` 字段（基于最后一条 author）
- [x] `apps/web/lib/html-processor.ts` — `generateAnchorId` 在 `seenAnchors` Map 中加 `-2/-3` 后缀去重
- [x] `apps/web/app/a/[id]/HtmlArtifactView.tsx` — `buildSelector` 从 DOM 抓 `TextQuoteSelector {exact, prefix, suffix}` POST 给 server
- [x] `apps/web/app/api/artifacts/route.ts` — POST body 收 `isTest`/`author` 透传给 `pushHTML`
- [x] `packages/cli/bin/renderkit.mjs` — 4 新命令：`reply / address / resolve / reopen`，`push` 加 `--test --author` flag
- [x] CSS 拆 5 子文件：`apps/web/app/style.css` 18 行入口 → `style/{base,list,doc-app,compare,deleted-state}.css`
- [x] `packages/design/src/chrome.css` 顶部加 DEPRECATED 注释
- [x] `packages/design/README.md` 新增，说明 css 文件 audience
- [x] 测试：79/79 pass（4 新 anchor-dedup + 6 新 store-routes thread/rebind cases）
- [x] Compare 页 scroll bug 修复（commit `d3e725b`）— Grid + Flex 双层 `min-height:0` 链

### 清理 + 文档（commit `d08b615`）
- [x] 删 `HANDOFF.md`（本次重写）、`progress.md`、`research.md`、`score-report.json`
- [x] `.gitignore` 加 `.rk-lock/`、`score-report.json`
- [x] `README.md` 重写：v2 闭环、组件清单、部署指南、env 变量表
- [x] `ARCHITECTURE.md` 重写：闭环时序图、v2 schema、CSS 文件分层、rebind 3 策略
- [x] `apps/web/lib/db.ts` 加 `RENDERKIT_DATA_DIR` env 覆盖
- [x] `apps/web/package.json` 用 `PORT` env（dev 3737 / start 3000）
- [x] `packages/cli/package.json` 加 `rk` bin alias 和 files[]，build 改成真冒烟检查
- [x] `packages/cli/scripts/check.mjs` 新建 — spawn `--help` 验证 8 命令注册
- [x] `packages/cli/README.md` 新建 — 完整命令表 + endpoint + 闭环示例

### 部署到 chyax
- [x] `pm2 stop hapi-hub && pm2 delete hapi-hub`（占用 3000 的旧服务）
- [x] rsync 仓库到 `chyax:/www/wwwroot/diagram.chyax.site/app/`（排除 node_modules / .next / .data / .git / .pwcli / .rk-lock）
- [x] `pnpm install --ignore-scripts && pnpm build` 在 chyax 上跑通
- [x] pm2 启动：`PORT=3000 RENDERKIT_DATA_DIR=/var/lib/renderkit pm2 start 'pnpm --filter @renderkit/web start' --name renderkit`
- [x] `pm2 save`（pm2-root systemd 已 enabled，重启自启）
- [x] 验证：https://diagram.chyax.site/api/health → 200, 首页 200/10.8KB, 本地 CLI `rk push` → ok

### 本机 CLI 全局
- [x] `cd packages/cli && pnpm link --global` → `/Users/xd/Library/pnpm/{rk,renderkit}` shim
- [x] `~/.zshrc` 末尾加 `export RENDERKIT_ENDPOINT=https://diagram.chyax.site`
- [x] 验证：`zsh -i -c 'rk doctor'` → server.ok=true, latency=112ms
- [x] 冒烟：本地 `rk push /tmp/smoke-cloud.html` → `art_faa312f392`

### Skill 分发
- [x] `ln -sfn /Users/xd/Worker/tools/RenderKit/.pi/skills/renderkit-author ~/.agents/skills/renderkit-author`
- [x] 给 alma 用的指引文档已直接打印给用户（未落盘，是输出在对话里）
- [x] 触发词：`"用 RenderKit 写"` `"rk push"` `"生成 artifact"` `"HTML artifact"` `"renderkit"`

### Trellis 留痕
- [x] Session #1（`1b10a88`）v2 foundation
- [x] Session #2（`1b10a88,d2a786e`）v2 闭环 5-worker 并发 — 详细 journal 在 `.trellis/spec/journal-1.md`

## 进行中
无。所有任务结束在自然交付点。

## 待办（pending todos #17/#18/#19）
- [ ] **#17** CLI: `~/.renderkit/config.json` 持久化 endpoint（替代 env var 依赖）— 10 min
- [ ] **#18** CLI: `rk feedback --format md` 输出 thread markdown 表（commentId 易复制）— 20 min
- [ ] **#19** CLI: `rk reply --latest` / `rk address --latest` 自动选 `waitingFor=agent` 的最新评论 — 30 min

用户态度："先记成待办，慢慢优化"。**不要主动开始做**，除非用户明示。

## 关键决策

- **不写向后兼容、不做 migration、直接清 DB** — 用户明示。v2 schema 全新写。前提：DB 已备份 `~/.renderkit/data/renderkit.db.bak-v2-1779108939`，可还原。**前提失效就要重新讨论**。
- **复用 `diagram.chyax.site` 域名 + 端口 3000** — 用户明示「3000 就用这个」「diagram.chyax.site 用现成的」
  - 否决了：新建 `rk.chyax.site`（需新申请 SSL + nginx 配置）
  - 代价：旧 hapi-hub 服务被停删（用户明示「给他停了」）。如果 hapi-hub 有外部依赖在用 `diagram.chyax.site`，会断。
- **CLI 不发 npm，只本地自用** — 用户明示「本地正常打包就行 不发布 我们自用」
  - 因此：`packages/cli/package.json` 保持 `private: true`，只加了 `files[]`/bin alias 方便本地 link
- **Skill 软链不复制** — 用户明示「软连接过去就行 我慢慢优化」
  - 后果：仓库 `.pi/skills/renderkit-author/` 改动立刻全局生效
- **AB2 worker context 爆但代码已写完** — 验证手段：`git diff` 而非 worker 的 summary 文件。下次大任务 worker 同理处理
- **CSS Grid + Flex 双 `min-height: 0`** — 任何 grid item 是 flex 容器、内部又有 flex:1 scroll 区域时，**两层都要 `min-height: 0` + 外层 `overflow: hidden`**，否则内容撑大不滚

## 文件变更

### Commit `1b10a88` v2 foundation
- `apps/web/lib/db.ts` — 完全重写 schema（无 migration）
- `apps/web/docs/PRD-closeloop-v2.md` — 新增 PRD

### Commit `d2a786e` v2 close-loop（5-worker 并发）
- `apps/web/lib/store.ts` +125/-23 — 见上"已完成"
- `apps/web/lib/html-processor.ts` — generateAnchorId 加 dedup
- `apps/web/app/a/[id]/HtmlArtifactView.tsx` — buildSelector
- `apps/web/app/api/artifacts/route.ts` +6/-4 — body 收 isTest/author
- `packages/cli/bin/renderkit.mjs` — 4 新命令 + 2 push flag
- `apps/web/app/style.css` 2965→18 行 + `apps/web/app/style/{base,list,doc-app,compare,deleted-state}.css`
- `packages/design/src/chrome.css` — DEPRECATED 注释
- `packages/design/README.md` 新增
- `tests/anchor-dedup.test.ts` 新增（4 cases）
- `tests/store-routes.test.ts` +140 行（rebind + thread cases）
- `.pi/skills/renderkit-author/SKILL.md` — 闭环命令补充

### Commit `d3e725b` compare scroll fix
- `apps/web/app/style/compare.css` — Grid + Flex `min-height: 0` 修复（关键 7 行）

### Commit `d08b615` cleanup + deploy-ready
- `.gitignore` — `+.rk-lock/`, `+score-report.json`
- `ARCHITECTURE.md` — 重写
- `README.md` — 重写
- `apps/web/lib/db.ts` — `+RENDERKIT_DATA_DIR` env
- `apps/web/package.json` — `PORT` env
- `packages/cli/package.json` — `rk` bin alias + files[]
- `packages/cli/scripts/check.mjs` 新增
- `packages/cli/README.md` 新增
- 删 `HANDOFF.md` `progress.md` `research.md` `score-report.json`

### 未 commit 的 dirty 文件（**不要碰**，之前会话遗留的进行中工作）
```
M apps/web/next-env.d.ts
M apps/web/public/rk/components.js
M examples/cases/3d-visual.html
M examples/cases/forms-interactive.html
M examples/cases/maps-geo.html
M examples/cases/network.html
M packages/components/src/elements/rk-globe.ts
M packages/components/src/elements/rk-map.ts
M scripts/render-scan.mjs
```

## 踩过的坑

### `edit` 工具多行 oldText 误删跨行
`package.json` 用 `edit` 把 `"test": "..."\n    "test:wc":` 当 oldText 时，新的 newText 没保留 `,` → JSON 跨行连环错。后续要修 4 次。**教训：JSON 改动直接 `python3 -m json.tool` 校验，或全量重写 scripts 块**。

### Worker context 爆但代码全写完
`subagent` 17379ec6 的 worker 5 (AB2) 报 `model_context_window_exceeded`，**不要相信"失败"标签**。检查 `git diff` 看实际改动——AB2 的所有 store.ts / API / tests 改动都已写入文件，只是写最后 summary md 时爆了。

### chyax `pnpm install` 报 "dubious ownership"
```
fatal: detected dubious ownership in repository at '/www/wwwroot/...'
```
原因：rsync 后 git 文件 ownership 不是 root，lefthook prepare 钩子失败。修法：
```bash
git config --global --add safe.directory /www/wwwroot/diagram.chyax.site/app
pnpm install --ignore-scripts   # 跳过 lefthook prepare
```

### CSS Grid 子元素被内容撑大
`compare` 页 pane 高度 = 1627（内容高）而非 664（视口）。**根因双层**：grid item 默认 `min-height: auto` + flex item 默认 `min-height: auto`。修：
```css
.rk-compare-split  { grid-template-rows: 1fr; min-height: 0; overflow: hidden; }
.rk-compare-pane   { min-height: 0; overflow: hidden; }
.rk-compare-pane-body { flex: 1 1 0; min-height: 0; overflow-y: auto; }
```

### `zsh -c` 不 source `.zshrc`
验证环境变量必须 `zsh -i -c` 或 `zsh -l -c`，普通 `zsh -c '...'` 不会加载 `~/.zshrc`。

### `next start` PORT env
Next.js 15+ `next start` **不**自动读 PORT，必须 `-p $PORT`。npm script 用 `${PORT:-3000}` shell expansion OK（/bin/sh 执行）。

## 重要的上下文细节

### 服务端
- 域名：https://diagram.chyax.site
- 路径：chyax `/www/wwwroot/diagram.chyax.site/app/`
- pm2 name: `renderkit`（id 5），systemd `pm2-root` 已 enabled
- DB：`/var/lib/renderkit/renderkit.db`
- 日志：`ssh chyax 'pm2 logs renderkit'`
- 重启：`ssh chyax 'pm2 restart renderkit --update-env'`
- 重新部署流程：本地 rsync（同上 exclude 列表）→ chyax `pnpm install --ignore-scripts && pnpm build && pm2 restart renderkit`
- nginx 配置在 `/www/server/panel/vhost/nginx/diagram.chyax.site.conf`，**不要动**（已正确反代 3000，含 SSL/QUIC）

### 本机 CLI
- 全局 shim：`/Users/xd/Library/pnpm/{rk,renderkit}` → `packages/cli/bin/renderkit.mjs`
- 仓库改 `.pi/skills/renderkit-author/SKILL.md` → 立刻在所有 agent 可见（软链）
- env 配在 `~/.zshrc` 末尾：`export RENDERKIT_ENDPOINT=https://diagram.chyax.site`

### CLI API 形状
- `getFeedback` 返回 `comments[].waitingFor: 'human'|'agent'`，**不再有 `openComments`**。如果看到 `openComments` 引用一定是旧代码漏改
- POST `/api/artifacts` body 新增字段：`isTest: boolean | undefined`, `author: 'human' | 'agent' | undefined`
- PATCH `/api/artifacts/[id]/comments/[cid]` 支持 `{ status, actor }`
- 锁文件路径：`<file_dir>/.rk-lock/<basename>.json`（per-file）

### Test runner 怪癖
- `npm test` 路径必须显式列每个 test 文件，不会 glob。新 test 文件要手动加到 `package.json` scripts.test。当前 6 个：comment-anchor / store-routes / html-processor / wc-render / cli / anchor-dedup
- Node 用 `--experimental-strip-types`，要求 Node 22+。chyax 是 20.19.5，**只能跑 build/start 不能跑 test**。本地必须 Node 24（已是）

### 评论 status 4 种
`open` → 新建 / 重开后；`addressed` → agent 标待验收；`resolved` → 解决；`orphaned` → push 后 rebind 失败。`getFeedback` 不返回 resolved。

### 常量定义在 `apps/web/lib/db.ts`
```ts
COMMENT_OPEN='open', COMMENT_ADDRESSED='addressed',
COMMENT_RESOLVED='resolved', COMMENT_ORPHANED='orphaned'
```

### Git remote
- `origin` = `git@github-personal:chyax98/rk.git`
- 当前在 master，HEAD `d08b615`，已 push
- 有个 `develop` 分支（worktree `../RenderKit-dev`），**这次没动**

### 跑过的验证手段
- `pnpm test` 79/79
- `pnpm build` 端到端通
- `pw` (playwright cli) geometry audit — 三页 box 数字对比
- `RENDERKIT_ENDPOINT=https://diagram.chyax.site rk push /tmp/smoke-cloud.html` 端到端
- `curl https://diagram.chyax.site/api/health` → 200
