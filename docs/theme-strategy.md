# RenderKit Theme Strategy

RenderKit themes are product modes, not decorative skins. A theme must make the review task easier and must not conflict with the artifact surface.

## Decision rules

1. **Default is `paper-light`.** Normal documents should look like clean white product documentation: readable, screenshot-friendly, and familiar.
2. **Surface describes information shape; theme describes reading environment.** A surface such as `engineering-plan` should not force dark mode.
3. **Explicit frontmatter wins if valid.** If an author chooses `theme`, the parser keeps it. Unknown themes warn and fall back to `paper-light`.
4. **Dark mode is opt-in only.** `dark-pro` exists for developer-preference demos and high-contrast workspaces, not default artifacts.
5. **No high-saturation chrome.** App rails, inspector, context menus, and source excerpts must stay quieter than document content.
6. **Every theme must support every core block.** heading, paragraph, summary, callout, decision-card, code, diagram, and subdocument must remain legible.
7. **Review actions never mutate body content.** Selection/right-click may inspect, comment, or copy feedback commands only.

## Theme meanings

| Theme | Meaning | Use when | Avoid when |
|---|---|---|---|
| `paper-light` | Default white document/product UI. Neutral rails, low-noise cards, light code blocks. | Most plans, briefs, review reports, screenshots, long reading. | User explicitly wants a dark/terminal feel. |
| `editorial-kami` | Warm paper editorial reading mode with restrained red accent. | Long narrative docs, PRDs, strategy memos, documentation. | Dense operational dashboards or terminal runbooks. |
| `dark-pro` | Optional developer dark mode. Should be readable and sober, never neon/AI-demo-like. | User asks for dark mode; short engineering demos; low-light use. | Default docs, stakeholder review, screenshot-heavy artifacts. |
| `amber-terminal` | Terminal/ops mode for amber/yellow environment affinity. | Runbooks, CLI-heavy operational flows. | Normal prose docs or executive summaries. |

## Recommended surface defaults

| Surface | Recommended theme | Reason |
|---|---|---|
| `engineering-plan` | `paper-light` | Engineering docs are usually reviewed, copied, and screenshotted; white docs are the least surprising default. |
| `decision-brief` | `paper-light` | Decision artifacts need clarity and low ceremony. |
| `review-report` | `paper-light` | Long issue lists and code snippets need high text contrast and quiet chrome. |
| `runbook` | `amber-terminal` | Operators benefit from terminal affinity and command emphasis. |
| `data-report-lite` | `paper-light` | Metrics and tables read better on a light document surface. |

## Compatibility matrix

This matrix defines expected product quality. It is not a hard parser rule; it guides examples, screenshots, and review.

| Surface × Theme | paper-light | editorial-kami | dark-pro | amber-terminal |
|---|---:|---:|---:|---:|
| engineering-plan | ✅ default | ⚠ narrative-heavy only | ⚠ opt-in | ⚠ CLI-heavy only |
| decision-brief | ✅ default | ✅ long memo | ⚠ opt-in | ❌ usually noisy |
| review-report | ✅ default | ✅ prose-heavy review | ⚠ avoid for long reports | ❌ noisy |
| runbook | ⚠ okay | ❌ too editorial | ⚠ opt-in | ✅ default |
| data-report-lite | ✅ default | ⚠ commentary-heavy | ⚠ opt-in | ❌ noisy |

Legend: ✅ recommended, ⚠ acceptable with explicit reason, ❌ avoid in examples/defaults.

## Screenshot case policy

Theme changes require at least one real browser inspection per supported theme:

- `examples/theme-cases/paper-light-doc.rk.md`
- `examples/theme-cases/editorial-kami-doc.rk.md`
- `examples/theme-cases/dark-pro-dev.rk.md`
- `examples/theme-cases/amber-terminal-runbook.rk.md`

Each case must include multiple block types and enough content to expose rail, topbar, inspector, code, and context-menu contrast issues.
