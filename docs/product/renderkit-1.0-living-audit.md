# RenderKit 1.0 Living Completion Audit

Status: active, not complete  
Date: 2026-05-17

This audit tracks the active user objective against concrete evidence. It is intentionally strict: green tests or many commits are not enough unless they cover the stated requirement.

## Objective distilled into deliverables

1. **Complete product-quality codebase** for local-first Agent-to-UI artifacts.
2. **Document UI better than raw Markdown / Feishu / Notion for this scope**: display and comments only.
3. **Agent builds documents from blocks** rather than humans reading raw Markdown.
4. **Mature reusable modules** wherever valuable.
5. **Design tokens informed by excellent systems** such as Apple/Notion/blog/product-doc systems.
6. **External design resources cloned, analyzed, documented, prioritized, and considered for integration**:
   - `glincker/thesvg`
   - `yizhiyanhua-ai/fireworks-tech-graph`
   - `haidang1810/md2html`
   - `nexu-io/html-anything`
   - `op7418/guizang-ppt-skill`
   - `nextlevelbuilder/ui-ux-pro-max-skill`
7. **Reading-first Web UI**: page is primarily a document, not dashboard chrome.
8. **Human only reviews/comments**; details and edits belong to CLI/server/Agent feedback.
9. **SQLite-backed storage** for artifact/revision/comment/selector metadata.
10. **Multi-worker flywheel** for large modules.
11. **Best architecture over legacy compatibility**.
12. **Actual `pw` CLI browser verification** before claiming completion.
13. **Agent ability is top-tier**: authoring skill, CLI feedback loop, validations.
14. **All process docs preserved and sorted for review**.
15. **TypeScript considered** as late-stage architecture hardening.

## Prompt-to-artifact checklist

| Requirement | Evidence | Current status | Gaps |
|---|---|---:|---|
| Local-first Agent-to-UI artifact flow | `packages/cli/bin/renderkit.mjs`, `apps/web/app/a/[id]/ArtifactView.jsx`, `apps/web/app/api/artifacts/**`, `~/.renderkit/data/renderkit.db` | Mostly done | More automated e2e specs needed |
| `.rk.md` block authoring | `packages/dsl/src/index.mjs`, `skills/renderkit-authoring/SKILL.md`, `examples/capabilities/*.rk.md` | Strong | TypeScript contracts pending |
| Mature modules | `highlight.js`, `echarts`, `mermaid`, `@terrastruct/d2`, PlantUML server render, `better-sqlite3` | Strong | Dependency footprint/audit still needed |
| Reading-first UI | Passes 1, 3, 4, 7; `.pw-evidence/narrative-sqlite-reading-pass7.png` | Good | Further md2html-inspired print/a11y polish in progress |
| Comments/review support | selection comments, quote selectors, persistent highlight, resolve/reopen, SQLite comments | Good | Filters, side markers, robust re-anchoring in progress |
| Human does not edit body in UI | No body editing API; UI comments only | Good | Keep auditing future UI additions |
| SQLite storage | `apps/web/lib/db.mjs`, `apps/web/lib/store.mjs`, `pnpm verify:sqlite` | Done | Old JSON migration/backfill optional |
| SQLite hardening | `scripts/verify-sqlite.mjs`: 102 assertions | Done | Add to main `verify`? maybe later |
| DSL architecture quality | `BLOCK_COMPILERS` registry, no repeated compiler if-chain except structural `tab` | Improved | Split compilers/types later |
| Rich display blocks | summary, callout, decision, code, table, chart, image, tabs, stat, checklist, quote, comparison, timeline, diagram engines | Strong | More blocks possible: timeline polish, callout icons, collapsible |
| External resources cloned | `research/design-assets/external-repos/` with manifest commits/sizes | Done | External repos gitignored, not vendored |
| External resources analyzed | `research/design-assets/renderkit-external-design-resources-analysis.md` | Done | Continue extracting concrete assets incrementally |
| Integration prioritization | `docs/product/renderkit-1.0-design-resource-integration-plan.md` | Done | Execute remaining P1/P2 integrations |
| Diagram visual language | `docs/renderkit-diagram-visual-language.md`, fixture, pw screenshot | Done as convention layer | No runtime `tech-graph` engine yet |
| Browser verification with `pw` | multiple `.pw-evidence/*`; `pw -h`; Pass 7 and Pass 8 evidence | Good | Need automated Playwright spec files |
| CLI/Agent feedback | `renderkit validate/push/status/feedback`, authoring skill | Good | Skill should absorb latest design directives |
| Process docs preserved | `docs/product/renderkit-1.0-pass*.md`, `research/design-assets/*.md` | Good | Keep index/sorting updated |
| Multi-worker flywheel | subagent runs: `207c3bdd`, `078acac7`, `26fba1ac`, `c1dccf57`, `11438e50` | Active | Avoid GLM-only saturation; use `kimi-for-coding` where available |
| TypeScript | `docs/product/renderkit-1.0-typescript-migration.md`, todo `#36` | Planned | Implement late-stage contracts |

## Current verification evidence

Latest known green gates:

```text
pnpm verify        -> Results: 212 passed, 0 failed
pnpm verify:sqlite -> Results: 102 passed, 0 failed
pnpm verify:smoke  -> Results: 24 passed, 0 failed
```

Recent browser evidence:

```text
.pw-evidence/narrative-sqlite-reading-pass7.png
.pw-evidence/narrative-sqlite-comment-subtle-pass7.png
.pw-evidence/narrative-sqlite-review-pass7.png
.pw-evidence/diagram-visual-language-flywheel.png
```

Recent commits:

```text
0c26718 document typescript migration plan
c91a1ae harden sqlite and document diagram language
517add5 add sqlite narrative blocks and design research
904140b add editorial product components
320b94e add rich media tabs blocks
```

## Missing / incomplete before final completion

The active goal is **not complete** because these requirements remain incomplete or weakly verified:

1. **Comment UX flywheel** is still in progress: filters, side markers, and robust prefix/suffix anchoring are not integrated on mainline.
2. **md2html-inspired reading/print/a11y polish** is still in progress on worker branch, not integrated on mainline.
3. **Automated browser specs** are still missing. `pw` command evidence exists, but there is no durable Playwright test suite yet.
4. **TypeScript contracts** are planned but not implemented.
5. **Agent authoring skill** still needs another pass to absorb shared anti-slop directives from `html-anything` and design guidance from `ui-ux-pro-max`.
6. **Final 1.0 audit** has not been run after all modules land.

## Next actions

1. Integrate active worker output from `11438e50` when complete.
2. Verify with:

```bash
pnpm verify
pnpm verify:sqlite
pnpm verify:smoke
pw -h
pw errors / get / screenshot on affected pages
```

3. Commit pass docs and evidence.
4. Launch next worker batch, mixing available models and avoiding GLM-only saturation.
5. Only after the checklist has no missing items should `update_goal(status="complete")` be called.
