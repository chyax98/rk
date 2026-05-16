# RenderKit 1.0 Product Pass 9 — Authoring Design Directives

Status: implemented and verified  
Date: 2026-05-17

## Objective

The active goal requires RenderKit to learn from the cloned design resources, especially mature blog/product document systems, and to preserve process docs for review. This pass integrates one high-leverage finding from `html-anything`: shared anti-slop design directives.

Source inspected:

```text
research/design-assets/external-repos/html-anything/src/lib/templates/shared.ts
```

The source is a prompt-level design system used by every `html-anything` skill. RenderKit should not become prompt-only HTML generation, but the authoring constraints are valuable for Agent-authored `.rk.md` artifacts.

## Integrated change

Updated:

```text
skills/renderkit-authoring/SKILL.md
```

Added a mandatory `Design-quality directives` section covering:

1. Content determines structure.
2. Do not compress away user content.
3. Use real data only.
4. Reading-first output.
5. Visual restraint: one primary accent, neutral surfaces, 8px rhythm, soft borders/shadows.
6. Typography discipline: use structured blocks instead of wall-of-text Markdown.
7. Accessibility: contrast, headings, alt text, captions, table/chart labels.
8. No body editing assumption: human comments, Agent edits `.rk.md` and pushes revisions.

## Why this matters

RenderKit’s product quality depends on both renderer capabilities and Agent authoring behavior. If the Agent writes low-quality raw prose, even a good renderer cannot produce a top-tier document. The authoring skill is therefore part of the product surface.

This pass converts external design-resource research into concrete Agent behavior guidance.

## What was intentionally not integrated

- No HTML-only instructions such as Tailwind CDN, stdout HTML, or single-file HTML constraints. Those belong to `html-anything`, not RenderKit.
- No body-editing workflow. RenderKit remains Agent-to-UI: human comments, Agent revises source.
- No new runtime dependency.

## Validation

This is a skill/documentation pass. It does not change runtime code. Validation should be paired with the existing gates after any adjacent code changes:

```bash
pnpm verify
pnpm verify:sqlite
pnpm verify:smoke
```

## Follow-up

Future passes should similarly extract concrete, source-cited guidance from:

- `md2html` for print/a11y/document shell polish;
- `ui-ux-pro-max-skill` for design token/theme recommendation mapping;
- `guizang-ppt-skill` for future deck/presentation surfaces.
