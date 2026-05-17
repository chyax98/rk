---
name: renderkit-author
description: >-
  Use when writing HTML documents with RenderKit Web Components (<rk-*>).
  Covers theme selection, all 21 WC syntax, anti-slop design rules, and the
  push→feedback→iterate CLI loop. Trigger on: "用 RenderKit 写" "rk push"
  "生成 artifact" "写个文档" "HTML artifact" "renderkit" or any request
  to create a document for human review.
---

# RenderKit Author Skill

RenderKit 让 Agent 用 HTML + `<rk-*>` Web Components 写文档，服务端渲染后在浏览器展示，人类可以飞书式评论，Agent 读取 JSON 评论迭代优化。

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
  <script type="module" src="/rk/components.js"></script>
</head>
<body data-rk-theme="paper-light">

  <h1>文档标题</h1>
  <p>正文内容...</p>

  <rk-callout type="info" title="提示">这是一个信息提示框。</rk-callout>

  <rk-metric cols="3">
    <rk-metric-item label="用户数" value="12,480" delta="+8%" />
    <rk-metric-item label="转化率" value="3.2%" delta="+0.4%" />
    <rk-metric-item label="收入" value="¥48万" delta="+12%" />
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

---

## 3. Web Component 完整参考

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
  <rk-metric-item label="营收" value="¥120万" delta="+23%" />
  <rk-metric-item label="用户" value="8,420" delta="-2%" tone="warning" />
  <rk-metric-item label="NPS" value="72" />
</rk-metric>
<!-- cols: 2 | 3 | 4 -->
<!-- tone on item: success | warning | danger | info -->
```

### rk-stat — 单个统计数字

```html
<rk-stat value="98.5%" unit="可用率" label="过去 30 天" delta="+0.3%" />
```

### rk-chart — ECharts 图表

```html
<rk-chart type="bar" title="月度用户增长">
[
  { "month": "1月", "users": 1200 },
  { "month": "2月", "users": 1580 },
  { "month": "3月", "users": 2100 }
]
</rk-chart>
<!-- type: bar | line | pie | area | scatter -->
<!-- xfield/yfield 可选，自动推断 -->
```

### rk-diagram — 图表（多引擎）

```html
<!-- Mermaid (默认) -->
<rk-diagram engine="mermaid" title="流程图">
flowchart TD
  A[开始] --> B{判断}
  B -->|是| C[执行]
  B -->|否| D[结束]
</rk-diagram>

<!-- D2 (客户端 WASM) -->
<rk-diagram engine="d2" title="架构图">
server -> database: query
client -> server: HTTP
</rk-diagram>

<!-- Graphviz/DOT (客户端 CDN) -->
<rk-diagram engine="graphviz" title="依赖图">
digraph G {
  rankdir=LR;
  A -> B -> C;
}
</rk-diagram>

<!-- PlantUML (服务端 Kroki SSR，需 server 运行) -->
<rk-diagram engine="plantuml" title="时序图">
@startuml
A -> B: 请求
B --> A: 响应
@enduml
</rk-diagram>
```

### rk-checklist — 待办/检查列表

```html
<rk-checklist title="发布前检查">
  <rk-item checked>代码审查完成</rk-item>
  <rk-item checked>测试全部通过</rk-item>
  <rk-item>更新 changelog</rk-item>
  <rk-item>通知相关方</rk-item>
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
<!-- current: 当前激活步骤编号（1-based） -->
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
  <rk-tab label="测试环境">
    <rk-code lang="bash">npm test</rk-code>
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
<!-- profile: "default" | "compact" | "cards" | "keyvalue" | "status" | "matrix" -->
```

### rk-decision — 决策记录

```html
<rk-decision
  question="选择哪个数据库？"
  chosen="PostgreSQL"
  status="approved">
  <rk-reason>
    <li>成熟的 ACID 支持</li>
    <li>团队熟悉度高</li>
  </rk-reason>
  <rk-alternative>MySQL — 性能相近但生态较弱</rk-alternative>
  <rk-alternative>MongoDB — 不适合关系型数据</rk-alternative>
</rk-decision>
<!-- status: proposed | approved | rejected | superseded -->
```

### rk-comparison — 对比表

```html
<rk-comparison title="方案对比" variant="proscons">
| 维度 | 方案 A | 方案 B |
| 性能 | ✓ 高 | △ 中 |
| 成本 | △ 高 | ✓ 低 |
| 风险 | ✓ 低 | ✗ 高 |
</rk-comparison>
<!-- variant: proscons | features | tradeoffs -->
```

### rk-summary — 摘要卡

```html
<rk-summary title="执行摘要">
  本季度完成了三项核心功能：多引擎图表、设计系统深化、CLI 重写。
  整体进度符合预期，下季度重点推进 Agent Authoring Skill 和新 WC。
</rk-summary>
```

### rk-quote — 引用

```html
<rk-quote attribution="Steve Jobs" source="2005 Stanford Commencement">
  Stay hungry, stay foolish.
</rk-quote>
```

### rk-callout — 标注（见上）

### rk-highlight — 内联高亮

```html
<p>这是正文，<rk-highlight label="重要">高亮这段文字</rk-highlight>，继续正文。</p>
```

### rk-collapsible — 折叠面板

```html
<rk-collapsible summary="点击展开详情">
  这里是折叠的详细内容，默认收起。
  <rk-code lang="bash">可以嵌套其他组件</rk-code>
</rk-collapsible>
<!-- open 属性让其默认展开 -->
```

### rk-progress — 进度条

```html
<rk-progress label="完成度" value="73" max="100" tone="success" />
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
<rk-image src="https://..." alt="说明" caption="图注" width="100%" />
```

### rk-3d — 3D 场景（Three.js）

```html
<rk-3d preset="globe" height="400px" />
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

<!-- standalone -->
<rk-badge color="blue">TypeScript</rk-badge>
<!-- color: blue | green | red | orange | purple | gray | accent -->
```

### rk-kanban — 看板

```html
<rk-kanban>
  <rk-kanban-col title="待办">
    <rk-kanban-card priority="high" tag="bug" assignee="张三" due="05-20">
      修复登录问题
    </rk-kanban-card>
    <rk-kanban-card priority="medium" tag="feature">
      重写文档
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

### rk-form — 结构化反馈表单

```html
<rk-form title="文档审阅" submit-label="提交反馈" description="请对文档提供意见。">
  <rk-field label="整体评分" type="rating" max="5" required></rk-field>
  <rk-field label="主要问题" type="textarea" placeholder="描述问题..."></rk-field>
  <rk-field label="优先级" type="select" options="高,中,低"></rk-field>
  <rk-field label="联系方式" type="text" placeholder="邮箱或姓名"></rk-field>
  <rk-field label="同意公开" type="checkbox" placeholder="允许公开此反馈"></rk-field>
</rk-form>
<!-- type: text | textarea | select | rating | checkbox | number -->
<!-- 提交后结果以 JSON 输出到浏览器控制台，Agent 可通过截图或 feedback 命令获取 -->
```

---

## 4. 设计规则（Anti-Slop）

来源：html-anything、md2html、open-design 最佳实践。

### ❗❗ HTML 语法硬性规则（最重要）

**禁止使用自閉合标签**（`<rk-field ... />`）写 Custom Elements。HTML5 解析器会把它当作开启标签，导致后续元素变成子元素。

```html
✗ 错误：
<rk-form title="...">  <rk-field label="评分" type="rating" />          (自閉合)
  <rk-field label="反馈" type="textarea" />        (将被嵌套成上一个的子元素!)
</rk-form>

✓ 正确：
<rk-form title="...">
  <rk-field label="评分" type="rating" required></rk-field>
  <rk-field label="反馈" type="textarea" placeholder="..."></rk-field>
</rk-form>
```

### 排版
- 正文宽度 **≤ 720px**（`max-width: 720px; margin: 0 auto`）
- 行高 **1.6–1.75**（中文用 1.75，英文用 1.6）
- 标题层级 **最多 3 层**（h1 → h2 → h3，不用 h4）
- 段落间距 > 行间距（`margin-bottom: 1.5em`）
- 不用纯黑纯白（用 `#0a0a0a` / `#fafafa` 或交给主题 token）

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

# 4. 人类在浏览器里添加评论（飞书式）

# 5. Agent 获取评论（JSON）
rk feedback report.html
# → 输出: { ok: true, openCount: 2, comments: [...] }

# 6. Agent 根据评论修改 HTML，重新推送
rk push report.html  # 自动更新同一个 artifact

# 循环直到 openCount === 0
```

### feedback JSON 格式

```json
{
  "ok": true,
  "artifactId": "abc123",
  "revision": 3,
  "openCount": 2,
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

### 处理评论的策略

1. 读取所有 `comments`，逐条理解要求
2. 根据 `anchor` 定位到文档中对应的段落/组件
3. 修改 HTML，重新 `rk push`
4. 再次 `rk feedback` 确认 openCount 减少

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
  <script type="module" src="/rk/components.js"></script>
  <style>
    body { max-width: 760px; margin: 0 auto; padding: 2rem 1.5rem; }
  </style>
</head>
<body data-rk-theme="paper-light">

  <rk-summary title="执行摘要">
    Q1 核心指标全线达成，用户增长超预期 18%，留存率提升 4 个百分点。
    主要风险：获客成本上升，需 Q2 重点优化。
  </rk-summary>

  <rk-metric cols="3">
    <rk-metric-item label="MAU" value="128,400" delta="+18%" />
    <rk-metric-item label="30日留存" value="42%" delta="+4%" />
    <rk-metric-item label="CAC" value="¥68" delta="+12%" tone="warning" />
  </rk-metric>

  <h2>增长趋势</h2>
  <rk-chart type="line" title="月活用户（MAU）">
  [
    {"month":"1月","mau":98000},
    {"month":"2月","mau":112000},
    {"month":"3月","mau":128400}
  ]
  </rk-chart>

  <h2>关键决策</h2>
  <rk-decision question="Q2 是否加大 SEM 投入？" chosen="暂缓，优先 SEO" status="approved">
    <rk-reason>
      <li>CAC 已上升 12%，SEM 边际收益下降</li>
      <li>SEO 内容已积累，转化成本更低</li>
    </rk-reason>
    <rk-alternative>加大 SEM — ROI 不确定，风险较高</rk-alternative>
  </rk-decision>

  <h2>Q2 计划</h2>
  <rk-steps title="Q2 关键里程碑" current="1">
    <rk-step>SEO 内容矩阵上线（5月）</rk-step>
    <rk-step>新功能 A/B 测试（6月）</rk-step>
    <rk-step>品牌合作活动（6月底）</rk-step>
  </rk-steps>

  <rk-callout type="warning" title="风险提示">
    获客成本 Q2 如继续上升超过 ¥80，需立即启动降本专项。
  </rk-callout>

</body>
</html>
```

---

## 7. 服务器启动

```bash
rk serve          # 默认端口 3737
# 或
cd /path/to/RenderKit && pnpm dev
```

确认运行：`curl http://localhost:3737/api/health`
