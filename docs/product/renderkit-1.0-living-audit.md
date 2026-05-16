# RenderKit 1.0 持续完成度审计

状态：进行中，尚未完成  
日期：2026-05-17

本审计用于把用户的长期目标映射到真实证据。标准保持严格：测试变绿、提交很多、实现很多，都不能单独证明目标完成；必须逐项覆盖需求。

## 目标拆解为可交付项

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

## 需求到证据清单

| Requirement | Evidence | Current status | Gaps |
|---|---|---:|---|
| Local-first Agent-to-UI artifact flow | `packages/cli/bin/renderkit.mjs`, `apps/web/app/a/[id]/ArtifactView.jsx`, `apps/web/app/api/artifacts/**`, `~/.renderkit/data/renderkit.db`, `scripts/verify-browser.mjs` | Strong | Final audit still needed |
| `.rk.md` block authoring | `packages/dsl/src/index.mjs`, `skills/renderkit-authoring/SKILL.md`, `examples/capabilities/*.rk.md` | Strong | TypeScript contracts pending |
| Mature modules | `highlight.js`, `echarts`, `mermaid`, `@terrastruct/d2`, PlantUML server render, `better-sqlite3` | Strong | Dependency footprint/audit still needed |
| Reading-first UI | Passes 1, 3, 4, 7, 10；`.pw-evidence/narrative-sqlite-reading-pass7.png`、`.pw-evidence/reading-a11y-skiplink-flywheel.png` | Good | 仍需自动化浏览器回归 |
| Comments/review support | selection comments、quote selectors、persistent highlight、resolve/reopen、SQLite comments、filters、side markers、prefix/suffix re-anchor | Good | 仍需更多编辑后 re-anchor 回归 |
| Human does not edit body in UI | No body editing API; UI comments only | Good | Keep auditing future UI additions |
| SQLite storage | `apps/web/lib/db.mjs`, `apps/web/lib/store.mjs`, `pnpm verify:sqlite` | Done | Old JSON migration/backfill optional |
| SQLite hardening | `scripts/verify-sqlite.mjs`: 102 assertions | Done | Add to main `verify`? maybe later |
| DSL architecture quality | `BLOCK_COMPILERS` registry, no repeated compiler if-chain except structural `tab` | Improved | Split compilers/types later |
| Rich display blocks | summary, callout, decision, code, table, chart, image, tabs, stat, checklist, quote, comparison, timeline, diagram engines | Strong | More blocks possible: timeline polish, callout icons, collapsible |
| External resources cloned | `research/design-assets/external-repos/` with manifest commits/sizes | Done | External repos gitignored, not vendored |
| External resources analyzed | `research/design-assets/renderkit-external-design-resources-analysis.md` | Done | Continue extracting concrete assets incrementally |
| Integration prioritization | `docs/product/renderkit-1.0-design-resource-integration-plan.md` | Done | Execute remaining P1/P2 integrations |
| Diagram visual language | `docs/renderkit-diagram-visual-language.md`, fixture, pw screenshot | Done as convention layer | No runtime `tech-graph` engine yet |
| Browser verification with `pw` | `scripts/verify-browser.mjs`; `pnpm verify:browser -> 37 passed, 0 failed`; multiple `.pw-evidence/*`; `pw -h`; Pass 7/8/10/11 evidence | Strong | Add more cases as future blocks land |
| CLI/Agent feedback | `renderkit validate/push/status/feedback`, authoring skill | Good | Skill should absorb latest design directives |
| Process docs preserved | `docs/product/renderkit-1.0-pass*.md`, `research/design-assets/*.md` | Good | Keep index/sorting updated |
| Multi-worker flywheel | subagent runs: `207c3bdd`, `078acac7`, `26fba1ac`, `c1dccf57`, `11438e50`, `07ffd4c9` | Active | 避免 GLM-only；`kimi-for-coding` 可用 |
| TypeScript | `docs/product/renderkit-1.0-typescript-migration.md`, todo `#36` | Planned | Implement late-stage contracts |

## 当前验证证据

Latest known green gates:

```text
pnpm verify         -> Results: 212 passed, 0 failed
pnpm verify:sqlite  -> Results: 102 passed, 0 failed
pnpm verify:smoke   -> Results: 24 passed, 0 failed
pnpm verify:browser -> Results: 37 passed, 0 failed
```

Recent browser evidence:

```text
.pw-evidence/narrative-sqlite-reading-pass7.png
.pw-evidence/narrative-sqlite-comment-subtle-pass7.png
.pw-evidence/narrative-sqlite-review-pass7.png
.pw-evidence/diagram-visual-language-flywheel.png
.pw-evidence/comment-filters-flywheel-review.png
.pw-evidence/reading-a11y-skiplink-flywheel.png
.pw-evidence/verify-browser-diagram.png
```

Recent commits:

```text
7cafa0c update renderkit living audit
4dab3f0 improve reading accessibility and comment filters
2863f03 document chinese-first project writing rule
e83a033 document design token source map
6d803fe add renderkit authoring design directives
```

## 最终完成前仍缺什么

当前长期目标 **尚未完成**，因为以下要求仍未完成或验证不足：

1. **TypeScript contracts** are planned but not implemented.
2. **更多外部设计资源的运行时集成**仍未完成：`md2html` / `html-anything` / `ui-ux-pro-max` / `guizang` 的分析已落文档，但仍有部分只停留在研究或 authoring guidance 层。
3. **Final 1.0 audit** has not been run after all modules land.

已在主线完成但仍需后续观察：

- Comment UX flywheel：评论筛选、轻量侧边标记、prefix/suffix selector anchoring 已落到主线，见 `docs/product/renderkit-1.0-pass10-reading-comment-flywheel.md`。
- md2html-inspired reading/print/a11y polish 已落到主线，见同一 pass 文档。
- `html-anything` shared anti-slop directives 已吸收到 authoring skill，见 `docs/product/renderkit-1.0-pass9-authoring-directives.md`。

## 下一步

1. 处理 TypeScript contracts / shared runtime schema，降低 DSL-Web-CLI 接口漂移风险。
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
