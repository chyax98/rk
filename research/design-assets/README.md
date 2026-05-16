# RenderKit Design Assets Research Index

Status: active research asset index  
Date: 2026-05-17

This directory preserves external design-resource research for RenderKit 1.0. The user explicitly requested that these repositories be fully cloned, analyzed, documented, prioritized, and preserved for later review.

## Local clone policy

External repositories are cloned locally under:

```text
research/design-assets/external-repos/
```

This directory is git-ignored because it contains large third-party repos and nested `.git` histories. Do not vendor those repos into RenderKit's git history unless a specific small asset is intentionally extracted with license notes.

The clone manifest records exact inspected remotes, commits, sizes, and primary value:

```text
research/design-assets/top-design-resources-manifest.md
```

## Required repositories

| Repo | Local clone | Analysis status | Primary integration value |
|---|---|---:|---|
| `https://github.com/glincker/thesvg` | `external-repos/thesvg` | analyzed | SVG icon registry, variants, brand/cloud icon source |
| `https://github.com/yizhiyanhua-ai/fireworks-tech-graph.git` | `external-repos/fireworks-tech-graph` | analyzed | Diagram shape/arrow vocabulary, layout rules, styles |
| `https://github.com/haidang1810/md2html.git` | `external-repos/md2html` | analyzed | Beautiful deterministic document shell, CSS tokens, print/a11y |
| `https://github.com/nexu-io/html-anything.git` | `external-repos/html-anything` | analyzed | Shared design directives, skill registry, export patterns, examples |
| `https://github.com/op7418/guizang-ppt-skill.git` | `external-repos/guizang-ppt-skill` | analyzed | Presentation/deck visual systems and locked layouts |
| `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git` | `external-repos/ui-ux-pro-max-skill` | analyzed | Design intelligence DB, palettes, typography, UX guidance |

## Durable analysis documents

Read in this order:

1. Manifest and clone evidence:

```text
research/design-assets/top-design-resources-manifest.md
```

2. Cross-repo analysis and integration priority:

```text
research/design-assets/renderkit-external-design-resources-analysis.md
```

3. Product integration plan:

```text
docs/product/renderkit-1.0-design-resource-integration-plan.md
```

4. Diagram-specific extraction from `fireworks-tech-graph` + `thesvg`:

```text
docs/renderkit-diagram-visual-language.md
examples/capabilities/diagram-visual-language.rk.md
docs/product/renderkit-1.0-pass8-sqlite-diagram-flywheel.md
```

5. Historical external reference research:

```text
research/design-assets/renderkit-1.0-external-references.md
```

## Priority queue derived from research

| Priority | Source repo(s) | RenderKit target |
|---|---|---|
| P0 | `md2html` | reading-first document shell, print CSS, accessibility polish |
| P0 | `html-anything` | shared anti-slop design directives, skill/recipe folder convention |
| P1 | `fireworks-tech-graph` + `thesvg` | diagram visual language and optional icon lookup |
| P1 | `ui-ux-pro-max-skill` | design-token and typography recommendation reference |
| P2 | `html-anything` | export research: PNG, HTML, WeChat/Zhihu/PPTX patterns |
| P2 | `guizang-ppt-skill` | future deck/presentation surface |

## Non-negotiable documentation rule

Whenever a future pass extracts anything from these repos, it must add or update a durable document in one of these locations:

```text
research/design-assets/
docs/product/
docs/
```

The doc must include:

1. Source repo and commit/hash if relevant.
2. What was inspected or extracted.
3. Why it matters for RenderKit.
4. What was integrated.
5. What was intentionally not integrated.
6. Validation evidence.
7. Licensing or attribution concerns.

## Current status

The repositories have been cloned and analyzed. Some findings are already integrated as docs/fixtures:

- `fireworks-tech-graph` + `thesvg` → `docs/renderkit-diagram-visual-language.md`
- `fireworks-tech-graph` + `thesvg` → `examples/capabilities/diagram-visual-language.rk.md`
- SQLite and diagram pass → `docs/product/renderkit-1.0-pass8-sqlite-diagram-flywheel.md`

Still pending:

- md2html-inspired reading/print/a11y integration on mainline.
- html-anything shared design directives in authoring skill.
- ui-ux-pro-max design-token mapping doc.
- guizang deck-surface exploration doc.
