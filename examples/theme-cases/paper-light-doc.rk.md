---
title: Paper Light Documentation Case
theme: paper-light
surface: engineering-plan
---

# Paper Light Documentation Case

This case constrains the default white document experience for plans, briefs, and normal review artifacts.

:::summary{id="paper-summary" title="Expected reading experience"}
Paper Light should feel like a mature product document: white canvas, quiet rails, high body-text contrast, subtle block borders, and no dark default chrome.
:::

:::callout{width="half" id="paper-risk" tone="warning" title="Regression to avoid"}
Do not let surface defaults pull engineering-plan back into dark mode. Theme selection is explicit, and the fallback is paper-light.
:::

:::decision-card{id="paper-decision"}
question: What is the default theme?
chosen: paper-light
status: approved

rationale:
  - White documents are familiar and screenshot-friendly
  - Code, diagrams, and comments remain readable without a dark canvas
  - Dark mode is optional, not the product default

alternatives:
  - name: dark-pro
    reason: Kept as opt-in for users who explicitly request dark mode
:::

:::code{id="paper-code" language="yaml" title="Frontmatter"}
```yaml
title: Example Plan
theme: paper-light
surface: engineering-plan
```
:::

:::note{id="paper-reference" title="Reference note"}
Related plans should be linked in prose or represented as tables/diagrams. Cross-document embedding is intentionally outside the 1.0 reading/commenting scope.
:::
