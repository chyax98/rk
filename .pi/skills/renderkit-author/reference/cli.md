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

