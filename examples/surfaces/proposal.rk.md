---
title: Proposal Surface Example
theme: paper-light
surface: proposal
---

# Proposal Surface Example

:::sum{id="proposal-summary" title="Recommendation"}
Use the proposal surface when the reader needs a balanced recommendation, alternatives, and an execution path without the density of an engineering plan.
:::

:::dec{id="proposal-decision" q="Should RenderKit expose Agent design metadata through CLI?" chosen="Expose recipes and design resources as deterministic JSON" status="approved"}
- Agents need machine-readable guidance before authoring `.rk.md`.
- CLI metadata keeps the Web surface reading-first.
- External design resources remain local assets, not copied runtimes.
:::

:::compare{id="proposal-options" title="Options compared"}
| Option | Strength | Limitation |
|---|---|---|
| Read long docs | Full context | Slow and easy to drift |
| CLI JSON metadata | Deterministic and scriptable | Needs curated manifest |
| Copy external runtime | Fast visual jump | Breaks local-first deterministic scope |
:::

:::roadmap{id="proposal-timeline" title="Execution path"}
- done: Shared contracts gate
- doing: Agent design CLI
- next: Optional design recommend command
:::

:::warn{id="proposal-risk" title="Integration boundary"}
Do not turn RenderKit into a generic HTML generator. Agent output remains `.rk.md` blocks; design resources inform structure, tokens, and review quality.
:::
