# RenderKit 1.0 Design Resource Integration Plan

Status: active integration plan  
Date: 2026-05-17

## Objective restated

The product goal is not “pretty Markdown”. RenderKit should be a local-first Agent-to-UI system where:

1. Agent authors `.rk.md` using high-level blocks.
2. Web UI is a **document reading and commenting surface**, not a dashboard.
3. Heavy metadata, source ranges, selector details, and workflow state live in CLI/server/API/SQLite for the Agent.
4. Human sees polished document content and lightweight comment affordances.
5. Design quality should be learned from mature document/blog/design resources.
6. Every integration step must leave durable process docs for later review.

## External resources inspected

See:

```text
research/design-assets/top-design-resources-manifest.md
research/design-assets/renderkit-external-design-resources-analysis.md
```

All six user-provided repositories were cloned into:

```text
research/design-assets/external-repos/
```

The clone directory is intentionally git-ignored to avoid vendoring large external repositories and nested `.git` histories. The manifest records exact remotes, commits, and sizes.

## Integration principles

### 1. Page is reading-first

The Web page should not show implementation metadata unless the user explicitly enters Review mode or interacts with a subtle marker. Default document view should contain:

- title and document content;
- polished blocks;
- subtle comment marks;
- lightweight floating tools.

It should not default-show:

- block type badges;
- block ids;
- source ranges;
- selector JSON;
- revision/debug metadata;
- large comment sidebars that dominate reading.

### 2. Agent/API can be metadata-rich

RenderKit should still store rich metadata for Agent workflows:

- artifact id;
- revision number;
- block id;
- source range;
- source excerpt;
- text quote selector: exact/prefix/suffix;
- block snapshot;
- comment lifecycle state.

This belongs in SQLite + feedback API, not the primary reading canvas.

### 3. Deterministic renderer first

External repos are design assets, not replacements for RenderKit. Avoid switching to prompt-only HTML generation. Prefer extracting:

- design tokens;
- typography rules;
- block recipes;
- diagram semantics;
- icon manifests;
- validation checklists.

### 4. No old-code compatibility constraint

If a clean architecture is better, prefer the clean architecture. The current move from JSON files to SQLite and the DSL compiler registry refactor are aligned with this rule.

## Prioritized integration roadmap

### P0 — Current pass: architecture + reading/comment core

Status: in implementation.

Inputs:

- User feedback: UI is too heavy; comments too dominant; use SQLite.
- Worker output: UI-light mode patch.
- Worker output: SQLite store migration.
- Architecture critique: DSL had repeated compiler `if` chains.

Concrete changes:

- DSL compiler dispatch now uses `BLOCK_COMPILERS` registry.
- `comparison` and `timeline` blocks added for narrative documents.
- SQLite local store added at `~/.renderkit/data/renderkit.db`.
- Reading mode comment count is hidden from toolbar; block comments become subtle dots until hover/review mode.

Validation gates:

```bash
pnpm verify
pnpm verify:smoke
pw -h
pw session recreate ...
pw errors ...
pw get ...
pw screenshot ...
```

### P1 — md2html-inspired document polish

Source:

- `md2html/template.html`
- `md2html/components.md`

Integrate:

- TOC and scroll-spy patterns, but keep them secondary.
- Better print CSS.
- Accessibility details: skip link, focus rings, reduced motion.
- Component-selection heuristics for RenderKit authoring skill.

Targets:

```text
apps/web/app/style.css
packages/design/src/tokens.css
packages/design/src/blocks.css
skills/renderkit-authoring/SKILL.md
```

### P1 — html-anything-inspired skill/recipe registry

Source:

- `html-anything/src/lib/templates/shared.ts`
- `html-anything/src/lib/templates/loader.ts`
- `html-anything/src/lib/templates/skills/*`

Integrate:

- Shared anti-slop design directives into authoring skill.
- Recipe folder convention: `SKILL.md` + `example.rk.md` + screenshot/evidence.
- Keep agent execution out of RenderKit for now; RenderKit stays renderer/review surface.

Targets:

```text
skills/renderkit-authoring/SKILL.md
examples/gallery.json
research/design-assets/
```

### P1 — fireworks-tech-graph diagram language

Source:

- `fireworks-tech-graph/references/style-*.md`
- `fireworks-tech-graph/references/icons.md`
- `fireworks-tech-graph/references/svg-layout-best-practices.md`

Integrate:

- Semantic shapes for Agent/LLM/Tool/Memory/API/Vector Store.
- Semantic arrows for read/write/control/async/data.
- Diagram style presets for blueprint, Notion clean, terminal, Claude/OpenAI official.
- SVG validation guidance.

Targets:

```text
docs/product/renderkit-diagram-visual-language.md
packages/blocks/src/DiagramBlock.jsx
skills/renderkit-authoring/SKILL.md
```

### P2 — thesvg icon source

Source:

- `thesvg/src/data/icons.json`
- `thesvg/public/icons/*`

Integrate:

- Optional icon lookup for diagrams and badges.
- Preserve license/trademark metadata.
- Do not vendor all SVGs into core package.

Potential target:

```text
packages/assets or apps/web/lib/icon-registry.mjs
```

### P2 — ui-ux-pro-max design intelligence

Source:

- CSV databases and search/generator scripts.

Integrate:

- Use as design-decision reference.
- Later CLI idea:

```bash
renderkit design recommend --surface review-report --domain ai-infra
```

### P3 — guizang presentation surface

Source:

- `guizang-ppt-skill/template.html`
- `guizang-ppt-skill/template-swiss.html`
- layout and validator docs.

Integrate later as:

```yaml
surface: deck
```

Not part of current core reading/comment surface.

## Current validation checklist before claiming this pass complete

- [ ] `pnpm verify` green after SQLite/DSL/UI changes.
- [ ] `pnpm verify:smoke` green after SQLite/DSL/UI changes.
- [ ] At least one artifact pushed using SQLite store.
- [ ] Browser page opened with `pw`.
- [ ] `pw errors` shows no visible errors except favicon.
- [ ] DOM checks confirm narrative blocks render.
- [ ] DOM checks confirm reading mode comment UI is subtle.
- [ ] Screenshot evidence captured.
- [ ] Docs committed with code.

## Next worker flywheel

After current pass is green and committed, launch workers in parallel:

1. Worker A — md2html-inspired reading/print/a11y polish.
2. Worker B — comment UI slimming + filters/markers.
3. Worker C — SQLite migration hardening and API tests.
4. Worker D — fireworks diagram visual language doc + prototype fixture.

Use `worker` for implementation. Use `planner` only for major architecture decisions. Use `reviewer` sparingly for final high-risk audits.
