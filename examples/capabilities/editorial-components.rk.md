---
title: Editorial Components Capability
theme: paper-light
surface: data-report-lite
---

# Editorial Components Capability

:::sum{id="editorial-summary" title="Why this matters"}
Agent-authored artifacts need polished product primitives: KPI stats, checklists, and pull quotes that feel closer to mature blog/product docs than raw Markdown.
:::

::::grid{id="stats-row" columns="3" title="Launch metrics"}
:::metric{id="adoption-stat" label="Adoption" value="74%" delta="+18%" tone="success"}
Share of reviewed artifacts using visual blocks.
:::

:::metric{id="review-stat" label="Review latency" value="12m" delta="-31%" tone="success"}
Median time to first actionable human comment.
:::

:::metric{id="risk-stat" label="Open risks" value="3" delta="watch" tone="warning"}
Risks that still need owner confirmation.
:::
::::

:::quote{id="product-quote" cite="RenderKit principle" role="Agent-to-UI" width="wide"}
The artifact should make the next decision obvious before the reader opens the raw source.
:::

:::todo{id="ship-checklist" title="Product readiness checklist" width="wide"}
- [x] Reading-first layout
- [x] Tables, charts, code, image, tabs
- [x] Selection comments and resolve/reopen
- [ ] Robust quote re-anchoring after source edits
- [ ] Automated Playwright specs
:::
