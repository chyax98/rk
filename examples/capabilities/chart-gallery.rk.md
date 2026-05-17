---
title: RenderKit Chart Gallery
version: 1
theme: paper-light
surface: data-report-lite
---

# Chart Gallery

:::sum{id="chart-summary" title="图表能力概览" width="wide"}
RenderKit chart block 支持 5 种图表类型：bar、line、pie、scatter、kpi。数据通过 Markdown 表格提供，agent 通过 type/xField/yField 控制渲染。
:::

:::chart{id="monthly-bar" type="bar" title="月度活跃用户" xField="月份" yField="活跃用户" template="report" width="wide"}
| 月份 | 活跃用户 |
|---|---|
| 1月 | 1200 |
| 2月 | 1580 |
| 3月 | 2100 |
| 4月 | 1950 |
| 5月 | 2400 |
:::

:::chart{id="revenue-line" type="line" title="营收趋势（万元）" xField="季度" yField="营收" template="minimal" width="wide"}
| 季度 | 营收 |
|---|---|
| Q1 | 45 |
| Q2 | 62 |
| Q3 | 78 |
| Q4 | 95 |
:::

:::chart{id="channel-pie" type="pie" title="流量来源分布" xField="来源" yField="占比" width="wide"}
| 来源 | 占比 |
|---|---|
| 自然搜索 | 42 |
| 直接访问 | 28 |
| 社交媒体 | 18 |
| 付费广告 | 12 |
:::

:::chart{id="dau-kpi" type="kpi" title="日活用户 DAU" width="wide"}
| 指标 | 数值 |
|---|---|
| DAU | 12,480 |
:::
