---
title: Narrative Blocks Capability
theme: paper-light
surface: engineering-plan
---

# Narrative Blocks Capability

:::sum{id="narrative-summary" title="Why this matters"}
Agent-authored artifacts need side-by-side evaluation (comparison) and sequential progress tracking (timeline) to present trade-offs and rollout plans clearly.
:::

::::compare{id="framework-comparison" title="Framework comparison" width="wide"}
| Criterion | Option A: React | Option B: Svelte | Option C: Vue |
|---|---|---|---|
| Bundle size | 42 kB | 8 kB | 33 kB |
| Learning curve | Moderate | Low | Low |
| Ecosystem | Largest | Growing | Large |
| SSR support | Next.js | SvelteKit | Nuxt |
::::

:::roadmap{id="rollout-timeline" title="Rollout timeline" width="wide"}
- [done] Alpha internal dogfood: Core rendering pipeline stable
- [done] Beta opt-in: 12 teams onboarded, 80+ artifacts pushed
- [active] GA staged rollout: 10% → 25% → 50% → 100% over 4 weeks
- [next] Post-GA: Comment anchoring v2, collaborative editing
- [planned] v2.0: Plugin surface, custom block types
:::

:::quote{id="narrative-principle" cite="RenderKit principle" role="Agent-to-UI"}
Comparison tables make trade-offs scannable. Timelines make progress concrete.
:::
