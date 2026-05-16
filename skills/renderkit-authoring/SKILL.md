---
name: renderkit-authoring
description: Guide for AI agents to author, validate, push, and iterate RenderKit .rk.md artifacts
---

# RenderKit Authoring Skill

## When to use RenderKit

Use RenderKit when you need to produce a structured, reviewable artifact that a human will comment on — not a plain Markdown file. Typical use cases:

- Engineering plans and refactoring proposals
- Decision briefs with alternatives analysis
- Review reports and audit findings
- Runbooks and operational procedures
- Lightweight data/summary reports

Do NOT use RenderKit for:
- Casual notes, chat responses, or inline documentation
- Files the human will directly edit (RenderKit artifacts are Agent-authored, human-reviewed)

## File format: `.rk.md`

RenderKit uses a Markdown-based DSL with frontmatter and directive blocks.

### Frontmatter

```yaml
---
title: Your Artifact Title
theme: dark-pro          # dark-pro | paper-light | amber-terminal
surface: engineering-plan # engineering-plan | decision-brief | review-report | runbook | data-report-lite
---
```

- `title` is required.
- `theme` controls visual appearance. Default: `dark-pro`.
- `surface` hints at artifact layout/density. Optional but recommended.

### Ordinary Markdown

Standard Markdown headings (`#`, `##`, `###`) and paragraphs are automatically converted to `heading` and `paragraph` blocks. Their IDs are auto-generated (`heading-1`, `paragraph-1`).

### Directive blocks

All directive blocks require a stable `id`. The `id` must match `[a-zA-Z0-9_-]+` and must be unique within the artifact. **Never change an existing block id** — it is the anchor for human comments. If you need to restructure, delete the old block and create a new one with a new id.

#### summary

```md
:::summary{id="exec-summary" title="Executive Summary"}
Your summary text here. Keep it dense and actionable.
:::
```

#### callout

```md
:::callout{id="risk-note" tone="warning" title="Risk Alert"}
Callout content. Tones: info | warning | danger | success.
:::
```

#### decision-card

```md
:::decision-card{id="auth-choice"}
question: Which auth mechanism?
chosen: JWT + Redis
status: proposed

rationale:
  - Stateless
  - Horizontally scalable

alternatives:
  - name: Session
    reason: Stateful, hard to scale
  - name: OAuth2
    reason: Overkill for current scope
:::
```

Body is YAML. Required fields: `question`, `chosen`. Optional: `status` (draft|proposed|approved|blocked), `rationale` (list), `alternatives` (list of objects with `name` and `reason`).

#### code

````md
:::code{id="example-code" language="js" title="Example"}
```js
console.log("hello renderkit");
```
:::
````

Must contain a fenced code block. `language` and `title` are optional attributes.

#### diagram

````md
:::diagram{id="flow" engine="mermaid" caption="Process Flow"}
```mermaid
flowchart LR
  A --> B --> C
```
:::
````

Only `mermaid` engine is supported. Must contain a fenced code block with `mermaid` language.

## Stable ID rules

- Every directive block MUST have an `id`.
- IDs must be `[a-zA-Z0-9_-]+`.
- IDs must be unique within the artifact.
- **Do not rename existing IDs** when revising. Comments anchor to IDs.
- If you delete a block, open comments on it become "orphaned" — that is acceptable.

## CLI workflow

```bash
# 1. Validate (always validate before push)
renderkit validate <file>.rk.md --json

# 2. Push (creates artifact or new revision)
renderkit push <file>.rk.md --open --json

# 3. Check status
renderkit status <file>.rk.md --json

# 4. Pull human feedback
renderkit feedback <file>.rk.md --json
```

## Feedback revision loop

1. Run `renderkit feedback <file>.rk.md --json`.
2. For each open comment, use the `sourceRange` and `sourceExcerpt` to locate the relevant block in the `.rk.md` file.
3. Edit the `.rk.md` source to address the feedback.
4. Re-run `renderkit validate` to ensure no errors.
5. Run `renderkit push <file>.rk.md --json` to create a new revision.
6. Optionally pass `--resolve cmt_id1,cmt_id2` to mark comments as resolved.

## Theme guide

| Theme | When to use |
|-------|------------|
| `dark-pro` | Default. Engineering plans, decision briefs, technical docs. |
| `paper-light` | Long-form reports, proposals that may be screenshotted. |
| `amber-terminal` | For users with amber/yellow terminal aesthetic. Avoids black-on-black readability issues. |

## Surface guide

| Surface | Recommended blocks |
|---------|-------------------|
| `engineering-plan` | summary, callout, decision-card, code, diagram |
| `decision-brief` | summary, decision-card, callout |
| `review-report` | summary, callout, code |
| `runbook` | summary, code, callout, diagram |
| `data-report-lite` | summary, code |

## Error codes

| Code | Fix |
|------|-----|
| `RK_UNKNOWN_BLOCK_TYPE` | Use a known block type: callout, decision-card, diagram, code, summary |
| `RK_BLOCK_ID_REQUIRED` | Add `id="..."` attribute to the directive |
| `RK_BLOCK_ID_INVALID` | Use only `[a-zA-Z0-9_-]+` characters in the id |
| `RK_DUPLICATE_BLOCK_ID` | Each block id must be unique |
| `RK_FRONTMATTER_INVALID` | Fix YAML syntax in frontmatter |
| `RK_DECISION_YAML_INVALID` | Fix YAML syntax in decision-card body |
| `RK_PROP_REQUIRED` | Add required fields (e.g. question, chosen for decision-card) |
| `RK_DIAGRAM_CODE_REQUIRED` | Add a fenced code block inside diagram |
| `RK_UNSUPPORTED_DIAGRAM_ENGINE` | Use engine="mermaid" |
| `RK_CODE_BODY_REQUIRED` | Add a fenced code block inside code directive |
