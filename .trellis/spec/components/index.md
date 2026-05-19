# @renderkit/components — Spec 导航

> 24 个 `rk-*` Web Components，纯 Custom Elements（无 Shadow DOM），样式由 `@renderkit/design` 提供。

## 包概览

| 项 | 值 |
|---|---|
| 包路径 | `packages/components/` |
| 入口 | `src/index.ts`（注册表 + 类型） |
| 构建 | `src/bundle.ts`（注册所有 WC） |
| CSS | `src/css/theme.css` + `src/css/components.css` |
| 运行时依赖 | 无（3D 组件例外，CDN 加载 Three.js） |
| 导出方式 | `type: module`，直接 `.ts` 引用（构建时 strip types） |

## Spec 文件

| 文件 | 内容 |
|---|---|
| [component-pattern.md](./component-pattern.md) | 组件 class 结构、生命周期、命名规范 |
| [registry.md](./registry.md) | ComponentDescriptor 注册表、添加新组件流程 |
| [css-conventions.md](./css-conventions.md) | BEM 类名、token 消费、与 design 包的关系 |
| [quality.md](./quality.md) | 质量标准、禁止模式、常见错误 |

## 组件清单（24 个）

| 组件 | 标签 | 子元素 | 备注 |
|---|---|---|---|
| Callout | `rk-callout` | — | 7 种 tone 变体，内嵌 SVG 图标 |
| Stat | `rk-stat` | — | value/unit/label/delta |
| Summary | `rk-summary` | — | 标题 + 强调边框 |
| Code | `rk-code` | — | editor/terminal frame，Shiki 高亮 |
| Table | `rk-table` | — | pipe 语法解析，profile=status 彩色圆点 |
| Chart | `rk-chart` | — | JSON 多系列 + pipe table fallback，ECharts 渲染 |
| Diagram | `rk-diagram` | — | Mermaid/D2/Graphviz/PlantUML 四引擎，Kroki SSR |
| Decision | `rk-decision` | `rk-reason`, `rk-alternative` | 状态机：proposed/draft/approved/blocked/resolved |
| Checklist | `rk-checklist` | `rk-item` | checked/note 属性 |
| Comparison | `rk-comparison` | — | variant=proscons / matrix |
| Timeline | `rk-timeline` | `rk-step` | status/tags 属性 |
| Tabs | `rk-tabs` | `rk-tab` | JS click handler 切换 |
| Grid | `rk-grid` | `rk-col` | DOM move（非序列化），`_rendered` 防重入 |
| Image | `rk-image` | — | width=full/wide/normal |
| Quote | `rk-quote` | — | attribution + source-url |
| Collapsible | `rk-collapsible` | — | 原生 `<details>/<summary>` |
| Highlight | `rk-highlight` | — | 粗左边框，label 默认"要点" |
| Progress | `rk-progress` | — | tone=default/success/warning/danger |
| Steps | `rk-steps` | `rk-step` | current=1-based，水平步骤条 |
| Metric | `rk-metric` | `rk-metric-item` | cols=2/3/4 |
| 3D | `rk-3d` | — | CDN 动态 import Three.js |
| Badge | `rk-badge` | — | color=blue/green/red/orange/purple/gray/accent |
| Badge Group | `rk-badge-group` | `rk-badge` | 标签组容器 |
| Kanban | `rk-kanban` | `rk-kanban-col` > `rk-kanban-card` | priority/tag/assignee/due |
| Form | `rk-form` | `rk-field` | text/textarea/select/rating/checkbox，服务端提交 |

### 新增组件（v0.1.0 新增）

- **rk-badge / rk-badge-group**: 技术栈标签、状态标记
- **rk-kanban**: 看板视图，支持列（`rk-kanban-col`）和卡片（`rk-kanban-card`）
- **rk-form**: 结构化反馈表单，支持 rating/textarea/select 等字段类型

---

所有 spec 用中文编写。代码示例引用真实文件路径。
