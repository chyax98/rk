# RenderKit 外部设计资源分析 / External Design Resources Analysis

状态：已从本地 clone 完成分析  
日期：2026-05-17

## 中文执行摘要

六个外部仓库对 RenderKit 有价值，但集成方式应不同。按优先级排序：

1. **`md2html`** — 立即提取文档排版、目录、打印、无障碍和组件目录模式。
2. **`html-anything`** — 立即提取共享反 slop 设计指令和 skill 目录约定；研究示例，不要整体引入应用。
3. **`fireworks-tech-graph`** — 采用图表风格 token、形状词汇、箭头语义和 SVG 验证/布局规则。
4. **`ui-ux-pro-max-skill`** — 作为设计智能参考，用于主题/token 决策和未来设计选择工作流。
5. **`thesvg`** — 作为图表和产品/云图标来源，但需谨慎处理商标/许可证元数据。
6. **`guizang-ppt-skill`** — 对未来演示/幻灯片表面有价值，但暂不进入核心阅读/评论表面。

RenderKit 应保持**确定性的 Agent-to-UI**，而非变成纯 prompt HTML 生成。最佳路径是将这些资源吸收为**token、组件、创作规则、图表词汇和示例**，然后通过 `.rk.md` 块和 CLI/服务器反馈暴露。

---

## Executive conclusion

These six repositories are useful, but they should not be integrated the same way.

Priority order for RenderKit:

1. **md2html** — immediately extract document typography, TOC, print, accessibility, and component catalog patterns.
2. **html-anything** — immediately extract shared anti-slop design directives and skill registry conventions; study examples, do not vendor the app.
3. **fireworks-tech-graph** — adopt diagram style tokens, shape vocabulary, arrow semantics, and SVG validation/layout rules.
4. **ui-ux-pro-max-skill** — use as design-intelligence reference for theme/token decisions and future design selection workflow.
5. **thesvg** — use as icon source for diagrams and product/cloud references, but handle trademark/license metadata carefully.
6. **guizang-ppt-skill** — valuable for future presentation/deck surface, not core document reading/comment surface yet.

RenderKit should remain **deterministic Agent-to-UI**, not become prompt-only HTML generation. The best path is to absorb these resources as **tokens, components, authoring rules, diagram vocabularies, and examples**, then expose them through `.rk.md` blocks and CLI/server feedback.

---

## 1. `md2html` — deterministic document design reference

Evidence inspected:

- `SKILL.md` — agent workflow for analyzing Markdown and choosing components.
- `template.html` — full HTML/CSS/JS document shell, ~1,152 lines.
- `components.md` — component catalog, ~505 lines.
- `examples/` — reference input/output.

### What it is

A compact skill that converts long-form Markdown into a polished single-file HTML document. It is not a generic converter; the agent classifies sections into richer components.

### Valuable patterns

- CSS custom-property token system for light/dark themes.
- Responsive sidebar TOC with mobile drawer and scroll-spy.
- Print stylesheet.
- Accessibility discipline: skip link, focus rings, contrast, reduced motion.
- Component catalog: callouts, timelines, comparisons, key-point cards, collapsibles, Mermaid, tables, images, footnotes.
- Agent workflow: analyze structure → choose component → assemble deterministic HTML.

### RenderKit integration

P0:

- Use its CSS token categories as a check against RenderKit tokens.
- Port TOC/reading affordance patterns into RenderKit without making the page feel like a dashboard.
- Use `components.md` as an authoring-skill reference: Agent chooses blocks intentionally, not randomly.
- Improve print CSS using its stylesheet patterns.

Risk:

- Mermaid CDN dependency in md2html should not be copied directly; RenderKit should preserve local-first diagram rendering.

---

## 2. `html-anything` — large design/process ecosystem

Evidence inspected:

- Next.js app structure.
- `src/lib/templates/skills/*` — 75 skill folders.
- `src/lib/templates/shared.ts` — shared design directives.
- `src/lib/templates/loader.ts` — skill loader convention.
- `src/lib/agents/*` — agent CLI adapter layer.
- `src/lib/export/*` — WeChat/PNG/PPTX/etc. export modules.

### What it is

A full agentic HTML editor. It detects local coding agents, streams generated HTML into a sandboxed iframe, provides many skill templates, and exports to multiple formats.

### Valuable patterns

- **Design system as prompt**: shared directives for CJK fonts, 8px baseline grid, contrast, no pure black/white, no fake data.
- **Skill folder convention**: `SKILL.md` + `example.html` + optional `example.md`.
- **Large template gallery**: 75 examples across documents, decks, social cards, dashboards, reports.
- **SSE streaming agent architecture**.
- **Export pipeline**: WeChat CSS inlining, PNG screenshot, PPTX, standalone HTML.
- **Diff-edit mode**: use prior HTML to minimize design drift.

### RenderKit integration

P0:

- Copy the idea of shared design directives into `skills/renderkit-authoring/SKILL.md` and future design-review docs.
- Adopt the skill-folder convention for RenderKit recipes/templates: `SKILL.md` + `example.rk.md` + screenshot/evidence.

P1/P2:

- Study export modules later if RenderKit needs WeChat/X/Zhihu/PNG/PPTX export.
- Study agent adapters only if RenderKit becomes an agent launcher. Current RenderKit should not add that complexity yet.

Risks:

- Large and coupled to Next.js app state; do not vendor.
- Prompt-driven output is less deterministic than RenderKit’s block renderer.

---

## 3. `fireworks-tech-graph` — diagram visual language

Evidence inspected:

- `SKILL.md` — full diagram generation spec.
- `references/style-*.md` — seven diagram styles.
- `references/icons.md` — shape/product icon vocabulary.
- `references/svg-layout-best-practices.md` — layout/routing rules.
- `templates/*.svg`, `fixtures/*.json`, `scripts/generate-from-template.py`, validation scripts.

### What it is

A diagram generation skill and reference implementation for natural-language → SVG/PNG technical diagrams.

### Valuable patterns

- 7 diagram style systems: flat icon, dark terminal, blueprint, Notion clean, glassmorphism, Claude, OpenAI.
- Semantic shape vocabulary: LLM, Agent, Tool, Memory, Vector Store, API Gateway, etc.
- Semantic arrows: read/write/control/async/data-flow encoded by color/dash/label.
- SVG layout rules: spacing, orthogonal routing, label backgrounds, jump-over arcs.
- JSON fixture → SVG output pipeline.
- SVG validation scripts.

### RenderKit integration

P0:

- Create a RenderKit diagram visual-language document based on its shape/arrow semantics.
- Extend RenderKit `diagram` block documentation with recommended semantic diagram vocabulary.

P1:

- Add a structured diagram DSL later: `:::tech-graph` or `diagram engine="tech-graph"`.
- Use its style tokens for diagram themes without copying Python runtime.

Risks:

- Python generator is a reference, not a clean Node package.
- Manual coordinate/layout complexity remains.

---

## 4. `ui-ux-pro-max-skill` — design intelligence database

Evidence inspected:

- CSV databases: product, style, color, typography, landing, charts, UX guidelines, reasoning rules, Google Fonts, icons, stacks.
- Python search/generator scripts.
- Skill docs and workflow.

### What it is

A BM25/regex searchable UI/UX database with thousands of records and a design system generator.

### Valuable patterns

- Searchable design knowledge base instead of hardcoded taste.
- Industry → palette/style/typography reasoning rules.
- UX anti-patterns and pre-delivery checklists.
- Framework-specific implementation guidance.

### RenderKit integration

P0/P1:

- Use as research input for RenderKit design-token decisions.
- Build a small RenderKit design-decision doc mapping surfaces to recommended themes/tokens.

P2:

- Optional CLI helper later: `renderkit design recommend --surface review-report --domain ai-infra`.

Risks:

- Text recommendations only; still need deterministic renderer.
- BM25 approximate search; do not treat as authoritative truth.

---

## 5. `thesvg` — icon asset library

Evidence inspected:

- `src/data/icons.json` — ~6,030 structured icon records.
- `public/icons/*/*.svg` — SVG variants.
- packages for core/React/Vue/Svelte/CLI/MCP.

### What it is

A large SVG icon repository and package ecosystem with brand/cloud/product icons.

### Valuable patterns

- Manifest-based icon registry.
- Per-icon variants: default, mono, light, dark, color, wordmark.
- Typed package exports and CDN paths.
- MCP/search tooling for AI icon lookup.

### RenderKit integration

P1:

- Use as optional icon source for RenderKit diagrams and future `icon`/`badge` blocks.
- Prefer dependency/CDN/reference, not vendoring all SVGs.
- Preserve license/trademark metadata in any icon picker.

Risks:

- Brand/trademark licensing: not all icons are free to modify or use commercially.
- Repo is large; avoid bundling into core.

---

## 6. `guizang-ppt-skill` — presentation surface reference

Evidence inspected:

- `SKILL.md`.
- `template.html`, `template-swiss.html`.
- reference docs and validator.
- WebP backgrounds and Motion One fallback.

### What it is

A skill for generating polished HTML presentation decks with two curated visual systems: editorial magazine/electronic ink and Swiss International typography.

### Valuable patterns

- Locked layouts to avoid AI slop.
- Strong typography systems.
- Strict theme presets.
- Browser-preview workflow and validator.
- Rich deck layout catalog.

### RenderKit integration

P2:

- Use as future `surface: deck` / presentation mode reference.
- Borrow locked-layout discipline for any high-design RenderKit surface.

Risks:

- Presentation-specific, not core document reading/commenting.
- Preset-only constraints conflict with more flexible token systems.

---

## Cross-resource integration principles

1. **Keep RenderKit deterministic.** Use external repos as design references and asset sources, not as prompt-only runtime replacements.
2. **Page stays reading-first.** Any metadata-rich or heavy workflow from html-anything/md2html should move to CLI/server/agent feedback, not visible page chrome.
3. **Agent gets rich metadata; human sees content.** Store selectors, source ranges, block ids, and comment metadata in API/SQLite; display only subtle marks and readable comments.
4. **Prefer mature modules only where they are separable.** E.g. `highlight.js`, ECharts, SQLite, SVG icon packages. Avoid vendoring large full apps.
5. **Design tokens need provenance.** When adopting a token/pattern, record which external repo inspired it and why.

## 推荐集成待办 / Recommended integration backlog

> 中文区项目默认中文；下表保持中英双语，便于 review 时快速定位。

| 优先级 | 工作项 | 来源仓库 | RenderKit 目标 |
|---|---|---|---|
| P0 | 阅读优先文档打磨：排版、目录、打印、无障碍审计 | md2html | `apps/web/app/style.css`, `packages/design/src/*` |
| P0 | 共享反 slop 创作/设计指令 | html-anything, ui-ux-pro-max | `skills/renderkit-authoring/SKILL.md`, docs/product |
| P0 | UI 元信息精简：默认隐藏 block id / 类型 / 详情 | Objective + md2html | `ArtifactView.jsx`, block CSS |
| P0 | SQLite 存储 artifact/comment/selector 元信息 | Objective | `apps/web/lib/store.mjs`, `apps/web/lib/db.mjs` |
| P1 | 图表视觉语言规范 | fireworks-tech-graph + thesvg | `docs/product`, `diagram` 块文档 |
| P1 | 可选图标清单集成 | thesvg | 未来 `icon`/diagram helper |
| P1 | Recipe/skill 目录约定 | html-anything | `examples/gallery.json`, `skills/*` |
| P2 | 导出管道研究：PNG/HTML/PPTX/微信 | html-anything, guizang-ppt | 未来 CLI 命令 |
| P2 | 幻灯片/演示表面 | guizang-ppt | 未来 `surface: deck` |

---

Original English backlog:

| Priority | Work item | Source repo(s) | RenderKit target |
|---|---|---|---|
| P0 | Reading-first document polish: typography, TOC, print, a11y audit | md2html | `apps/web/app/style.css`, `packages/design/src/*` |
| P0 | Shared anti-slop authoring/design directives | html-anything, ui-ux-pro-max | `skills/renderkit-authoring/SKILL.md`, docs/product |
| P0 | UI metadata reduction: hide block ids/types/details by default | Objective + md2html | `ArtifactView.jsx`, block CSS |
| P0 | SQLite storage for artifact/comment/selector metadata | Objective | `apps/web/lib/store.mjs`, `apps/web/lib/db.mjs` |
| P1 | Diagram visual-language spec | fireworks-tech-graph + thesvg | `docs/product`, `diagram` block docs |
| P1 | Optional icon manifest integration | thesvg | future `icon`/diagram helper |
| P1 | Recipe/skill registry convention | html-anything | `examples/gallery.json`, `skills/*` |
| P2 | Export pipeline research: PNG/HTML/PPTX/WeChat | html-anything, guizang-ppt | future CLI commands |
| P2 | Deck/presentation surface | guizang-ppt | future `surface: deck` |

## Evidence

Local clone manifest:

```text
research/design-assets/top-design-resources-manifest.md
```

Parallel worker analyses:

```text
/tmp/renderkit-design-analysis-svg-graph.md
/tmp/renderkit-design-analysis-md-html.md
/tmp/renderkit-design-analysis-skills.md
```
