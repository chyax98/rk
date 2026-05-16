---
title: Grid Layout Capability Case
theme: paper-light
surface: data-report-lite
---

# Grid Layout Capability Case

This case proves RenderKit can compose blocks in rows and columns instead of only one block per row.

::::grid{id="kpi-grid" columns="3" title="KPI grid" gap="normal"}
:::summary{id="metric-a" title="Velocity"}
12 shipped artifacts this week.
:::

:::callout{id="metric-b" tone="success" title="Quality"}
128 verifier checks passing across examples and theme cases.
:::

:::callout{id="metric-c" tone="warning" title="Follow-up"}
PlantUML and D2 currently preserve source and need optional local render adapters later.
:::
::::

::::grid{id="decision-grid" columns="2" title="Two column review"}
:::decision-card{id="grid-decision"}
question: Should layout be a first-class block?
chosen: yes
status: approved

rationale:
  - Documents need higher information density
  - Row/column composition keeps source simple
  - Feedback still targets a reviewable block

alternatives:
  - name: manual HTML
    reason: Too unsafe and too hard for agents to maintain
:::

:::table{id="grid-reference" title="Reference matrix"}
| Reference | Surface |
|---|---|
| Paper document | engineering-plan |
| Review report | review-report |
:::
::::
