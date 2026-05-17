# RenderKit

> Local HTML artifact renderer for AI agents. Write HTML, push, review, comment.

## 工作方式

```
Agent 写 HTML + <rk-*> 组件
  ↓ renderkit push artifact.html --open
Server 注入 data-rk-anchor
  ↓ 浏览器渲染 Web Components
人查看 / 气泡评论
  ↓ renderkit feedback artifact.html --json
Agent 读评论，修改 HTML
  ↓ renderkit push（新版本）
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动本地 server（端口 3737）
pnpm dev

# 推送 artifact（新建或更新）
renderkit push my-report.html --open

# 拉取评论反馈
renderkit feedback my-report.html --json

# 增量更新某个 section
renderkit patch my-report.html --anchor "h2-exec-summary" --fragment updated.html

# 追加内容
renderkit append my-report.html --fragment appendix.html

# 列出可用组件
renderkit components
```

## 21 个 Web Components

| 组件 | 用途 | 核心属性 |
|---|---|---|
| `<rk-callout>` | 提示框（7种语义） | `tone`, `title` |
| `<rk-stat>` | KPI 卡片 | `label`, `value`, `unit`, `delta`, `deltadir`, `tone` |
| `<rk-summary>` | 摘要卡 | `title` |
| `<rk-code>` | 代码块 | `language`, `title`, `frame`, `showlinenumbers` |
| `<rk-table>` | 数据表格 | `profile`, `title` |
| `<rk-chart>` | 图表（ECharts） | `type`, `title`, `xfield`, `yfield` |
| `<rk-diagram>` | 流程图（Mermaid） | `engine`, `caption` |
| `<rk-decision>` | 决策记录 | `question`, `chosen`, `status` |
| `<rk-checklist>` | 检查清单 | `title` |
| `<rk-comparison>` | 方案对比 | `variant`, `title` |
| `<rk-timeline>` | 时间线 | `title` |
| `<rk-tabs>` | 标签页 | `title` |
| `<rk-grid>` | 网格布局 | `cols` (2/3/4) |
| `<rk-image>` | 图片 | `src`, `alt`, `caption`, `width` |
| `<rk-quote>` | 引语 | `attribution`, `source` |
| `<rk-collapsible>` | 可折叠区域 | `summary` |
| `<rk-highlight>` | 要点高亮 | `label` |
| `<rk-progress>` | 进度条 | `label`, `value`, `tone` |
| `<rk-steps>` | 水平步骤 | `current` |
| `<rk-metric>` | 指标卡行 | `cols` |
| `<rk-3d>` | 3D 交互场景 | `scene`, `height`, `color`, `caption` |

不够用？直接写原生 HTML：`<div style="display:flex">...</div>` 完全支持。

## Agent 写 artifact 示例

```html
<h1>Q2 产品评审</h1>

<rk-highlight label="结论">
  方案B 推荐采纳，降本 40%，6周上线。
</rk-highlight>

<rk-grid cols="3">
  <rk-stat label="节省预算" value="40" unit="%" delta="+40%" deltadir="up" tone="positive"></rk-stat>
  <rk-stat label="实施周期" value="6" unit="周"></rk-stat>
  <rk-stat label="风险等级" value="低" tone="positive"></rk-stat>
</rk-grid>

<rk-decision question="存储选型" chosen="SQLite" status="decided">
  <rk-reason>
    <li>零配置，无需 Docker</li>
  </rk-reason>
</rk-decision>
```

## 技术栈

- **框架**: Next.js 16 (Turbopack)
- **Web Components**: 21 个 Light DOM 自定义元素，无 shadow DOM
- **图表**: ECharts 5（CDN 动态加载）
- **3D**: Three.js r170（CDN 动态加载，可拖拽旋转）
- **流程图**: Mermaid 11（client-side CDN）
- **代码高亮**: Shiki（server-side 预渲染）
- **HTML 解析**: linkedom
- **数据库**: SQLite (better-sqlite3)
- **包管理**: pnpm 9
