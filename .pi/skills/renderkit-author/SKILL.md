---
name: renderkit-author
description: >-
  Use when writing HTML documents with RenderKit Web Components (<rk-*>).
  Agent writes HTML + rk-* tags → rk push → browser renders → human comments
  → rk feedback → agent iterates. Trigger on: "用 RenderKit 写" "rk push"
  "生成 artifact" "写个文档" "HTML artifact" "renderkit" or any request
  to create a document for human review.
---

# RenderKit Author Skill

RenderKit：Agent 写 HTML + `<rk-*>` WC → push → 浏览器渲染 → 人评论 → Agent 迭代。

**46 个 Web Components**，覆盖数据可视化、图表、地图、3D、叙事文本、布局等全场景。

---

## 最小可用模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>文档标题</title>
  <link rel="stylesheet" href="/rk/components.css">
  <link rel="stylesheet" href="/rk/theme.css">
  <script type="module" src="/rk/components.js"></script>
</head>
<body data-rk-theme="paper-light">
  <h1>标题</h1>
  <!-- rk-* 组件写在这里 -->
</body>
</html>
```

推送：`rk push doc.html --author agent` · 获取反馈：`rk feedback doc.html` · 校验：`rk validate doc.html`

## 闭环命令（agent ↔ 人）

```bash
rk push doc.html --author agent       # 推送（agent 标记自己来源）
rk push doc.html --test               # 测试 artifact 自动进沙盒
rk feedback doc.html                  # 拉评论，看每条 thread 的 waitingFor 判断是否要处理
rk reply doc.html <cmt_id> "已修"     # 回复评论（默认 author=agent）
rk address doc.html <cmt_id>          # 标 addressed，等人验收
rk resolve doc.html <cmt_id>          # 解决（如果人没必要再验收）
rk reopen doc.html <cmt_id>           # 重新打开
```

`rk feedback` 返回 thread 折叠结构：
- `waitingFor: 'agent'` → 人新评论 / 人 reopen，需要 agent 处理
- `waitingFor: 'human'` → agent 已回复，跳过等人验收
- 不返回 status='resolved' 的

---

## ⚠️ 最重要的规则（必读）

**维护 RenderKit 仓库时不写向后兼容胶水。** 发现旧示例/旧语法/旧 CDN 错误：改主路、改文档、改 case；不要加双路径 fallback。

**图表优先用 D2 / Mermaid。** D2 写架构、依赖、系统边界；Mermaid 写流程、时序、状态、甘特。只有明确需要交互/3D/地图时才用专用 WC。

**自定义元素禁止自闭合标签**——HTML5 parser 会把后续元素变成子元素：

```html
✗  <rk-callout type="info" />          （后续元素全嵌入其中）
✓  <rk-callout type="info"></rk-callout>
```

**禁止 rk-card 嵌套 rk-card**——会产生双重边框、双重圆角、双重内边距，视觉上明显错误。需要分组时用 `rk-section` 或 `rk-collapsible` 作为外层容器，内部再放 `rk-card`：

```html
✗  <rk-card title="外层">
      <rk-card title="内层">…</rk-card>        ← 双重边框/圆角
    </rk-card>

✓  <rk-card title="主题内容">
      <rk-flow>…</rk-flow>
      <rk-callout>…</rk-callout>
    </rk-card>

✓  <rk-section title="主题">
      <rk-card title="子主题 A">…</rk-card>
      <rk-card title="子主题 B">…</rk-card>
    </rk-section>
```

---

## 主题（8 个）

在 `<body data-rk-theme="xxx">` 设置：

| 主题 | 场景 |
|---|---|
| `paper-light` | **默认**，长文档、报告 |
| `dark-pro` | 技术文档、系统设计 |
| `notion-clean` | 协作文档、Wiki |
| `linear-app` | 产品 roadmap |
| `amber-terminal` | 运维、故障排查 |
| `glassmorphism` | 产品发布、视觉展示 |
| `ibm-enterprise` | 企业报告 |
| `editorial-kami` | 设计提案、创意简报 |

→ 详细说明：[reference/themes.md](reference/themes.md)

---

## 组件速查（46 个）

### 内容

| 组件 | 用途 | 关键属性 |
|---|---|---|
| `rk-callout` | 提示框 | `type=info\|warning\|danger\|success` |
| `rk-code` | 代码块（Shiki SSR 高亮）| `lang`, `title`, `frame=window\|terminal` |
| `rk-diff` | 代码 diff | `lang`, `from`, `to` |
| `rk-quote` | 引用 | `author`, `source` |
| `rk-highlight` | 行内高亮 | `color` |
| `rk-summary` | 摘要卡 | `title` |
| `rk-collapsible` | 折叠内容 | `title`, `open` |
| `rk-narrative` | 内联数据文字 | phrases JSON |

### 数据可视化

| 组件 | 用途 | 关键属性/数据 |
|---|---|---|
| `rk-metric` | 指标卡组 | `cols`, `rk-metric-item[label,value,delta]` |
| `rk-stat` | 单值统计 | `label`, `value`, `delta` |
| `rk-progress` | 进度条 | `value`, `max`, `label` |
| `rk-chart` | ECharts 图表 | `type=bar\|line\|area\|pie\|scatter\|funnel\|radar\|gauge`, JSON 数组 |
| `rk-plot` | Observable Plot 统计图 | marks JSON spec |
| `rk-plot3d` | Plotly 3D 图表 | `{data:[{type,x,y,z}]}` |
| `rk-infographic` | AntV 信息图 | 声明式语法字符串 |

### 图表 / 网络

| 组件 | 用途 | 关键属性 |
|---|---|---|
| `rk-diagram` | **首选图表 DSL：Mermaid/D2 SSR**（Graphviz/PlantUML 仅按需）| `engine`, `title` |
| `rk-sketch` | Rough.js 手绘图 | `{shapes:[]}` JSON |
| `rk-flow` | @antv/x6 流程图 | `{nodes,edges}` JSON |
| `rk-graph` | Cytoscape 网络图 | `{nodes,edges}`, `layout` |
| `rk-graph3d` | 3D 力导向图 | `{nodes,links}`, `dag` |

### 地图 / 3D

| 组件 | 用途 | 关键属性 |
|---|---|---|
| `rk-map` | Leaflet 地图 | `center`, `zoom`, `tiles`, markers JSON |
| `rk-globe` | 3D 地球仪 | `height`, `auto-rotate`, points JSON |
| `rk-model` | GLTF 3D 模型 | `src`, `ar`, `auto-rotate` |
| `rk-3d` | Three.js 自定义 3D | `scene` JSON |
| `rk-zdog` | 伪 3D 插画 | `{shapes:[]}` JSON |

### 布局

| 组件 | 用途 | 关键属性 |
|---|---|---|
| `rk-card` | 内容卡片 | `title`, `variant=default\|outlined\|elevated`, `accent` |
| `rk-section` | 文档章节 | `title`, `level=h2\|h3`, `divider` |
| `rk-grid` | 多列布局 | `cols`, `gap` |
| `rk-tabs` | 标签页 | `rk-tab[label]` |
| `rk-table` | 数据表格 | Markdown 管道表 |
| `rk-datagrid` | AG Grid 企业表格 | `{columns,rows}`, `pagination`, `theme` |
| `rk-scroll-story` | 滚动叙事 | `offset`, `rk-step` 子组件 |

### 交互 / 流程

| 组件 | 用途 | 关键属性 |
|---|---|---|
| `rk-checklist` | 任务清单 | `rk-check[done]` |
| `rk-steps` | 步骤流 | `rk-step-item[title,status]` |
| `rk-timeline` | 时间线 | `rk-timeline-item[date,title]` |
| `rk-decision` | 决策记录 | `title`, `status` |
| `rk-comparison` | 对比表 | `variant=table\|matrix` |
| `rk-kanban` | 看板 | `rk-kanban-col[title]` |
| `rk-form` | 反馈表单 | `rk-field[type,label]` |

### 媒体 / 标签

| 组件 | 用途 | 关键属性 |
|---|---|---|
| `rk-image` | 图片（caption）| `src`, `alt`, `caption` |
| `rk-badge` | 标签 | `tone`, `variant` |
| `rk-badge-group` | 标签组 | `rk-badge` 子组件 |

→ 完整语法示例：[reference/components.md](reference/components.md)

---

## 场景选组件

| 需求 | 推荐组件 |
|---|---|
| 数值指标 | `rk-metric` / `rk-stat` |
| 趋势/对比图 | `rk-chart` (bar/line/pie) |
| 统计分布 | `rk-plot` (Observable Plot) |
| 3D 科学图 | `rk-plot3d` (Plotly) |
| 流程/架构图 | `rk-diagram`：流程/时序用 Mermaid，架构/依赖用 D2 |
| 知识图谱 | `rk-graph` / `rk-graph3d` |
| 地图标注 | `rk-map` |
| 全球数据 | `rk-globe` |
| 3D 模型展示 | `rk-model` (需 .glb 文件) |
| 企业数据表 | `rk-datagrid` |
| 代码变更 | `rk-diff` |
| 项目进度 | `rk-kanban` + `rk-timeline` |
| 数据叙事 | `rk-narrative` + `rk-scroll-story` |

→ 详细决策树：[reference/component-guide.md](reference/component-guide.md)

---

## 参考文档

| 文件 | 内容 |
|---|---|
| [reference/quickstart.md](reference/quickstart.md) | 完整 HTML 模板、快速开始示例 |
| [reference/themes.md](reference/themes.md) | 8 个主题详细说明 |
| [reference/components.md](reference/components.md) | **46 个 WC 完整语法示例** |
| [reference/design-rules.md](reference/design-rules.md) | Anti-Slop 设计规则、排版、颜色 |
| [reference/cli.md](reference/cli.md) | rk push / feedback / validate / doctor |
| [reference/component-guide.md](reference/component-guide.md) | 按场景选组件的决策指南 |
| [reference/warnings.md](reference/warnings.md) | 常见错误、排障、评论系统 |
