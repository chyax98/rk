---
name: renderkit-author
description: >-
  Use when writing HTML documents with RenderKit Web Components (<rk-*>).
  Covers theme selection, all 44 WC syntax, anti-slop design rules, and the
  push→feedback→iterate CLI loop. Trigger on: "用 RenderKit 写" "rk push"
  "生成 artifact" "写个文档" "HTML artifact" "renderkit" or any request
  to create a document for human review.
---

# RenderKit Author Skill

更新时间：2026-05-18（v3：44 WCs，+可视化全家桶 + SSR + render-error 反馈）

RenderKit 让 Agent 用 HTML + `<rk-*>` Web Components 写文档，服务端渲染后在浏览器展示。人类可以在文档上添加轻量评论（不影响文档阅读体验），Agent 读取 JSON 评论迭代优化。文档始终全宽展示，评论以浮层/角标形式呈现。

---

## 1. 快速开始

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>我的文档</title>
  <link rel="stylesheet" href="/rk/components.css">
  <link rel="stylesheet" href="/rk/theme.css">
  <script type="module" src="/rk/components.js"></script>
</head>
<body data-rk-theme="paper-light">

  <h1>文档标题</h1>
  <p>正文内容...</p>

  <rk-callout type="info" title="提示">这是一个信息提示框。</rk-callout>

  <rk-metric cols="3">
    <rk-metric-item label="用户数" value="12,480" delta="+8%"></rk-metric-item>
    <rk-metric-item label="转化率" value="3.2%" delta="+0.4%"></rk-metric-item>
    <rk-metric-item label="收入" value="¥48万" delta="+12%"></rk-metric-item>
  </rk-metric>

</body>
</html>
```

推送：`rk push doc.html`
查看评论：`rk feedback doc.html`

---

## 2. 主题选择

在 `<body data-rk-theme="xxx">` 设置：

| 主题名 | 适用场景 |
|---|---|
| `paper-light` | **默认**。长文档、报告、方案 |
| `dark-pro` | 技术报告、系统设计、架构文档 |
| `notion-clean` | 协作文档、知识库、项目 Wiki |
| `linear-app` | 产品 roadmap、sprint 回顾 |
| `amber-terminal` | 运维 Runbook、故障排查 |
| `glassmorphism` | 产品发布、视觉展示 |
| `ibm-enterprise` | 企业报告、合规文档 |
| `editorial-kami` | 设计提案、创意简报 |

**所有主题通过 `/rk/theme.css` 自包含**——artifact HTML 独立打开即有正确主题样式，无需依赖 Next.js 应用注入。

---

## 3. Web Component 完整参考（44 个）

### rk-callout — 标注框

```html
<!-- type: info | warning | danger | success | neutral -->
<rk-callout type="warning" title="注意">
  这是警告内容，支持 <strong>加粗</strong> 等 HTML。
</rk-callout>
```

### rk-code — 代码块（Shiki SSR 高亮）

```html
<rk-code lang="typescript" title="示例">
const x: number = 42;
console.log(x);
</rk-code>

<!-- lang: typescript | javascript | python | bash | json | yaml | css | html | rust | go | sql | ... -->
<!-- frame: "window" | "terminal" (可选，默认无边框) -->
```

### rk-metric — 指标卡片组

```html
<rk-metric cols="3">
  <rk-metric-item label="营收" value="¥120万" delta="+23%"></rk-metric-item>
  <rk-metric-item label="用户" value="8,420" delta="-2%" tone="warning"></rk-metric-item>
  <rk-metric-item label="NPS" value="72"></rk-metric-item>
</rk-metric>
<!-- cols: 2 | 3 | 4 -->
<!-- tone on item: success | warning | danger | info -->
```

### rk-stat — 单个统计数字

```html
<rk-stat value="98.5%" unit="可用率" label="过去 30 天" delta="+0.3%"></rk-stat>
```

### rk-chart — ECharts 图表

```html
<!-- JSON 数组格式（推荐）：自动识别字段，多列自动生成多系列 -->
<rk-chart type="line" title="月度活跃用户">
[
  { "month": "1月", "mau": 98000, "dau": 12000 },
  { "month": "2月", "mau": 112000, "dau": 15000 },
  { "month": "3月", "mau": 128400, "dau": 18200 }
]
</rk-chart>

<!-- Markdown 管道表格格式（备选） -->
<rk-chart type="bar" title="月度用户">
| 月份 | 用户 |
|------|-----|
| 1月 | 1200 |
| 2月 | 1580 |
</rk-chart>

<!-- type: bar | line | area | pie | scatter | funnel | radar | gauge -->

<!-- funnel: 转化漏斗 -->
<rk-chart type="funnel" title="转化漏斗">
[
  { "stage": "访问", "count": 10000 },
  { "stage": "注册", "count": 3500 },
  { "stage": "付费", "count": 800 }
]
</rk-chart>

<!-- radar: 单系列（管道表）或多系列 JSON -->
<rk-chart type="radar" title="能力评估">
| 维度 | 得分 |
|------|------|
| 速度 | 85 |
| 准确性 | 72 |
| 可靠性 | 90 |
</rk-chart>
<!-- 多系列 JSON：{ axes, series: [{name, values}] } -->
<rk-chart type="radar" title="多方对比">
{
  "axes": ["速度", "准确性", "可靠性", "易用性"],
  "series": [
    { "name": "产品 A", "values": [85, 72, 90, 78] },
    { "name": "产品 B", "values": [65, 88, 75, 92] }
  ]
}
</rk-chart>

<!-- gauge: 仪表盘，{ value, name?, min?, max? } -->
<rk-chart type="gauge" title="NPS 评分">
{ "value": 72, "name": "NPS", "min": 0, "max": 100 }
</rk-chart>
```

### rk-diagram — 图表（4 引擎 SSR）

```html
<!-- Mermaid -->
<rk-diagram engine="mermaid" title="流程图">
flowchart TD
  A[开始] --> B{判断}
  B -->|是| C[执行]
  B -->|否| D[结束]
</rk-diagram>

<!-- D2 (服务端 spawn d2 binary) -->
<rk-diagram engine="d2" title="架构图">
server -> database: query
client -> server: HTTP
</rk-diagram>

<!-- Graphviz/DOT (Kroki SSR) -->
<rk-diagram engine="graphviz" title="依赖图">
digraph G {
  rankdir=LR;
  CLI -> Server [label="push"];
}
</rk-diagram>

<!-- PlantUML (Kroki SSR) -->
<rk-diagram engine="plantuml" title="时序图">
@startuml
A -> B: 请求
B --> A: 响应
@enduml
</rk-diagram>
```

**引擎说明**：
| 引擎 | 渲染方式 | 说明 |
|---|---|---|
| mermaid | 服务端 Kroki SSR（失败回退客户端 CDN） | 默认，语法简单 |
| d2 | 服务端 spawn `d2` binary（需本地安装） | 声明式架构图，`rk doctor` 检测安装 |
| graphviz/dot | 服务端 Kroki SSR | 自动布局，依赖/关系图 |
| plantuml | 服务端 Kroki SSR | 最完整 UML 支持 |

> **注意**：所有 4 个引擎均在服务端预渲染为 SVG 内联到 HTML。客户端无需加载额外 JS。如果 SSR 失败（如 d2 未安装），回退到客户端渲染（mermaid）或显示警告。

### rk-checklist — 待办/检查列表

```html
<rk-checklist title="发布前检查">
  <rk-item checked>代码审查完成</rk-item>
  <rk-item checked>测试全部通过</rk-item>
  <rk-item>更新 changelog</rk-item>
</rk-checklist>
```

### rk-steps — 步骤/流程

```html
<rk-steps title="部署流程" current="2">
  <rk-step>构建镜像</rk-step>
  <rk-step>推送到 Registry</rk-step>
  <rk-step>灰度发布 10%</rk-step>
  <rk-step>全量上线</rk-step>
</rk-steps>
```

### rk-timeline — 时间线

```html
<rk-timeline title="项目里程碑">
  <rk-step date="2026-01" status="done">立项</rk-step>
  <rk-step date="2026-03" status="done">Alpha 发布</rk-step>
  <rk-step date="2026-05" status="active">Beta 测试</rk-step>
  <rk-step date="2026-07">正式上线</rk-step>
</rk-timeline>
```

### rk-tabs — 标签页

```html
<rk-tabs title="环境配置">
  <rk-tab label="开发环境">
    <rk-code lang="bash">npm run dev</rk-code>
  </rk-tab>
  <rk-tab label="生产环境">
    <rk-code lang="bash">npm run build && npm start</rk-code>
  </rk-tab>
</rk-tabs>
```

### rk-table — 数据表格

```html
<rk-table title="团队成员">
  <thead>
    <tr><th>姓名</th><th>角色</th><th>状态</th></tr>
  </thead>
  <tbody>
    <tr><td>张三</td><td>前端</td><td>在线</td></tr>
    <tr><td>李四</td><td>后端</td><td>离线</td></tr>
  </tbody>
</rk-table>
```

### rk-decision — 决策记录

```html
<rk-decision question="选择哪个数据库？" chosen="PostgreSQL" status="approved">
  <rk-reason>
    <li>成熟的 ACID 支持</li>
    <li>团队熟悉度高</li>
  </rk-reason>
  <rk-alternative>MySQL — 性能相近但生态较弱</rk-alternative>
</rk-decision>
<!-- status: proposed | approved | rejected | superseded -->
```

### rk-comparison — 对比表

```html
<rk-comparison title="方案对比" variant="proscons">
| 维度 | 方案 A | 方案 B |
| 性能 | ✓ 高 | △ 中 |
| 成本 | △ 高 | ✓ 低 |
</rk-comparison>
```

### rk-summary — 摘要卡

```html
<rk-summary title="执行摘要">
  本季度完成了三项核心功能。整体进度符合预期。
</rk-summary>
```

### rk-quote — 引用

```html
<rk-quote attribution="Steve Jobs" source="2005 Stanford Commencement">
  Stay hungry, stay foolish.
</rk-quote>
```

### rk-highlight — 内联高亮

```html
<p>这是正文，<rk-highlight label="重要">高亮这段文字</rk-highlight>，继续正文。</p>
```

### rk-collapsible — 折叠面板

```html
<rk-collapsible summary="点击展开详情">
  这里是折叠的详细内容，默认收起。
</rk-collapsible>
<!-- open 属性让其默认展开 -->
```

### rk-progress — 进度条

```html
<rk-progress label="完成度" value="73" max="100" tone="success"></rk-progress>
<!-- tone: default | success | warning | danger | info -->
```

### rk-grid — 网格布局

```html
<rk-grid cols="2" gap="4">
  <div>左侧内容</div>
  <div>右侧内容</div>
</rk-grid>
<!-- cols: 1-6，gap: 1-8（spacing scale） -->
```

### rk-image — 图片

```html
<rk-image src="https://..." alt="说明" caption="图注" width="100%"></rk-image>
```

### rk-3d — 3D 场景（Three.js）

```html
<rk-3d preset="globe" height="400px"></rk-3d>
<!-- preset: globe | particles | wave | torus -->
```

### rk-badge & rk-badge-group — 标签组

```html
<rk-badge-group>
  <rk-badge color="blue">TypeScript</rk-badge>
  <rk-badge color="green" icon="✓">已上线</rk-badge>
  <rk-badge color="orange">Beta</rk-badge>
  <rk-badge color="red">Breaking</rk-badge>
  <rk-badge color="purple">实验性</rk-badge>
  <rk-badge color="gray">已废弃</rk-badge>
  <rk-badge color="accent">核心功能</rk-badge>
</rk-badge-group>
<!-- color: blue | green | red | orange | purple | gray | accent -->
```

### rk-kanban — 看板

```html
<rk-kanban>
  <rk-kanban-col title="待办">
    <rk-kanban-card priority="high" tag="bug" assignee="张三" due="05-20">
      修复登录问题
    </rk-kanban-card>
  </rk-kanban-col>
  <rk-kanban-col title="进行中" accent="blue">
    <rk-kanban-card tag="design">设计系统扩展</rk-kanban-card>
  </rk-kanban-col>
  <rk-kanban-col title="完成" done>
    <rk-kanban-card>CLI 重写</rk-kanban-card>
  </rk-kanban-col>
</rk-kanban>
<!-- priority: high | medium | low -->
<!-- accent: blue | green | orange | red -->
<!-- done: 完成列（绿色顶部边框）-->
```

### rk-card — 内容卡片

```html
<!-- variant: default | outlined | elevated | filled -->
<!-- accent: info | success | warning | danger | (none) -->
<rk-card title="卡片标题" subtitle="副标题" variant="outlined" accent="info">
  <p>卡片内容，支持任何 rk-* 子组件。</p>
  <rk-callout type="warning" title="注意">内容示例。</rk-callout>
</rk-card>

<!-- 无标题纯容器 -->
<rk-card variant="elevated">
  <rk-metric cols="2">...</rk-metric>
</rk-card>
```

### rk-section — 文档章节

```html
<!-- level: h2 | h3 | h4 (默认 h2) -->
<!-- divider: 有无顶部分割线 -->
<rk-section title="章节标题" subtitle="章节说明" level="h2" divider>
  <p>章节内容...</p>
  <rk-card title="子卡片">...</rk-card>
</rk-section>

<!-- 用于组织长文档结构，比裸 <h2> 更语义化 -->
<rk-section title="数据分析" level="h3">
  <rk-chart type="bar" title="月度趋势">...</rk-chart>
</rk-section>
```

### rk-diff — 代码差异

```html
<!-- 接受标准 unified diff 格式（git diff 输出）-->
<rk-diff lang="typescript" title="fix: 修复认证逻辑" from="auth.ts" to="auth.ts">
--- a/auth.ts
+++ b/auth.ts
@@ -12,7 +12,7 @@ export function verify(token: string) {
   const decoded = jwt.decode(token);
-  if (decoded.exp < Date.now()) {
+  if (decoded.exp <= Date.now()) {
     throw new Error('Token expired');
   }
 }
</rk-diff>
```

属性：`lang`（语言标记）、`title`（标题）、`from`（原文件名）、`to`（新文件名）

### rk-form — 结构化反馈表单

```html
<rk-form title="文档审阅" submit-label="提交反馈" description="请对文档提供意见。">
  <rk-field label="整体评分" type="rating" max="5" required></rk-field>
  <rk-field label="主要问题" type="textarea" placeholder="描述问题..."></rk-field>
  <rk-field label="优先级" type="select" options="高,中,低"></rk-field>
  <rk-field label="联系方式" type="text" placeholder="邮箱或姓名"></rk-field>
</rk-form>
<!-- type: text | textarea | select | rating | checkbox | number -->
```

### rk-narrative — 内联数据叙事

在文本中嵌入迷你图、高亮数值、进度条、标签。**零外部依赖**。

```html
<rk-narrative>
{
  "phrases": [
    {"text": "Monthly revenue reached "},
    {"value": "¥2.4M", "trend": "up", "delta": "+23%"},
    {"text": " this quarter, with "},
    {"sparkline": [120, 145, 132, 178, 210, 198, 240], "color": "green"},
    {"text": " showing strong growth. "},
    {"badge": "Q3 2026"},
    {"text": " | Target: "},
    {"bar": 78, "max": 100, "color": "blue"}
  ]
}
</rk-narrative>
```

**phrase 类型**：

| type | 字段 | 渲染 |
|------|------|------|
| `{text}` | text | 纯文本 |
| `{value, trend?, delta?, color?}` | — | 高亮数字 + 趋势箭头 + delta 标签 |
| `{sparkline, color?, height?}` | — | 内联迷你折线图（SVG polyline） |
| `{bar, max, color?}` | — | 内联迷你进度条 |
| `{badge, color?}` | — | 彩色标签 |

**属性**：`title`（可选标题）

### rk-plot — Observable Plot 统计图表

通过声明式 JSON spec 生成统计图表。支持 Observable Plot 的 grammar of graphics。

```html
<rk-plot title="收入分布" caption="数据来源：财务系统" height="300">
{
  "marks": [
    {"type": "dot", "data": [{"x": 1, "y": 2}, {"x": 2, "y": 5}, {"x": 3, "y": 3}], "x": "x", "y": "y"},
    {"type": "line", "data": [{"x": 1, "y": 2}, {"x": 2, "y": 5}, {"x": 3, "y": 3}], "x": "x", "y": "y"}
  ],
  "grid": true
}
</rk-plot>
```

**属性**：`title`、`caption`、`height`（默认 300）

**mark 类型**：`dot`、`line`、`bar`、`barX`、`barY`、`rectY`、`rectX`、`areaY`、`text`、`ruleX`、`ruleY`、`tickX`、`tickY`

**CDN**：`@observablehq/plot@0.6`（运行时懒加载）

### rk-plot3d — Plotly.js 3D 图表

3D 科学可视化。支持 Plotly 的声明式 JSON 格式。

```html
<rk-plot3d title="3D Surface" height="500" caption="地形高程数据">
{
  "data": [{"type": "surface", "z": [[1,2,3],[4,5,6],[7,8,9]]}],
  "layout": {"title": "Surface Plot"}
}
</rk-plot3d>
```

**属性**：`title`、`height`（默认 450）、`caption`

**3D trace 类型**：`scatter3d`、`surface`、`mesh3d`、`cone`、`streamtube`
**也支持 2D 类型**：`scatter`、`bar`、`pie`、`heatmap`、`contour`

**CDN**：`plotly.js-dist-min@2`（运行时懒加载）

### rk-map — 交互式地图（Leaflet）

OpenStreetMap 瓦片地图，支持标记点。**无需 API key**。

```html
<rk-map center="31.23,121.47" zoom="10" height="400" title="上海">
[
  {"lat": 31.23, "lng": 121.47, "label": "Shanghai"},
  {"lat": 39.90, "lng": 116.41, "label": "Beijing"}
]
</rk-map>

<!-- 空地图 -->
<rk-map center="51.505,-0.09" zoom="13" height="300"></rk-map>

<!-- 暗色瓦片 -->
<rk-map center="40.71,-74.01" zoom="12" tiles="carto-dark" title="NYC"></rk-map>
```

**属性**：

| Attr | 默认 | 说明 |
|------|------|------|
| `center` | `"30,105"` | `"lat,lng"` |
| `zoom` | 4 | 缩放级别 |
| `height` | 400 | 地图高度 px |
| `title` | — | 可选标题栏 |
| `tiles` | `"osm"` | `"osm"` / `"carto-light"` / `"carto-dark"` |

**数据格式**：JSON 数组 `[{"lat", "lng", "label?", "color?"}]`

**CDN**：`leaflet@1.9.4`（ESM，运行时懒加载）

### rk-globe — 3D 地球仪（Globe.gl）

WebGL 3D 地球数据可视化。

```html
<rk-globe height="500" title="全球收入分布" auto-rotate>
[
  {"lat": 37.77, "lng": -122.42, "size": 0.8, "color": "#3b82f6", "label": "San Francisco"},
  {"lat": 51.51, "lng": -0.13, "size": 0.6, "color": "#10b981", "label": "London"},
  {"lat": 31.23, "lng": 121.47, "size": 1.0, "color": "#f59e0b", "label": "Shanghai"}
]
</rk-globe>
```

**属性**：`height`（默认 500）、`title`、`auto-rotate`（布尔属性）

**数据格式**：JSON 数组 `[{"lat", "lng", "size?", "color?", "label?"}]`

**CDN**：`globe.gl@2.31.0`（运行时懒加载）

### rk-graph — 2D 网络图（Cytoscape.js）

知识图谱、关系网络、依赖图。

```html
<rk-graph title="知识图谱" height="400" layout="cose">
{
  "nodes": [
    {"id": "react", "label": "React", "group": "framework"},
    {"id": "vue", "label": "Vue", "group": "framework"},
    {"id": "frontend", "label": "Frontend", "group": "domain"}
  ],
  "edges": [
    {"source": "react", "target": "frontend", "label": "is"},
    {"source": "vue", "target": "frontend", "label": "is"}
  ]
}
</rk-graph>
```

**属性**：`title`、`height`（默认 400）、`layout`（`cose` | `circle` | `grid` | `breadthfirst` | `concentric`）

**数据格式**：
- `nodes`: `[{"id", "label?", "group?"}]`
- `edges`: `[{"source", "target", "label?"}]`

**CDN**：`cytoscape@3`（ESM，运行时懒加载）

### rk-graph3d — 3D 网络图（3d-force-graph）

WebGL 3D 力导向图。

```html
<rk-graph3d title="知识图谱" height="500" dag>
{
  "nodes": [
    {"id": "A", "label": "React", "group": 1},
    {"id": "B", "label": "Vue", "group": 1},
    {"id": "C", "label": "Frontend", "group": 2}
  ],
  "links": [
    {"source": "A", "target": "C", "label": "is"},
    {"source": "B", "target": "C", "label": "is"}
  ]
}
</rk-graph3d>
```

**属性**：`title`、`height`（默认 500）、`dag`（布尔属性，启用 DAG 布局）

**数据格式**：
- `nodes`: `[{"id", "label?", "group?"}]`
- `links`: `[{"source", "target", "label?"}]`

**CDN**：`3d-force-graph@1`（运行时懒加载）

### rk-flow — 流程图（@antv/x6）

流程图、DAG、架构图。自动布局。

```html
<rk-flow title="数据流水线" height="350">
{
  "nodes": [
    {"id": "src", "label": "数据源", "shape": "rect"},
    {"id": "etl", "label": "ETL", "shape": "rect"},
    {"id": "db", "label": "数据库", "shape": "rect"},
    {"id": "api", "label": "API", "shape": "rect"}
  ],
  "edges": [
    {"source": "src", "target": "etl", "label": "采集"},
    {"source": "etl", "target": "db", "label": "写入"},
    {"source": "db", "target": "api", "label": "查询"}
  ]
}
</rk-flow>
```

**属性**：`title`、`height`（默认 350）、`readonly`（布尔属性）

**数据格式**：
- `nodes`: `[{"id", "label", "shape?"|"rect", "x?", "y?"}]`（无 x/y 自动布局）
- `edges`: `[{"source", "target", "label?"}]`

**CDN**：`@antv/x6@2`（运行时懒加载）

### rk-datagrid — 企业数据表（AG Grid）

企业级排序/筛选/分页表格。

```html
<rk-datagrid title="产品清单" height="400" theme="alpine" pagination page-size="20">
{
  "columns": [
    {"field": "name", "headerName": "产品"},
    {"field": "revenue", "headerName": "收入", "sortable": true},
    {"field": "status", "headerName": "状态"}
  ],
  "rows": [
    {"name": "Product A", "revenue": 12000, "status": "Active"},
    {"name": "Product B", "revenue": 8500, "status": "Draft"}
  ]
}
</rk-datagrid>
```

**属性**：

| Attr | 默认 | 说明 |
|------|------|------|
| `title` | — | 可选标题 |
| `height` | 400 | 高度 px |
| `theme` | `alpine` | `alpine` / `alpine-dark` / `balham` |
| `pagination` | — | 布尔，启用分页 |
| `page-size` | 20 | 每页行数 |

**数据格式**：`{"columns": [{"field", "headerName?"}], "rows": [{...}]}`

**CDN**：`ag-grid-community@32`（JS + CSS 主题，运行时懒加载）

### rk-infographic — 信息图（@antv/infographic）

AntV 信息图组件，预设模板。

```html
<rk-infographic title="项目里程碑" height="400">
infographic list-row-simple-horizontal-arrow
data
  lists
    - label Step 1
      desc 需求分析
    - label Step 2
      desc 开发实现
    - label Step 3
      desc 测试上线
</rk-infographic>
```

**属性**：`title`、`height`（默认 400）、`theme`（AntV 主题名）

**CDN**：`@antv/infographic@0.2`（运行时懒加载）

### rk-sketch — 手绘草图（Rough.js）

手绘风格 SVG 图表。适合架构草图、概念图。

```html
<rk-sketch width="500" height="200" roughness="1.5" title="System Architecture">
{
  "shapes": [
    {"type": "rect", "x": 20, "y": 20, "w": 120, "h": 60, "label": "Client", "fill": "#dbeafe"},
    {"type": "rect", "x": 220, "y": 20, "w": 120, "h": 60, "label": "Server", "fill": "#dcfce7"},
    {"type": "arrow", "x1": 140, "y1": 50, "x2": 220, "y2": 50, "label": "HTTP"},
    {"type": "circle", "cx": 350, "cy": 150, "r": 30, "label": "DB"},
    {"type": "line", "x1": 280, "y1": 80, "x2": 350, "y2": 120}
  ]
}
</rk-sketch>
```

**属性**：`width`（默认 500）、`height`（默认 300）、`roughness`（默认 1.5）、`title`

**shape 类型**：`rect`、`circle`、`ellipse`、`line`、`arrow`（line + 箭头）、`path`

**per-shape 选项**：`fill`、`stroke`、`roughness`、`strokeWidth`、`fillStyle`、`label`

**CDN**：`roughjs@4`（ESM，运行时懒加载）

### rk-zdog — 伪 3D 插画（Zdog）

轻量伪 3D 矢量插画。支持拖拽旋转。

```html
<rk-zdog width="300" height="300" rotate zoom="1" title="3D Icon">
{
  "shapes": [
    {"type": "box", "width": 80, "height": 80, "depth": 80, "color": "#636",
     "leftFace": "#c25", "rightFace": "#e62", "topFace": "#e5a"},
    {"type": "cylinder", "diameter": 40, "length": 60, "color": "#636",
     "translate": {"y": -60}}
  ]
}
</rk-zdog>
```

**属性**：`width`（默认 300）、`height`（默认 300）、`rotate`（布尔，自动旋转）、`zoom`（默认 1）、`title`

**shape 类型**：`box`、`sphere`、`cylinder`、`cone`、`rect`、`ellipse`、`polygon`

**per-shape 选项**：`translate`、`rotate`（度数）、各面颜色

**CDN**：`zdog@1`（运行时懒加载）

### rk-model — 3D 模型查看器（Google model-viewer）

GLTF/GLB 模型展示。支持 AR、自动旋转、摄像机控制。

```html
<rk-model src="./robot.glb" title="产品模型" height="400"
          ar auto-rotate camera-controls
          poster="./preview.webp"
          shadow-intensity="1" exposure="1">
</rk-model>
```

**属性**：

| Attr | 默认 | 说明 |
|------|------|------|
| `src` | (required) | GLTF/GLB 文件路径 |
| `poster` | — | 加载中预览图 |
| `title` | — | 可选标题 |
| `height` | 400 | 容器高度 px |
| `ar` | false | 启用 AR |
| `auto-rotate` | false | 自动旋转 |
| `camera-controls` | false | 用户可拖拽/缩放 |
| `shadow-intensity` | 1 | 阴影强度 |
| `exposure` | — | 光照曝光 |

**CDN**：`model-viewer@3.5.0`（Google CDN，运行时懒加载）

---

## 4. 设计规则（Anti-Slop）

来源：html-anything、md2html、open-design 最佳实践。

### ❗❗ HTML 语法硬性规则（最重要）

**禁止使用自闭合标签**（`<rk-field />`）写 Custom Elements。HTML5 解析器会把它当作开启标签，导致后续元素变成子元素。

```html
✗ 错误：
<rk-form title="...">
  <rk-field label="评分" type="rating" />
  <rk-field label="反馈" type="textarea" />
</rk-form>
<!-- 第二个 rk-field 被嵌套成第一个的子元素！ -->

✓ 正确：
<rk-form title="...">
  <rk-field label="评分" type="rating" required></rk-field>
  <rk-field label="反馈" type="textarea" placeholder="..."></rk-field>
</rk-form>
```

**所有容器元素必须用显式关闭标签**：`rk-form`、`rk-kanban`、`rk-grid`、`rk-tabs`、`rk-badge-group`、`rk-checklist`、`rk-metric`、`rk-card`、`rk-section`、`rk-diff`。

### 排版
- 正文宽度 **≤ 720px**（由系统自动控制，无需手动设置）
- 行高 **1.6–1.75**（中文用 1.75，英文用 1.6）
- 标题层级 **最多 3 层**（h1 → h2 → h3，不用 h4）
- 段落间距 > 行间距（`margin-bottom: 1.5em`）
- 不用纯黑纯白（交给主题 token 处理）

### 颜色
- **1 主色 + 2 中性色 + 至多 1 强调色**
- 让 `data-rk-theme` 管颜色，不要内联 `style="color: #xxx"` 覆盖主题
- 语义色用 `rk-callout type="warning"` 而不是手写橙色背景

### 字体
- 中文：`Noto Sans SC`（已通过 Google Fonts 自动加载）
- 英文：`Inter`（已通过 Google Fonts 自动加载）
- 代码：`JetBrains Mono`（已通过 Google Fonts 自动加载）
- 中英文之间加**半角空格**（盘古之白）：`API 接口` 而非 `API接口`

### 信息密度
- **不要 lorem ipsum**，用真实数据
- **不要 "Your text here"**，用真实内容
- 数字要有单位和上下文（`¥120万` 而非 `1200000`）
- 图表必须有 title，数据要有来源说明

### 结构
- 每个 `<h2>` 是一个 Section，用 `<section>` 包裹（可选但推荐）
- 关键信息用 `rk-callout`、`rk-summary`、`rk-metric` 突出
- 不要超过 3 层嵌套

---

## 5. CLI 工作流

```bash
# 1. 写 HTML 文件
# (Agent 生成 report.html)

# 2. 推送到本地 RenderKit 服务器
rk push report.html
# → 输出: { ok: true, artifactId: "abc123", url: "http://localhost:3737/a/abc123" }

# 3. 在浏览器打开查看（可选）
rk open report.html

# 4. 人类在浏览器里添加评论
#    交互方式：hover 文档块 → 右侧出现 "+" 按钮 → 点击 → 输入评论
#    评论面板是固定浮层，不影响文档宽度（文档始终全宽展示）
#    有评论的块右侧显示角标数字，悬停可查看/编辑/删除评论

# 5. Agent 获取评论（JSON）
rk feedback report.html
# → 输出: { ok: true, openCount: 2, comments: [...], renderErrors: [...] }

# 6. Agent 根据评论修改 HTML，重新推送
rk push report.html  # 自动更新同一个 artifact（revision +1）

# 循环直到 openCount === 0 且 renderErrors 为空
```

### feedback JSON 格式

```json
{
  "ok": true,
  "artifactId": "abc123",
  "revision": 3,
  "openCount": 2,
  "renderErrors": [
    { "engine": "d2", "message": "d2 not found: ...", "anchor": "anc_3" }
  ],
  "comments": [
    {
      "id": "c_xxx",
      "anchor": "anc_section-2",
      "text": "这里的图表数据不够清晰，能加上同比吗？",
      "status": "open",
      "createdAt": "2026-05-17T08:00:00Z"
    }
  ]
}
```

`renderErrors` 包含客户端渲染失败的组件信息。Agent 应检查并修复对应组件的数据/语法。

### 处理评论的策略

1. 读取所有 `comments`，逐条理解要求
2. 根据 `anchor` 定位到文档中对应的段落/组件（`anc_0` = 第 1 个块，`anc_3` = 第 4 个块）
3. 修改 HTML，重新 `rk push`
4. 再次 `rk feedback` 确认 openCount 减少

### rk doctor — 环境检查

```bash
rk doctor
# 检查：d2 安装状态、版本号
# 输出：{ ok: true/false, hint: "Install: curl -fsSL https://d2lang.com/install.sh | sh" }
```

---

## 6. 完整示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Q1 产品复盘报告</title>
  <link rel="stylesheet" href="/rk/components.css">
  <link rel="stylesheet" href="/rk/theme.css">
  <script type="module" src="/rk/components.js"></script>
</head>
<body data-rk-theme="paper-light">

  <rk-summary title="执行摘要">
    Q1 核心指标全线达成，用户增长超预期 18%，留存率提升 4 个百分点。
    主要风险：获客成本上升，需 Q2 重点优化。
  </rk-summary>

  <rk-metric cols="3">
    <rk-metric-item label="MAU" value="128,400" delta="+18%"></rk-metric-item>
    <rk-metric-item label="30日留存" value="42%" delta="+4%"></rk-metric-item>
    <rk-metric-item label="CAC" value="¥68" delta="+12%" tone="warning"></rk-metric-item>
  </rk-metric>

  <h2>增长趋势</h2>
  <rk-chart type="line" title="月活用户（MAU）">
  [
    {"month":"1月","mau":98000},
    {"month":"2月","mau":112000},
    {"month":"3月","mau":128400}
  ]
  </rk-chart>

  <h2>架构图</h2>
  <rk-diagram engine="mermaid" title="系统架构">
  graph LR
    Agent[Agent] -->|rk push| CLI[CLI]
    CLI -->|POST| Server[RenderKit Server]
    Server -->|anchor 注入| Browser[浏览器渲染]
    Browser -->|hover + 评论| Human[人类审阅]
    Human -->|rk feedback| Agent
  </rk-diagram>

  <h2>技术栈</h2>
  <rk-badge-group>
    <rk-badge color="blue">TypeScript</rk-badge>
    <rk-badge color="green">Next.js</rk-badge>
    <rk-badge color="purple">ECharts</rk-badge>
    <rk-badge color="orange">Mermaid</rk-badge>
  </rk-badge-group>

  <h2>关键决策</h2>
  <rk-decision question="Q2 是否加大 SEM 投入？" chosen="渐进式增加" status="approved">
    <rk-reason>
      <li>Q1 CAC 上升 12%，但 LTV 也上升</li>
      <li>SEM 用户质量高于社交渠道</li>
    </rk-reason>
    <rk-alternative>维持现状 — 竞争对手在加大投放</rk-alternative>
  </rk-decision>

  <h2>下一步</h2>
  <rk-checklist title="Q2 行动项">
    <rk-item checked>确定 SEM 预算</rk-item>
    <rk-item checked>优化落地页转化率</rk-item>
    <rk-item>A/B 测试新广告素材</rk-item>
    <rk-item>搭建归因模型</rk-item>
  </rk-checklist>

</body>
</html>
```

---

## 7. 关键警告

### 自闭合标签（最常见的坑）

**永远不要**对 Custom Elements 使用自闭合语法。HTML5 规范只允许 `void elements`（如 `<br>`、`<img>`）自闭合。Custom Elements 必须有显式关闭标签：

```html
✗ <rk-field label="评分" type="rating" />
✗ <rk-metric-item value="42" />
✗ <rk-badge color="blue">TS</rk-badge />   ← 这更是灾难

✓ <rk-field label="评分" type="rating"></rk-field>
✓ <rk-metric-item value="42"></rk-metric-item>
✓ <rk-badge color="blue">TS</rk-badge>     ← 有文本内容时自然关闭
```

### 容器元素必须正确关闭

`rk-form`、`rk-kanban`、`rk-grid`、`rk-tabs`、`rk-badge-group`、`rk-checklist`、`rk-metric`、`rk-steps`、`rk-timeline`、`rk-card`、`rk-section` 都是容器，必须有对应的 `</rk-xxx>`。

### 图表引擎选择

- **Mermaid**: 通用流程图/序列图，服务端 SSR，失败回退客户端
- **Graphviz**: 依赖图/关系图，服务端 Kroki SSR
- **PlantUML**: UML 图，服务端 Kroki SSR
- **D2**: 架构图，服务端 spawn d2 binary（需 `rk doctor` 检测安装）

### CDN 懒加载

大部分可视化组件（rk-chart、rk-plot、rk-map、rk-globe、rk-graph、rk-flow、rk-datagrid、rk-plot3d、rk-graph3d、rk-sketch、rk-zdog、rk-infographic、rk-model）依赖外部 CDN 库。首次渲染时加载，之后缓存。**确保网络可达 `cdn.jsdelivr.net` 和 `ajax.googleapis.com`**。

---

## 8. 评论系统

文档是产品核心，评论是轻量附加功能。

### 交互方式
1. 悬停文档块 → 右侧出现浮动 `+` 按钮
2. 点击 `+` → 评论面板从右侧滑入（**固定浮层，不影响文档宽度**）
3. 输入评论文本 → `Cmd+Enter` 提交
4. 有评论的块显示角标数字
5. 点击评论卡片 → 文档滚动定位到对应块
6. 悬停评论卡片 → 显示编辑/删除按钮

### Agent 读取评论
```bash
rk feedback my-doc.html
# 返回 JSON，含所有 open 评论 + renderErrors + submissions
```

### 评论数据结构
每条评论包含：
- `id`: 评论 ID
- `anchor`: 对应文档块的锚点（`anc_0`, `anc_3` 等）
- `text`: 评论文本
- `status`: `open` | `resolved`
- `createdAt`: 创建时间

---

## 9. 版本历史

每次 `rk push` 创建新版本（revision），版本号自动递增。

```bash
rk push report.html    # revision 1
rk push report.html    # revision 2（修改后重新推送）
rk status report.html  # 查看当前版本号
```

版本数据存储在 SQLite 数据库中，支持历史版本回溯。

---

## 10. 服务器启动

```bash
# 启动本地 RenderKit 服务器
rk serve
# 或
pnpm dev

# 默认端口：3737
# 环境变量覆盖：RENDERKIT_ENDPOINT=http://custom:port
```

服务器提供：
- HTML 处理（Shiki 代码高亮 + 图表 SSR + anchor 注入）
- 评论 API
- Render Error API（客户端渲染失败自动上报）
- Artifact 存储（SQLite）

---

## 11. 组件选择指南

### 数据可视化

| 场景 | 推荐组件 | 说明 |
|------|---------|------|
| 数值指标 | `rk-metric` / `rk-stat` | 单值用 stat，多指标用 metric |
| 趋势/对比图 | `rk-chart` | ECharts，支持 bar/line/area/pie/scatter |
| 统计/分布图 | `rk-plot` | Observable Plot，grammar of graphics |
| 3D 科学图表 | `rk-plot3d` | Plotly.js，surface/scatter3d/mesh3d |
| 漏斗/雷达/仪表 | `rk-chart` | 同 rk-chart，type=funnel/radar/gauge |
| 信息图 | `rk-infographic` | AntV Infographic，预设模板 |

### 图 / 网络

| 场景 | 推荐组件 | 说明 |
|------|---------|------|
| 流程图 | `rk-diagram engine="mermaid"` | 语法简单，SSR |
| 流程图（交互式）| `rk-flow` | @antv/x6，拖拽/缩放 |
| 知识图谱 | `rk-graph` | Cytoscape.js，5 种布局 |
| 3D 网络图 | `rk-graph3d` | WebGL 力导向 |
| 手绘草图 | `rk-sketch` | Rough.js，概念图/白板风 |
| 架构图 | `rk-diagram engine="d2"` | 声明式，自动布局 |
| 依赖图 | `rk-diagram engine="graphviz"` | DOT 语法，Kroki SSR |

### 地理

| 场景 | 推荐组件 | 说明 |
|------|---------|------|
| 地图 + 标注 | `rk-map` | Leaflet，OSM 瓦片，无需 API key |
| 全球数据分布 | `rk-globe` | 3D 地球仪，WebGL |

### 3D / 视觉

| 场景 | 推荐组件 | 说明 |
|------|---------|------|
| 3D 模型 | `rk-model` | GLTF/GLB，支持 AR |
| 伪 3D 插画 | `rk-zdog` | 轻量矢量 3D，拖拽旋转 |
| 自定义 3D 场景 | `rk-3d` | Three.js presets |

### 数据表格

| 场景 | 推荐组件 | 说明 |
|------|---------|------|
| 简单展示表 | `rk-table` | 原生 HTML table |
| 企业数据表 | `rk-datagrid` | AG Grid，排序/筛选/分页 |

### 叙事 / 文档

| 场景 | 推荐组件 | 说明 |
|------|---------|------|
| 内联数据文字 | `rk-narrative` | sparkline/value/badge 嵌文本 |
| 代码差异 | `rk-diff` | unified diff 高亮 |
| 内容卡片 | `rk-card` | variant + accent |
| 文档章节 | `rk-section` | level + divider |

### 何时用 rk-stat vs rk-metric

- **rk-stat**：单行展示一个核心数字
- **rk-metric**：2-4 个指标并排对比

### 何时用 rk-callout vs rk-highlight

- **rk-callout**：独立块级元素，整段提示信息
- **rk-highlight**：行内元素，突出正文中的关键词

### 何时用 rk-timeline vs rk-steps

- **rk-timeline**：历史事件、里程碑，有日期标记
- **rk-steps**：流程步骤，有 current 标记当前进度

---

## 12. 常见错误与排障

### 错误 1：自闭合标签导致布局错乱

**症状**：第二个 `<rk-field>` 或 `<rk-metric-item>` 嵌套到了前一个里面。
**原因**：HTML5 规范不允许 Custom Elements 自闭合。
**修复**：所有 `<rk-*>` 都必须写 `</rk-xxx>` 关闭标签。

```html
✗ <rk-field label="评分" type="rating" />
✓ <rk-field label="评分" type="rating"></rk-field>
```

### 错误 2：图表 Y 轴数字显示不友好

**症状**：Y 轴显示 98000、150000 等大数字，轴标签重叠。
**解决**：rk-chart 内置 K/M 格式化，确保数据是纯数字（不要加千位逗号）：

```html
✗ { "users": "98,000" }  ← 字符串，不触发格式化
✓ { "users": 98000 }      ← 数字，自动显示 98K
```

### 错误 3：图表不显示

**可能原因**：
1. CDN 加载失败 — 检查网络连接（`cdn.jsdelivr.net`）
2. 语法错误 — 检查浏览器 Console
3. 自闭合标签 — 确认 `</rk-diagram>` 显式关闭

### 错误 4：主题不生效

**检查项**：
1. `<body data-rk-theme="paper-light">` 写在 `<body>` 标签上
2. `<link rel="stylesheet" href="/rk/theme.css">` 在 `<head>` 中
3. 主题名拼写正确（参考 §2 主题列表）
4. 不要在 body 上写 `style` 覆盖主题变量

### 错误 5：rk push 后页面空白

**可能原因**：
1. HTML 没有包含 `<script type="module" src="/rk/components.js">`
2. HTML 没有包含 `<link rel="stylesheet" href="/rk/components.css">`
3. 服务器未启动 — 先 `rk serve` 或 `pnpm dev`

### 错误 6：D2 图表显示错误

**可能原因**：
1. 本地未安装 d2 binary — 运行 `rk doctor` 检查
2. 安装命令：`curl -fsSL https://d2lang.com/install.sh | sh -s --`
3. 安装后重新 `rk push` 即可
