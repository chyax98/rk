# RenderKit

> 本地 HTML artifact 渲染器。Agent 写 HTML → push → 人评论 → agent 闭环回复 → 迭代。

## 闭环

```
Agent 写 HTML + <rk-*> 组件
  ↓ rk push doc.html --author agent
Server 注入 anchor / Shiki SSR / 存 SQLite
  ↓ 浏览器渲染（Web Components + design tokens）
人评论（飞书式右侧面板，TextQuoteSelector 锚定）
  ↓ rk feedback doc.html
Agent 拿 thread + waitingFor 判断要处理哪些
  ↓ rk reply / address / resolve / reopen
人验收 → 下一轮 push（评论自动 fuzzy rebind）
```

## 快速开始

```bash
# 安装
pnpm install

# 启动 server（开发：3737；生产：PORT=3000 pnpm --filter @renderkit/web start）
pnpm dev

# 推送
pnpm renderkit push examples/hello.html --author agent --open

# 闭环命令
pnpm renderkit feedback examples/hello.html
pnpm renderkit reply    examples/hello.html cmt_xxx "已修复"
pnpm renderkit address  examples/hello.html cmt_xxx
pnpm renderkit resolve  examples/hello.html cmt_xxx
pnpm renderkit reopen   examples/hello.html cmt_xxx
```

全局调用见 [packages/cli/README.md](packages/cli/README.md)。

## 关键能力

- **24 个 `<rk-*>` Web Components** — Light DOM，无 shadow，原生 HTML 完全可混用
- **HTML-first** — agent 输出就是渲染目标，不经任何中间格式
- **评论闭环** — agent 和人通过 `parent_id` 串 thread，`waitingFor` 决定谁该动
- **Anchor fuzzy rebind** — 文档迭代时评论自动绑定新锚点（exact / normalized / 邻居消歧）
- **`--test` 沙盒** — 测试 artifact 自动隔离到沙盒视图，不污染主列表

## 组件清单

| 组件 | 用途 |
|---|---|
| `<rk-callout>` | 7 种语义提示框（info/success/warning/danger/...） |
| `<rk-stat>` `<rk-metric>` | KPI 卡 / 指标行 |
| `<rk-code>` | Shiki SSR 高亮 |
| `<rk-chart>` | ECharts |
| `<rk-diagram>` | Mermaid / D2 / Graphviz / PlantUML |
| `<rk-decision>` | ADR 决策记录 |
| `<rk-checklist>` `<rk-steps>` `<rk-timeline>` | 任务/流程类 |
| `<rk-comparison>` | 方案对比 |
| `<rk-grid>` `<rk-tabs>` `<rk-table>` `<rk-section>` `<rk-card>` | 布局 |
| `<rk-form>` | 表单（提交进 form_submissions） |
| `<rk-kanban>` | 看板 |
| `<rk-3d>` `<rk-globe>` `<rk-map>` | Three.js / 地球 / 地图 |
| `<rk-image>` `<rk-quote>` `<rk-highlight>` `<rk-summary>` `<rk-collapsible>` | 内容辅助 |
| `<rk-badge>` `<rk-diff>` | 状态/差异 |

不够用？直接写原生 HTML，完全支持。

## 写 artifact 示例

```html
<h1>Q2 产品评审</h1>

<rk-highlight label="结论">
  方案 B 推荐采纳，降本 40%，6 周上线。
</rk-highlight>

<rk-grid cols="3">
  <rk-stat label="节省" value="40" unit="%" delta="+40%" deltadir="up" tone="positive"></rk-stat>
  <rk-stat label="周期" value="6"  unit="周"></rk-stat>
  <rk-stat label="风险" value="低" tone="positive"></rk-stat>
</rk-grid>

<rk-decision question="存储选型" chosen="SQLite" status="decided">
  <rk-reason><li>零配置，无需 Docker</li></rk-reason>
</rk-decision>
```

## 部署

```bash
# 1. 在目标机器 clone + install
git clone <repo> renderkit && cd renderkit
pnpm install

# 2. 构建
pnpm build

# 3. 启动（默认 3000）
PORT=3000 RENDERKIT_DATA_DIR=/var/lib/renderkit pnpm --filter @renderkit/web start
```

环境变量：

| 变量 | 默认 | 说明 |
|---|---|---|
| `PORT` | dev 3737 / start 3000 | server 监听端口 |
| `RENDERKIT_DATA_DIR` | `~/.renderkit/data` | SQLite 文件目录 |
| `RENDERKIT_ENDPOINT` | `http://localhost:3737` | CLI 默认 server 地址 |

详细部署（systemd / nginx 反代 / 域名）见 [docs/DEPLOY.md](docs/DEPLOY.md)。

## 技术栈

| 层 | 选型 |
|---|---|
| Server | Next.js 16（Turbopack） |
| DB | SQLite (better-sqlite3) |
| WC | Light DOM, 原生 Custom Elements |
| 代码高亮 | Shiki SSR |
| 图表 | ECharts (CDN) / Three.js (CDN) / Mermaid (CDN) |
| HTML 解析 | linkedom |
| CLI | commander + 原生 fetch |
| 包管理 | pnpm 9 workspace |

## 仓库结构

```
apps/web/                    Next.js server
  app/                       页面 + API routes
  app/style/                 拆分 CSS（base/list/doc-app/compare/...）
  lib/                       db / store / html-processor / anchor-diff
  docs/                      PRD（功能内部设计文档）
packages/
  cli/                       CLI（commander）
  components/                <rk-*> WC 源码 + build
  design/                    CSS tokens + 主题
examples/                    示例 HTML（hello.html / cases/）
docs/                        架构 / 部署 / CLI 参考
.pi/skills/renderkit-author/ 给 AI agent 的 skill 包
.trellis/                    决策 / journal 留痕
tests/                       Node test runner（79 cases）
```

## 文档

| 看这个 | 干嘛 |
|---|---|
| [README.md](README.md) | 你在这里 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 系统分层 + schema + 闭环时序 |
| [docs/DEPLOY.md](docs/DEPLOY.md) | chyax 部署 / systemd / nginx |
| [packages/cli/README.md](packages/cli/README.md) | CLI 命令完整参考 |
| [.pi/skills/renderkit-author/SKILL.md](.pi/skills/renderkit-author/SKILL.md) | Agent 写 artifact 的 skill |
| [apps/web/docs/PRD-closeloop-v2.md](apps/web/docs/PRD-closeloop-v2.md) | v2 闭环 PRD |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 开发约定 |
