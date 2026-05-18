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

