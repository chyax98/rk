# RenderKit 1.0 Product Pass 8 — SQLite Hardening and Diagram Visual Language

Status: implemented and verified  
Date: 2026-05-17

## Objective

Continue the product-quality flywheel after Pass 7 by integrating two parallel worker outputs:

1. **SQLite hardening** — make the new local DB store verifiably safe for artifacts, revisions, nested-block comments, selector metadata, resolve/reopen lifecycle, orphaning, and cleanup.
2. **Diagram visual language** — turn the cloned `fireworks-tech-graph` and `thesvg` research into a concrete RenderKit diagram authoring convention and a capability fixture.

This pass intentionally focuses on durable verification and authoring assets. It does not add dashboard chrome and does not move UI away from reading-first behavior.

## Implemented changes

### 1. SQLite hardening verifier

New script:

```text
scripts/verify-sqlite.mjs
```

New command:

```bash
pnpm verify:sqlite
```

Coverage:

| Area | Coverage |
|---|---|
| Multiple artifacts | independent artifact creation and listing |
| Multiple revisions | revision numbers, source hashes, diff tracking, revision lookup |
| Comments with selectors | `TextQuoteSelector`, plain comments, artifact isolation, missing block 404 |
| Resolve / reopen | human resolve, reopen cleanup, invalid status rejection |
| Nested blocks | comments on grid children and tab children |
| Orphaning | block removal marks comments `orphaned` and preserves snapshot |
| Agent auto-resolve | `addRevision(..., resolvedCommentIds)` records `resolvedBy=agent` |
| Edge cases | missing artifact/revision, selector normalization/truncation |
| Cleanup | test artifacts are removed from the real SQLite DB |

Bug fixed while hardening:

```text
apps/web/lib/store.mjs
```

`flattenBlocks()` and `findBlockById()` now traverse both:

```text
block.props.children
block.props.tabs[].blocks
```

Why it matters:

- Before this fix, comments on blocks inside tabs could fail with `block not found`.
- Agent feedback could miss tab-inner blocks.
- Nested comment neighbor context was incomplete.

### 2. Diagram visual-language spec

New doc:

```text
docs/renderkit-diagram-visual-language.md
```

The spec is derived from the local cloned design resources:

```text
research/design-assets/external-repos/fireworks-tech-graph
research/design-assets/external-repos/thesvg
```

It defines:

- semantic shape vocabulary: User, LLM, Agent, Memory, Tool, API, Queue, File, Decision, Process, External Service, Data/Artifact;
- semantic arrow vocabulary: primary data, control, memory read/write, async, transform, feedback, error/fallback;
- theme-aligned diagram style presets for `paper-light`, `dark-pro`, `amber-terminal`, and `editorial-kami`;
- layout rules for spacing, routing, label placement, and viewBox defaults;
- engine selection guidance for Mermaid/SVG/D2/PlantUML/ECharts;
- licensing cautions for `thesvg` brand/cloud icons.

Design decision:

> This is a convention layer, not a new runtime engine. Agents can apply it inside existing RenderKit `diagram` blocks.

### 3. Diagram capability fixture

New fixture:

```text
examples/capabilities/diagram-visual-language.rk.md
```

Verifier registry updated:

```text
scripts/verify-fixtures.json
```

The fixture includes:

- one inline SVG diagram using the shape/arrow vocabulary;
- one Mermaid diagram using styled classes;
- a callout explaining which conventions are exercised.

## Verification

### Full verifier

```bash
pnpm verify
```

Result:

```text
Results: 212 passed, 0 failed
ALL GOOD
```

### SQLite hardening verifier

```bash
pnpm verify:sqlite
```

Result:

```text
Results: 102 passed, 0 failed
ALL GOOD
```

### Smoke verifier

```bash
pnpm verify:smoke
```

Result:

```text
Results: 24 passed, 0 failed
ALL GOOD
```

### Browser verification with `pw`

Artifact pushed:

```text
artifactId: art_c31961857e
url: http://localhost:3737/a/art_c31961857e
```

Commands used included:

```bash
pw session create rk-diag-vocab --open http://localhost:3737/a/art_c31961857e
pw errors -s rk-diag-vocab
pw get -s rk-diag-vocab --selector '.rk-block-diagram' --fact count
pw get -s rk-diag-vocab --selector 'svg' --fact count
pw read-text -s rk-diag-vocab --selector main --max-chars 1200
pw screenshot -s rk-diag-vocab --path .pw-evidence/diagram-visual-language-flywheel.png
```

Observed:

```text
pw errors = 0 visible errors
.rk-block-diagram count = 2
svg count = 3
main text includes Agent Reasoning Loop and RenderKit pipeline
```

Evidence:

```text
.pw-evidence/diagram-visual-language-flywheel.png
```

## Remaining gaps

This pass does not complete the full product goal. Remaining work:

1. Integrate md2html-inspired reading/print/a11y CSS changes from worker A.
2. Integrate comment filters/side markers/selector re-anchoring from worker B.
3. Add automated Playwright specs, not only `pw` command evidence.
4. Add TypeScript contracts late in the 1.0 stabilization phase.
5. Consider a future structured `tech-graph` diagram engine if the convention layer proves insufficient.
