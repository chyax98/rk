---
title: CloudOps 4.7 Launch Review
theme: paper-light
surface: engineering-plan
---

# CloudOps 4.7 Launch Review

:::sum{id="exec-summary" title="Executive summary"}
CloudOps 4.7 is ready for staged rollout after two fixes: isolate the beta-only queue policy and add Graphviz to PlantUML-capable runners. This artifact uses RenderKit 1.0 product primitives: wide layout, visual hierarchy, shorthand blocks, diagrams, code, table, and lightweight review mode.
:::

::::grid{id="decision-grid" columns="3" title="Launch signal"}
:::ok{id="ship-signal" title="Ship signal"}
Core control-plane migration tests passed in RND and smoke coverage matches the release checklist.
:::

:::warn{id="watch-signal" title="Watch signal"}
PlantUML deployment diagrams need Graphviz on reviewer machines; sequence diagrams are already covered.
:::

:::alert{id="blocker-signal" title="No-go threshold"}
Do not expand past 25% if queue latency p95 exceeds 180ms for two consecutive windows.
:::
::::

:::dec{id="rollout-decision" q="Should CloudOps 4.7 proceed to 10% rollout?" chosen="Proceed with guarded rollout" status="approved"}
- RND validation is green for the critical migration path.
- Rollback is a config-only operation with no data migration dependency.
- The remaining risk is operational visibility, not correctness.
:::

:::fig{id="rollout-flow" caption="Guarded rollout flow"}
flowchart LR
  A[Merge release branch] --> B[Deploy beta]
  B --> C{RND smoke green?}
  C -- yes --> D[10% rollout]
  C -- no --> R[Rollback config]
  D --> E{p95 latency < 180ms?}
  E -- yes --> F[25% rollout]
  E -- no --> R
:::

:::table{id="risk-table" title="Risk matrix" width="wide"}
| Area | Current signal | Decision impact | Owner |
|---|---|---|---|
| Queue latency | p95 142ms in RND | Continue rollout | SRE |
| PlantUML Graphviz | Missing on local reviewer host | Docs-only fallback risk | Tooling |
| D2 renderer | Local WASM SVG green | No release impact | Agent Platform |
| Rollback | Config-only tested | Safe to proceed | Release |
:::

:::fig{id="latency-trend" engine="echarts-line" caption="RND latency trend" width="wide"}
window,p50,p95
09:00,82,138
10:00,79,142
11:00,77,136
12:00,80,144
13:00,76,132
:::

:::src{id="rollback-command" language="bash" title="Rollback command"}
```bash
renderkit validate examples/capabilities/product-system.rk.md --json
kubectl rollout undo deployment/cloudops-control-plane -n cloudops-beta
```
:::

:::note{id="review-note" title="Review UX expectation"}
Default mode should read like a polished technical artifact. Block ids, source inspector, and comment controls should appear only after Review mode is enabled.
:::
