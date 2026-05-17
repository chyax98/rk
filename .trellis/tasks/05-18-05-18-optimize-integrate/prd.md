# PRD：优化与集成

**任务 ID**: 05-18-optimize-integrate  
**优先级**: P1  
**日期**: 2026-05-18  
**状态**: planning

---

## 问题陈述

当前 RenderKit 完成了 HTML-first 架构重写（v0.1.0-html-first），24 个 WC + 8 套主题 + 飞书评论已可用。但存在三类尚未解决的问题：

**1. 图表渲染质量不完整**  
Mermaid 已有主题感知（dark/default 切换），但只是粗糙的 `theme: 'dark'` 选项，没有对接 `--rk-*` 设计 token。`beautiful-mermaid` 参考 repo 已经验证了一套成熟的 CSS 变量驱动方案（`--bg` / `--fg` / `--accent` 等），可以让 Mermaid SVG 真正跟随设计系统主题。D2 引擎也未经过真实浏览器的视觉验证。

**2. rk-form 提交数据无处可去**  
`rk-form` 组件提交后只是 `console.log`（见 `rk-form.ts` 第 197 行注释："Submissions are logged to console as JSON"）。Agent 生成的表单无法回收用户填写的数据，飞书评论 + 表单提交是两条本应打通的数据流，目前是断的。

**3. Trellis spec 文件过时，知识库失真**  
- `spec/components/index.md` 写的是 21 个 WC，实际是 24 个
- `spec/cli/frontend/` 7 个文件是 Trellis 初始化的空白占位模板，对应 DSL 时代的 React hooks 架构，与当前 HTML-first 单文件 `HtmlArtifactView.tsx` 完全不符
- Agent 读取这些过时 spec 会产生错误的上下文

---

## 目标

**解决：**
- beautiful-mermaid 主题对接：Mermaid 图表颜色跟随 `--rk-*` token，8 套主题各不同
- rk-form 提交数据服务端收集：表单提交 → POST API → artifact 关联存储 → `rk feedback` 可读取
- spec 清理：删除 DSL 时代占位文件，更新 WC 数量，补充 HTML-first 架构规范

**不解决（本次范围外）：**
- D2 WASM 客户端稳定性（待视觉验证，不阻塞主流程）
- ui-ux-pro-max-skill CSV 数据库集成（信息量大，独立 PRD）
- Mermaid 以外的图表引擎主题化（Graphviz/PlantUML 已 Kroki SSR，D2 无 CSS 接口）
- rk-form 字段类型扩展（当前 text/textarea/select/rating 已够用）

---

## 解决方案

### 模块 A：beautiful-mermaid 主题集成

**用户感知行为**：Agent 写 `<rk-diagram engine="mermaid">` + 任意主题，图表节点颜色、边颜色、文字颜色自动跟随页面主题，不再是统一的蓝/灰。

**系统行为**：  
`rk-diagram._renderMermaid()` 在 `mermaid.initialize()` 之前，从 DOM 读取当前主题的 CSS 变量（`--rk-bg`, `--rk-text`, `--rk-accent`, `--rk-border`, `--rk-surface`），映射到 beautiful-mermaid 的 `DiagramColors` 接口（`bg/fg/accent/line/surface/border`），生成 `themeVariables` 注入 Mermaid。

**映射关系**（来自 beautiful-mermaid `src/theme.ts`）：
```
--rk-bg       → bg
--rk-text     → fg
--rk-accent   → accent
--rk-border   → border
--rk-surface  → surface（fallback: color-mix from bg+fg 3%）
--rk-text-secondary → muted（fallback: color-mix from bg+fg 40%）
```

**关键约束**：
- beautiful-mermaid 是纯计算库，不需要 CDN 加载，逻辑可以直接内联到 `rk-diagram.ts`（参考其 `src/theme.ts` 的 `DiagramColors` 到 `themeVariables` 转换函数）
- 不引入 beautiful-mermaid 作为 npm 依赖，手动移植核心 `buildThemeVariables()` 函数（≈80行）
- Mermaid CDN 版本不变，只改 `themeVariables` 配置

---

### 模块 B：rk-form 数据提交 API

**用户感知行为**：人在页面填写 `rk-form` 并点击提交 → 看到"已提交"状态 → Agent 执行 `rk feedback hello.html` 时，除了评论，也能收到表单提交数据。

**系统行为**：

1. **新 API 路由**：`POST /api/artifacts/:id/submissions`  
   Body: `{ formTitle: string, fields: { name: string, label: string, value: any }[] }`  
   Response: `{ ok: true, submissionId: string }`

2. **DB 新表** `form_submissions`：
   ```
   id TEXT PRIMARY KEY
   artifact_id TEXT NOT NULL
   form_title TEXT
   fields TEXT (JSON)
   created_at INTEGER
   ```

3. **rk-form WC 改造**：提交时 `fetch` 当前页面的 artifact ID（从 `data-rk-artifact-id` 读取，由 html-processor 注入到 `<body>`）→ POST 到 `/api/artifacts/:id/submissions`

4. **`rk feedback` 输出扩展**：在现有评论 JSON 基础上，增加 `submissions` 数组字段：
   ```json
   {
     "openCount": 2,
     "comments": [...],
     "submissions": [
       { "id": "sub_xxx", "formTitle": "用户反馈", "fields": [...], "createdAt": "..." }
     ]
   }
   ```

**关键约束**：
- artifact ID 已经存在于页面 URL（`/a/:id`），html-processor 需要在 `<body>` 上注入 `data-rk-artifact-id` 属性
- 表单提交与评论完全独立，不合并（两个不同语义）
- `rk-form` 提交前检查 `data-rk-artifact-id` 是否存在；不存在则退化为当前 `console.log` 行为（本地 HTML 预览场景）

---

### 模块 C：Trellis Spec 清理

**变更清单**：

| 操作 | 文件/目录 | 原因 |
|---|---|---|
| 删除 | `spec/cli/frontend/`（7 个文件）| DSL 时代 React hooks 架构占位，全部 "To fill"，已无对应代码 |
| 更新 | `spec/components/index.md` | WC 数量 21 → 24，补充 rk-badge/rk-kanban/rk-form |
| 新建 | `spec/web/html-artifact-view.md` | 记录 `HtmlArtifactView.tsx` 的架构：飞书评论面板、anchor 系统、评论提交流程 |
| 更新 | `spec/web/data-layer.md` | 补充 `form_submissions` 表结构（模块 B 完成后）|
| 更新 | PRD 验收标准 | 把所有 `[ ]` 改为 `[x]` |

---

## 用户故事

1. Agent 写 `data-rk-theme="notion-clean"` 的页面，其中有 `<rk-diagram engine="mermaid">`，渲染后节点背景是 notion-clean 的 surface 色，边框是 notion-clean 的 border 色，不是默认蓝色。

2. Agent 写 `data-rk-theme="dark-pro"` 的页面，Mermaid 图表节点是深色背景 + 亮色文字，与整体页面协调。

3. 人在页面填写 `rk-form` 的星级评分和文本反馈，点击"提交"，按钮变为"✓ 已提交"。Agent 执行 `rk feedback myfile.html` 后收到的 JSON 包含 `submissions` 数组，包含刚才填写的表单内容。

4. Agent 读取 `spec/components/index.md` 时看到 24 个 WC 的准确清单，包含 rk-badge、rk-kanban、rk-form 的描述和子元素信息。

5. 新 Agent 读取 `spec/web/html-artifact-view.md` 时能理解飞书评论面板的 anchor 系统和评论提交流程，不会被旧的 DSL-era hooks 文档误导。

---

## 实现决策

### 已明确
- beautiful-mermaid 核心逻辑手动移植，不加 npm 依赖（避免 bundle 膨胀）
- `themeVariables` 从 CSS 变量读取，在 `mermaid.initialize()` 之前调用，每次 `_render()` 重新计算（支持动态主题切换）
- rk-form 的 artifact ID 来源：html-processor 注入 `<body data-rk-artifact-id="...">`，不依赖 URL 解析
- `form_submissions` 独立于 `comments` 表，`rk feedback` 合并输出
- spec 清理只删除占位文件，不删除有实质内容的 spec

### 待确认
- [ ] `rk-form` 提交成功后的 UI 状态：按钮变 "✓ 已提交"（禁用）+ toast？还是仅按钮状态？（建议：按钮禁用 + 按钮文字变化，无 toast，避免引入新依赖）
- [ ] `rk feedback` 是否需要 `--include-submissions` flag，还是默认合并输出？（建议：默认合并，简单优先）
- [ ] `spec/cli/frontend/` 删除后，是否需要重建 HTML-first 前端 spec？（建议：只建 `html-artifact-view.md`，其余按需）

---

## 验收标准

**模块 A：beautiful-mermaid**
- [ ] `paper-light` 主题下，Mermaid 流程图节点背景为浅色（非默认蓝），边框颜色跟随 `--rk-border`
- [ ] `dark-pro` 主题下，Mermaid 流程图节点为深色背景 + 亮色文字
- [ ] `notion-clean` / `linear-app` 主题各有视觉区分（截图可见差异）
- [ ] bundle 大小增加 < 5KB（移植函数不超过 100 行）

**模块 B：rk-form 数据提交**
- [ ] `POST /api/artifacts/:id/submissions` 返回 `{ ok: true, submissionId: "sub_xxx" }`
- [ ] rk-form 提交后按钮变为禁用 + 文字"✓ 已提交"
- [ ] `rk feedback hello.html` 输出 JSON 包含 `submissions` 数组
- [ ] 本地预览（无 `data-rk-artifact-id`）时退化为 `console.log`，不报错
- [ ] html-processor 在 push 时注入 `<body data-rk-artifact-id="...">`

**模块 C：Spec 清理**
- [ ] `spec/cli/frontend/` 目录已删除
- [ ] `spec/components/index.md` 组件数量为 24，包含 rk-badge/rk-kanban/rk-form 条目
- [ ] `spec/web/html-artifact-view.md` 存在，描述飞书评论面板架构
- [ ] 所有旧 PRD 的 `[ ]` 验收项改为 `[x]`

---

## 测试与验证策略

**模块 A**（视觉验证为主）：
- 用 pwcli/headless Chrome 截图验证 4 套主题下的 Mermaid 颜色差异
- 检查点：dark-pro 节点背景 ≠ paper-light 节点背景（色值不同）

**模块 B**（真实链路验证）：
- `rk push` 含 `rk-form` 的 HTML → 在浏览器填写提交 → `rk feedback` 收到 `submissions` → JSON 包含填写值
- 边界：无 `data-rk-artifact-id` 时（本地 file:// 打开），提交不报网络错误

**模块 C**（文件存在性验证）：
- `find .trellis/spec/cli -type f` 不返回 `frontend/` 目录
- `grep "24" .trellis/spec/components/index.md` 有匹配

---

## 范围外

- D2 WASM 客户端验证（视觉，独立做）
- Graphviz / PlantUML 主题化（SSR 路径，不受客户端 CSS 影响）
- rk-form 字段类型扩展（checkbox、date 等）
- ui-ux-pro-max-skill 的 BM25 搜索数据库集成（规模大，独立 PRD）
- Mermaid sequence / gantt / pie 的主题适配测试（只验证 flowchart/graph 基础场景）
- 表单数据的导出功能（CSV/JSON 下载）

---

## 风险与待确认项

| 风险 | 影响 | 应对 |
|---|---|---|
| Mermaid `themeVariables` API 在 CDN 版本中不支持所有字段 | 部分颜色不生效 | 以 flowchart 为基准验证，不支持的字段 skip |
| `color-mix()` CSS 函数在某些 WebView 不支持 | beautiful-mermaid 的 fallback 计算失败 | 降级为直接读 CSS 变量值，不做混色 |
| html-processor 注入 `data-rk-artifact-id` 破坏已有 anchor 逻辑 | anchor 位置偏移 | 只在 `<body>` 标签上加属性，不改 DOM 结构 |
| `form_submissions` 表增加导致 DB 迁移问题 | 旧 DB 启动报错 | `CREATE TABLE IF NOT EXISTS`，无 migration 风险 |
