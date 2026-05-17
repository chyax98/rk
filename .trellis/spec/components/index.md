# @renderkit/components — Spec 导航

> 21 个 `rk-*` Web Components，纯 Custom Elements（无 Shadow DOM），样式由 `@renderkit/design` 提供。

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

## 组件清单（21 个）

| 组件 | 标签 | 子元素 | 备注 |
|---|---|---|---|
| Callout | `rk-callout` | — | 7 种 tone 变体，内嵌 SVG 图标 |
| Stat | `rk-stat` | — | value/unit/label/delta |
| Summary | `rk-summary` | — | 标题 + 强调边框 |
| Code | `rk-code` | — | editor/terminal frame，Shiki 高亮 |
| Table | `rk-table` | — | pipe 语法解析，profile=status 彩色圆点 |
| Chart | `rk-chart` | — | type=kpi 为 KPI 网格，其余走 ECharts |
| Diagram | `rk-diagram` | — | Mermaid 渲染，loading 状态 |
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

---

所有 spec 用中文编写。代码示例引用真实文件路径。
