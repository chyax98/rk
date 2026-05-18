# Handoff Brief

## 目标

RenderKit 是一个本地 HTML artifact 渲染器：Agent 写 HTML + `<rk-*>` Web Components → `rk push` → 浏览器展示 → 人评论 → `rk feedback` → Agent 迭代。
本次任务目标：**大幅扩展 WC 组件库（可视化覆盖）+ 完善 CLI/Server 工具链**。

## 当前状态

**主体已完成。** 46 个 WC，SSR 引擎 4 个，render-error 反馈链路，SKILL.md 已重构。
存在 3 个已知 UI bug（截图确认），已提交修复代码但**未在浏览器侧验证**。

---

## 已完成

### WC 组件（24 → 46 个）

- [x] **内容类**：`rk-card`, `rk-section`, `rk-diff`, `rk-narrative`（内联 sparkline/badge/value）
- [x] **ECharts 扩展**：`rk-chart` 新增 `type=radar|funnel|gauge`
- [x] **数据可视化**：`rk-plot`（Observable Plot）, `rk-plot3d`（Plotly.js 3D）, `rk-infographic`（@antv/infographic）
- [x] **表格**：`rk-datagrid`（AG Grid Community，改名自 rk-grid 以避免与布局 rk-grid 冲突）
- [x] **地图/地理**：`rk-map`（Leaflet，OpenStreetMap 无需 API key）, `rk-globe`（Globe.gl 3D 地球仪）
- [x] **图网络**：`rk-graph`（Cytoscape.js）, `rk-graph3d`（3d-force-graph WebGL）, `rk-flow`（@antv/x6 流程图）
- [x] **3D/特殊**：`rk-model`（Google model-viewer，GLTF/AR）, `rk-zdog`（伪 3D 轻量插画）, `rk-sketch`（Rough.js 手绘）
- [x] **叙事**：`rk-scroll-story` + `rk-step`（Scrollama 滚动叙事）

所有 WC 文件：`packages/components/src/elements/rk-*.ts`
Bundle：`apps/web/public/rk/components.js`（152KB，所有库 CDN 懒加载）

### SSR 引擎（html-processor.ts）

```
d2       → spawn('d2', ['--layout=elk', '--theme=0', '-'])  本地 binary
mermaid  → Kroki HTTP POST https://kroki.io/mermaid/svg
plantuml → Kroki HTTP
graphviz → Kroki HTTP
```

失败 → 返回 `warnings[]`，CLI push 时打印，WC 降级客户端渲染。
文件：`apps/web/lib/html-processor.ts`

### Render-error 反馈链路

```
WC catch → dispatchEvent('rk-render-error', {engine, message, anchor})
→ HtmlArtifactView.tsx 监听 → debounce 1s → POST /api/artifacts/:id/render-errors
→ SQLite render_errors 表
→ rk feedback 返回 renderErrors[] 字段
```

新 API：`apps/web/app/api/artifacts/[id]/render-errors/route.ts`
DB 改动：`apps/web/lib/db.ts`（render_errors 表）

### CLI

- `rk validate <file>` — D2 语法校验（spawn d2 validate）+ JSON parse 校验
- `rk doctor` — 检测 d2 安装，未装给出安装命令
- `rk push` — 推送前非阻塞 warning 检查
文件：`packages/cli/bin/renderkit.mjs`

### 设计系统

- `scripts/build-theme.mjs` — 合并 `design/src/tokens.css` + `design/src/themes.css` → `apps/web/public/rk/theme.css`
- 修复前：theme.css 只有 191 行 paper-light 默认值，8 主题仅在 Next.js 全局 CSS 中
- 修复后：799 行，8 主题完全自包含，artifact HTML 可脱离 Next.js 独立使用

### SKILL.md 重构

```
.pi/skills/renderkit-author/
  SKILL.md              187 行，5KB（intro + 速查表 + 路由）
  reference/
    quickstart.md       模板
    themes.md           8 主题
    components.md       46 WC 完整语法（20KB）
    design-rules.md     Anti-Slop
    cli.md              CLI 工作流
    component-guide.md  场景选组件决策树
    warnings.md         常见错误
```

---

## 进行中

### 已知 UI Bug（代码已修，未浏览器验证）

commit `3bd5309` 和 `4a95f41` 修了以下三个问题，但用户截图是修复前的：

1. **rk-plot `Plot.plot is not a function`**
   - 原因：UMD script 注入后 `window.Plot` 命名不对
   - 修复：改为 ESM dynamic import
   ```typescript
   // rk-plot.ts _loadPlot()
   const mod = await import('https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/dist/plot.esm.min.js');
   return mod as unknown as PlotModule;
   ```

2. **rk-narrative 双标题 + 文字挤一行**
   - 原因：父 WC（如 rk-section）设置 innerHTML 触发子 WC re-connect，子 WC 重读已渲染的 textContent 当 JSON 解析
   - 修复：所有 33 个 WC 的 `connectedCallback` 加 `if (!this._raw)` 保护
   ```typescript
   connectedCallback(): void {
     if (!this._raw) this._raw = this.textContent?.trim() || '';
     this._render();
   }
   ```

3. **rk-datagrid 分页栏溢出**
   - 原因：容器高度固定，pagination footer 超出
   - 修复：pagination 时用 `domLayout: 'autoHeight'`（AG Grid 自管高度）
   ```typescript
   if (pagination) {
     gridOptions.domLayout = 'autoHeight';
   }
   ```

**需要做**：重新打开 5 个示例文档验证修复效果，推新版示例。

### 示例文档（需验证/可能需重推）

| URL | 内容 | 主题 |
|---|---|---|
| http://localhost:3737/a/art_2447500a68 | Q2 数据分析报告 | linear-app |
| http://localhost:3737/a/art_431aabc8bd | 系统架构文档 | dark-pro |
| http://localhost:3737/a/art_07fd89272e | 项目状态看板 | notion-clean |
| http://localhost:3737/a/art_3ef97b1205 | 全球市场报告 | ibm-enterprise |
| http://localhost:3737/a/art_e564e3a6de | 产品发布公告 | glassmorphism |

art_431aabc8bd 的 Mermaid 内容有问题（agent 把 title 写进了 diagram body），需要重推。

---

## 待办

- [ ] **验证 3 个 bug 修复**：在浏览器打开示例文档，确认 rk-plot/rk-narrative/rk-datagrid 正常
- [ ] **重推 art_431aabc8bd**：系统架构文档 Mermaid 写法有误，重新生成正确的 mermaid 语法
- [ ] **补充 9 个未覆盖组件的示例**：rk-graph, rk-plot3d, rk-graph3d, rk-infographic, rk-model, rk-scroll-story, rk-stat, rk-tabs, rk-decision
- [ ] **components.md 更新 rk-scroll-story 语法**（新加的组件文档可能未进 reference/components.md）
- [ ] **ECharts SSR**（P3，已评估跳过）：需要 `canvas` native addon，不值得引入
- [ ] **Kroki 中文 Mermaid 问题**：Kroki 对 CJK Mermaid 支持有限，SSR 失败降级客户端——这是 Kroki 的问题，不是 bug，SKILL.md 可加说明

---

## 关键决策

- **浏览器 WC 路（非 CLI transform）是主路** — agent 写 HTML，库在浏览器渲染，交互价值保留（tooltip/zoom/主题响应）。CLI transform 只用于无可用 npm 包的情况（D2）。
  - 否决了：把 Mermaid/ECharts 也做 CLI transform（当前 SSR 够用，Mermaid 走 Kroki）

- **D2 WASM npm 包（@terrastruct/d2）已确认废弃** — npm 包 v0.1.33（Jan 2025），Node.js 里同样报 `invalid JSON input`，是包本身的 bug。唯一可用路径是本地 `d2` binary。
  - WC 层 `_renderD2()` 已改为显示友好报错，不再尝试 WASM

- **Kroki D2** — 技术上支持，但从 server 侧调用持续超时（15s 内无响应），不可靠。维持 local binary。

- **rk-datagrid 不叫 rk-grid** — 已有 `rk-grid`（CSS 多列布局组件），AG Grid 改名为 `rk-datagrid`

- **rk-plot 用 ESM import 不用 UMD script** — UMD 的 `window.Plot` 在 IIFE bundle 上下文中命名冲突，ESM dynamic import 更干净

- **SKILL.md 拆分** — 主文件路由，reference/ 放详细语法。reference 文件无数字序号（无顺序关系）

---

## 踩过的坑

- **@terrastruct/d2 npm 包**：浏览器和 Node.js 都报 `invalid JSON input undefined`。包的 worker.js 用 `JSON.parse(undefined)` 解析 WASM 返回值。根本原因是 v0.1.33 与当前 Go WASM runtime 不兼容，7 个月未更新。

- **Kroki D2 403**：Python urllib 默认 User-Agent 被 Kroki 屏蔽，加 `Mozilla/5.0` 可过，但之后超时。D2 在 Kroki 是独立服务，冷启动慢。

- **并行 agent 写同一个文件**：多个 subagent 同时修改 `bundle.ts`、`components.css`、`rk-chart.ts` 会造成内容损坏（一个 agent 覆盖另一个的改动）。当时 rk-chart.ts 的 `_renderEcharts` 方法签名被破坏，被第二批 agent 检测到并修复。**下次并行 agent 写文件要分工明确避免同一文件冲突**。

- **WC re-render 竞态**：父 WC（rk-section/rk-card）在 `connectedCallback` 里读 `this.innerHTML`，但此时子 WC 可能已先渲染，导致读到渲染后的 HTML 而非原始 JSON。Fix：所有 WC 加 `if (!this._raw)` 保护。

- **Observable Plot UMD**：CDN 上的 `plot.umd.min.js` 加载后 `window.Plot` 存在但 `Plot.plot` 不是 function。具体原因是 UMD 在 IIFE 上下文中全局注册方式异常。改用 ESM import 解决。

---

## 重要的上下文细节

- **测试**：`pnpm run test`，当前 75/75 pass。所有测试在 `tests/` 目录，主要测 server API 和 store，不测 WC 渲染（浏览器环境）。
- **Build**：`npx esbuild packages/components/src/bundle.ts --bundle --format=esm --outfile=apps/web/public/rk/components.js --resolve-extensions=.ts,.tsx,.js --loader:.ts=ts --platform=browser`
- **自闭合 tag 禁止**：HTML5 parser 对 Custom Elements 不支持自闭合，`<rk-callout />` 会把后续元素变成子元素。这是最常见的 agent 写法错误。
- **Light DOM**：所有 WC 使用 Light DOM（无 Shadow DOM），原因是评论系统需要 Selection API 穿透。CSS token `--rk-*` 可以直接作用于组件内部。
- **主题注入路径**：artifact HTML 加载 `/rk/theme.css`（799 行，8 主题）和 `/rk/components.css`。Next.js app 同时加载 `@renderkit/design/index.css`（app chrome 样式）。两套 CSS 共存，不冲突。
- **d2 binary**：`brew install d2` 或 `curl -fsSL https://d2lang.com/install.sh | sh`。`rk doctor` 会检测并给出提示。
- **服务器端口**：`http://localhost:3737`（dev 模式）
- **artifact 格式**：`art_xxxxxxxx`（8位hex），存 SQLite。revision 每次 push 递增。
- **rk feedback JSON 结构**：
  ```json
  {
    "artifactId": "art_xxx",
    "currentRevision": 3,
    "openComments": [...],
    "submissions": [...],
    "renderErrors": [{"engine":"mermaid","message":"...","anchor":"anc_xxx"}]
  }
  ```
