---
title: Table Profiles
version: 1
theme: paper-light
surface: engineering-plan
---

# Table Profiles

:::table{id="risk-matrix" profile="matrix" title="风险矩阵" width="wide"}
| 风险项 | 概率 | 影响 | 缓解措施 |
|---|---|---|---|
| 依赖升级失败 | 中 | 高 | 锁定版本，逐步升级 |
| 性能退化 | 低 | 高 | 基准测试，回归检测 |
| 数据丢失 | 极低 | 极高 | 备份，事务 |
:::

:::table{id="task-status" profile="status" title="任务清单" width="wide"}
| 状态 | 事项 | Owner | 下一步 |
|---|---|---|---|
| 🟢 | DSL 拆分 | @agent | 已完成 |
| 🟡 | TS 迁移 | @agent | 进行中 |
| 🔴 | 测试覆盖 | @human | 待启动 |
:::

:::table{id="config-kv" profile="key-value" title="关键配置" width="wide"}
| 配置项 | 值 |
|---|---|
| 端口 | 3737 |
| 主题 | paper-light |
| 严格模式 | false |
:::

:::table{id="long-compare" profile="cards" title="方案对比（长文本）" width="wide"}
| 维度 | 方案 A | 方案 B |
|---|---|---|
| 描述 | 使用服务端渲染，所有高亮在构建时完成，不污染客户端 bundle。适合静态文档场景。 | 客户端高亮，首次加载时执行。适合需要动态切换主题或语言的交互场景。 |
| 优点 | 零客户端 JS、SEO 友好、可打印 | 实时响应、无需后端 |
:::

:::table{id="metrics" profile="compact" title="指标速览" width="wide"}
| 指标 | Q1 | Q2 | Q3 | Q4 |
|---|---|---|---|---|
| DAU | 12K | 15K | 18K | 22K |
| 转化率 | 3.2% | 3.5% | 3.8% | 4.1% |
| 延迟 | 120ms | 95ms | 80ms | 65ms |
:::
