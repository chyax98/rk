## 组件选择指南

### 总原则

- **优先 D2 / Mermaid。** Agent 生成图表时，先问能否用文本 DSL 表达；能用就用 `rk-diagram`。
- **不写兼容胶水。** 旧语法、旧 CDN、旧示例错了就修源头；不要为了兼容坏输入加 fallback。
- **验证优先。** 每个新增组件/语法都需要 case；看 `rk feedback` 的 `renderErrors[]`，再浏览器抽查。

### 图表 DSL 首选路线

| 场景 | 首选 | 原因 |
|------|------|------|
| 系统架构、服务边界、部署拓扑 | `rk-diagram engine="d2"` | 结构化、自动布局、适合 agent 生成和 diff |
| 包依赖、数据流、组件关系 | `rk-diagram engine="d2"` | D2 edge/container 表达清楚 |
| 普通流程图、决策分支 | `rk-diagram engine="mermaid"` | 语法短，浏览器/SSR 双路径成熟 |
| API 时序、登录/支付链路 | `rk-diagram engine="mermaid"` + `sequenceDiagram` | Mermaid 时序语法稳定 |
| 状态机 | `rk-diagram engine="mermaid"` + `stateDiagram-v2` | 状态迁移可读 |
| 计划排期 | `rk-diagram engine="mermaid"` + `gantt` | 时间线语义明确 |
| 需要拖拽/编辑的流程画布 | `rk-flow` | 只有明确需要交互时用 X6 |
| 知识图谱/大网络 | `rk-graph` / `rk-graph3d` | 只有节点很多且需要布局交互时用 |
| 地图/地球/3D 模型 | `rk-map` / `rk-globe` / `rk-model` | 专用视觉场景 |

### 数据可视化

| 场景 | 推荐组件 | 说明 |
|------|---------|------|
| 数值指标 | `rk-metric` / `rk-stat` | 单值用 stat，多指标用 metric |
| 趋势/对比图 | `rk-chart` | ECharts，支持 bar/line/area/pie/scatter |
| 统计/分布图 | `rk-plot` | Observable Plot，grammar of graphics |
| 3D 科学图表 | `rk-plot3d` | Plotly.js，surface/scatter3d/mesh3d |
| 漏斗/雷达/仪表 | `rk-chart` | 同 rk-chart，type=funnel/radar/gauge |
| 信息图 | `rk-infographic` | AntV Infographic，预设模板 |

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
| 手绘草图 | `rk-sketch` | Rough.js，概念图/白板风 |

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
