# RenderKit Feature & Ecosystem Research
> 生成时间：2026-05-18 | 基于代码审计 + 技术生态分析

---

## 核心发现摘要

RenderKit 的当前组件覆盖了 agent 文档场景的约 **70%**。最强领域是架构图/流程图（4引擎）和项目状态文档（kanban/timeline/steps），最弱的是**通用布局原语**和**高级图表类型**——而这两个恰好是构成"任何"文档的基础。

最高价值的改进路径按性价比排序：① 扩展 ECharts 图表类型（零新依赖）→ ② 新增 `rk-card` + `rk-section` 布局原语 → ③ 新增 `rk-diff` 代码差异组件 → ④ 发布 Agent SDK（Python/JS 包装 CLI API）。

第三方 WC 生态（Shoelace / Spectrum / FAST）均不适合集成：破坏现有 vanilla WC + CSS token 架构，引入 Lit 依赖，bundle 膨胀。地图组件优先级低，可用 ECharts geo 扩展以零新依赖实现。

---

## 一、Agent 文档场景分析

### 场景覆盖矩阵

| 场景 | 高频需求组件 | RenderKit 覆盖 | 核心缺口 |
|------|-------------|---------------|---------|
| **代码审查报告** | 代码块、diff视图、指标卡、严重性标签、checklist | 🟡 部分 | 无 diff 组件，无内联注释 |
| **数据分析报告** | 多种图表、KPI卡、数据表、叙述性段落 | 🟡 部分 | 缺 radar/heatmap/funnel，无跨图联动 |
| **项目状态更新** | kanban、timeline、progress、metric、checklist | 🟢 强 | kanban 无拖拽（可接受） |
| **架构设计文档** | 流程图、C4图、ER图、决策记录、代码块 | 🟢 最强 | 几乎全覆盖 |
| **研究摘要** | 引用、callout、tabs、表格、图表 | 🟡 部分 | 无学术引用格式，layout 弱 |
| **决策记录 (ADR)** | decision、comparison(matrix)、steps、timeline | 🟢 强 | 已有 matrix variant，覆盖好 |
| **产品发布文档** | card、feature list、screenshot、badge | 🔴 弱 | 无 rk-card，rk-grid 太弱 |
| **错误/事故报告** | timeline、callout(danger)、代码块、checklist | 🟢 强 | 覆盖好 |

**修正前述评估**：`rk-comparison` 已有 `variant="matrix"` 实现多方案多维度对比，比之前描述的更成熟。

### 关键结论

- **架构类、项目管理类、决策类** 文档：当前 RenderKit 已经很强
- **产品展示类、数据分析类** 文档：最弱，需要补 card 和高级图表
- **代码审查类**：缺少 `rk-diff`，这是 agent loop 中最高频的场景之一

---

## 二、图表/可视化生态

### Observable Plot

**定位**：D3 作者 Mike Bostock 的声明式图表库，用 JSON mark 语法描述图形。

**优点**：
- JSON 驱动语法对 agent 极友好（不需要命令式代码）
- 统计图形原语强（bin、density、regression、boxplot）
- 轻量（~200KB），MIT 许可

**缺点**：
- 无内置主题系统，需要手动适配 CSS tokens
- 输出 SVG，不支持 canvas，交互性弱
- 与 ECharts 功能重叠高，带来两套 API 学习成本

**结论**：可作为 `rk-chart` 的第二引擎（`type="plot"`），专门服务统计图场景（boxplot、density、regression）。但优先级低于扩展 ECharts。

---

### Vega-Lite

**定位**：声明式图形语法，W3C adjacent，统计可视化研究背景。

**优点**：JSON spec 完全声明式，理论上最适合 agent 生成

**缺点**：
- bundle 重（~2MB），加载比 ECharts 慢
- Spec 复杂度高（transform、selection DSL），agent 生成错误率高
- 与 ECharts 大量重叠

**结论**：❌ 不引入。ECharts 覆盖 90% 的图表需求，Vega-Lite 的差异化价值（统计变换）可通过 Observable Plot 补充。

---

### ECharts 扩展类型（🔑 最高性价比）

当前已通过 CDN 加载 ECharts 5（`echarts@5/dist/echarts.esm.min.js`）。以下图表类型**无需任何新依赖**，只需在 `rk-chart.ts` 增加 switch case：

| 类型 | ECharts 内置 | agent 使用频率 | 实现成本 |
|------|-------------|--------------|---------|
| `radar` | ✓ | 高（能力评估、对比雷达图） | 极低 |
| `funnel` | ✓ | 高（转化漏斗、流程流失） | 极低 |
| `gauge` | ✓ | 中（进度、KPI达成率） | 极低 |
| `heatmap` | ✓ | 中（活跃度、相关性矩阵） | 低 |
| `treemap` | ✓ | 中（文件大小、预算分配） | 低 |
| `sankey` | ✓ | 中（资金流向、数据流转） | 低 |
| `boxplot` | ✓ | 低（统计分布） | 中 |
| `candlestick` | ✓ | 低（金融数据） | 低 |

**推荐立即实现**：radar + funnel + gauge（3个最高频，各约 20 行代码）。

---

### Chart.js

**结论**：❌ 不引入。ECharts 已在使用，Chart.js 没有增量价值，只增加包管理复杂度。

---

## 三、Web Component 生态集成

### Shoelace / Web Awesome

**状态**：最成熟的开源 WC 组件库（sl-card、sl-dialog、sl-alert、sl-tree 等 50+ 组件）

**集成障碍**：
1. 依赖 **Lit** 框架（100KB+），RenderKit 使用 vanilla WC，引入 Lit 改变架构范式
2. Shoelace 的 CSS 变量体系（`--sl-*`）与 RenderKit 的 `--rk-*` token 体系需要大量 bridge
3. Bundle 增加约 200KB gzipped
4. Shoelace 的 `sl-card`、`sl-badge` 等功能上虽然好，但 RenderKit 可以用 100 行内 vanilla WC 实现

**结论**：❌ 不集成。自建成本低于适配成本，且保持架构一致性。可以参考 Shoelace 的 API 设计模式（属性命名、slot 约定）。

---

### Adobe Spectrum Web Components

**结论**：❌ 明确不适合。企业级重型框架，bundle 超大，面向 Adobe 产品生态，与 RenderKit 定位完全不匹配。

---

### Microsoft FAST

**结论**：❌ 不适合。FAST 是 WC 框架而非组件库，意味着要用 FAST 重写所有现有组件。

---

### GitHub Primer Web Components

**有价值的个别组件**：
- `@github/relative-time-element`：相对时间显示（"3 hours ago"），kanban/timeline 中有用
- `@github/clipboard-copy-element`：一键复制，代码块中有用

**结论**：🟡 不整体集成，但可以把 `relative-time` 和 `clipboard-copy` 的**实现逻辑**内联进 `rk-kanban` 和 `rk-code`，无需外部依赖。

---

### 总结：自建策略正确

RenderKit vanilla WC + CSS token 的架构选择在 agent 工具场景是最优解：
- 零框架依赖 → agent 生成的 HTML 文件可独立运行
- 直接继承 `--rk-*` tokens → 8 主题开箱即用
- 单一 `components.js` bundle → 一行 script 标签引入

---

## 四、地图/地理可视化

### 需求评估

agent 场景中地理数据可视化需求：**低到中**。
- 常见：销售区域分布、用户地理分布、资产区域地图
- 不常见：路由规划、实时位置、复杂地形图

### 方案对比

| 方案 | 零额外依赖 | agent友好 | 主题适配 | 推荐度 |
|------|-----------|----------|---------|-------|
| ECharts geo 扩展 | ✓（已加载） | 中（需 GeoJSON） | ✓ | 🟢 |
| 内置 SVG 世界地图轮廓 | ✓ | 高（内联数据） | ✓ | 🟢 |
| Leaflet CDN | ✗（新依赖+tiles服务） | 低（配置复杂） | 需适配 | 🔴 |
| MapboxGL | ✗（需API key） | 低 | 需适配 | 🔴 |
| DeckGL | ✗（很重） | 低 | 需适配 | 🔴 |

**结论**：
- 不引入 Leaflet/MapboxGL
- 用 ECharts 内置 geo 功能（`rk-chart type="map"`），bundled GeoJSON 只需世界/国家级别
- 优先级 P2，不阻塞其他开发

---

## 五、新组件优先级矩阵

按「agent 需求频率 × 实现成本倒数」排序：

### 🔴 P0 — 立即做（高频 × 低成本）

**1. `rk-chart` 扩展：radar + funnel + gauge**
- 利用已加载的 ECharts，只加代码分支
- radar：雷达/蜘蛛图，能力对比必备
- funnel：转化漏斗，产品/运营报告必备
- gauge：单值达成率，KPI类文档
- **实现：约 60 行，修改 `rk-chart.ts`**

**2. `rk-card`**
- 产品展示、功能介绍、团队成员、定价表的基础砖块
- 属性：`title`, `subtitle`, `icon`, `badge`, `accent`, `link`，slot 为卡片内容
- **实现：约 80 行新 WC**

### 🟠 P1 — 本期内做（高频 × 中成本）

**3. `rk-section` / `rk-layout`（取代弱 rk-grid）**
- 支持命名列（`cols="2:1"`意为2/3:1/3）、gap、align、responsive breakpoint
- 解决"只能线性堆叠"的根本问题
- **实现：约 60 行新 WC + CSS，可向后兼容 rk-grid**

**4. `rk-diff`**
- unified diff 格式解析 + 高亮（+ 行绿色，- 行红色，@@ 块头）
- 对 code review artifact 是核心组件
- 属性：`filename`, `lang`, `caption`，内容为 unified diff 文本
- **实现：约 120 行新 WC（含 diff 解析器）**

**5. `rk-chart type="heatmap"` + `type="treemap"`**
- heatmap：活跃度热图（GitHub contribution style）、相关性矩阵
- treemap：层级数据分布（文件大小、预算）
- **实现：约 40 行，修改 `rk-chart.ts`**

### 🟡 P2 — 下期（中频 × 中成本）

**6. `rk-chart type="sankey"`**
- 资金/数据流向桑基图，ECharts 已内置
- **实现：约 30 行**

**7. `rk-map` — 世界/省市 choropleth**
- ECharts geo 引擎，内置世界地图 GeoJSON（精简版，约 50KB）
- 属性：`region="world|china"`, `title`, `data`（JSON 格式：`[{name, value}]`）
- **实现：约 100 行新 WC**

**8. `rk-notebook`**
- Jupyter-style 单元格容器：代码 + 输出 + 叙述的组合展示
- 对 data science agent 输出场景极有价值
- **实现：约 80 行新 WC**

### 🔵 P3 — 视需求（低频 × 高成本）

**9. `rk-gantt`**
- 项目甘特图（任务、依赖、里程碑）
- Mermaid 已有 gantt 语法，用 `rk-diagram engine="mermaid"` 可替代
- 只有需要交互式甘特时才单独实现

**10. `rk-embed`**
- iframe 嵌入（Figma、YouTube、GitHub Gist）
- 安全性需仔细考量（sandbox 属性），低优先级

---

## 六、Agent 工具链集成

### 当前集成模式

```
agent → rk push <file.html> → HTTP API → SQLite → 浏览器
```

CLI 是唯一正式接口。优点：简单；缺点：仅支持 Node 环境的 agent。

### 高价值集成机会

**① Python SDK（最高优先级）**

大量 agent 框架（LangChain、CrewAI、AutoGen）以 Python 为主。

```python
# 期望的使用方式
from renderkit import RenderKitClient

rk = RenderKitClient("http://localhost:3737")
result = rk.push(html_content, title="Analysis Report")
feedback = rk.get_feedback(result.artifact_id)
```

实现：纯 HTTP 包装，无复杂逻辑，约 150 行。

**② 系统提示词库（System Prompt Library）**

不依赖框架，任何 agent 都能用：提供教 LLM 使用 rk-* 标签的 prompt 片段。

```markdown
# RenderKit Components Reference
Use these HTML custom elements to create rich documents...

<rk-chart type="bar" title="Sales">
| Month | Revenue |
|-------|---------|
| Jan   | 12000   |
</rk-chart>
```

已有 `SKILL.md` 雏形，需要扩展为完整的 few-shot 示例库。

**③ LangGraph / LangChain 集成**

LangGraph 有 artifact streaming 节点概念。可以提供：
- `RenderKitArtifactTool`：LangChain Tool，包装 rk push
- 模板：HTML artifact 生成 → push → 等待 feedback → 迭代的 graph template

优先级：在 Python SDK 之后，约 50 行额外代码。

**④ Claude Artifacts 兼容层**

Claude 可以在 Artifacts UI 中渲染 HTML。提供 CDN 链接让 rk-* 组件在 Claude Artifacts 中也能运行：

```html
<script src="https://cdn.renderkit.dev/components.js"></script>
<link rel="stylesheet" href="https://cdn.renderkit.dev/theme.css" />
```

这将 RenderKit 的 WC 库变成一个可用于任何 HTML 环境的组件系统，不再局限于本地服务。

**重要**：这不需要任何服务器——只是 WC 库的 CDN 分发。

---

## 七、不做什么

| 方向 | 理由 |
|------|------|
| Shoelace / Spectrum / FAST 集成 | 破坏 vanilla WC 架构，引入 Lit，bundle 膨胀 |
| Leaflet / MapboxGL | 需要 tile 服务，API key，与本地优先定位冲突 |
| Vega-Lite 集成 | 重复 ECharts 价值，spec 复杂度高，bundle 重 |
| 拖拽式 kanban | 本地展示工具，agent 写静态状态，不需要交互式看板 |
| 实时协作 / 多人编辑 | 定位明确：agent-human 单向展示 + 评论，非协作工具 |
| `"use cache"` on artifact pages | 本地工具，SQLite 已极快，无 QPM 压力，复杂性不值得 |
| Jupyter notebook 服务器集成 | 超出 HTML artifact 定位，scope 蔓延 |

---

## 优先级总表

| 优先级 | 功能 | 预估成本 | 价值 |
|--------|------|---------|------|
| P0 | rk-chart: radar+funnel+gauge | 60 行 | agent 常用图表补全 |
| P0 | rk-card | 80 行 | 现代文档基础砖块 |
| P1 | rk-section（增强布局） | 60 行 | 解决线性堆叠根本问题 |
| P1 | rk-diff | 120 行 | 代码审查 artifact 核心组件 |
| P1 | rk-chart: heatmap+treemap | 40 行 | 高级数据可视化 |
| P2 | Python SDK | 150 行 | 打开 Python agent 生态 |
| P2 | System Prompt Library 扩展 | 文档 | 任何 agent 立即可用 |
| P2 | rk-map | 100 行 | 地理数据可视化 |
| P2 | rk-notebook | 80 行 | data science agent 场景 |
| P3 | Claude Artifacts CDN 分发 | 配置 | 非本地场景的覆盖 |
| P3 | LangGraph 集成模板 | 50 行 | 在 Python SDK 之后 |
