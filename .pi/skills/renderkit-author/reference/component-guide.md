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

