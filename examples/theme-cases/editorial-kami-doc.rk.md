---
title: Editorial Kami Longform Case
theme: editorial-kami
surface: documentation
---

# Editorial Kami Longform Case

Editorial Kami is for long-form narrative documents where a warm paper tone is useful but the UI must still feel product-grade.

:::summary{id="kami-summary" title="Tone"}
The theme should feel like a restrained editorial memo: warm background, strong text, low-chroma accents, and enough structure for agent review.
:::

:::callout{id="kami-guideline" tone="info" title="When to use"}
Use this for PRDs, strategy notes, and documentation where prose dominates. Do not use it for terminal runbooks.
:::

:::decision-card{id="kami-decision"}
question: Should editorial style override review affordances?
chosen: no
status: approved

rationale:
  - Block IDs, comments, and source excerpts must remain functional
  - Typography can be warmer without hiding review controls

alternatives:
  - name: full magazine layout
    reason: Too decorative for an Agent-to-UI review surface
:::

:::code{id="kami-code" language="md" title="Subdocument marker"}
```md
:::subdocument{id="child-doc" title="Appendix" source="appendix.rk.md"}
Short context for the child document.
:::
```
:::
