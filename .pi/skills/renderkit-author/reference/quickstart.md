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

