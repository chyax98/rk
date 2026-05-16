# RenderKit 1.0 Product Pass 5 — Rich Media and Tabbed Content

Status: implemented and verified  
Date: 2026-05-17

## Objective

Continue improving RenderKit as a mature Agent-authored technical artifact system by adding richer blog/document composition primitives. Prior passes improved layout, tables, code, charts, and comments. Pass 5 adds:

1. `image` blocks for screenshots, generated SVGs, architecture snapshots, and blog-style hero figures.
2. `tabs` blocks for dense multi-view technical content.
3. Authoring guidance and verifier coverage for both blocks.

These blocks move RenderKit closer to the product goal: AI Agents can compose beautiful, information-dense documents from reliable building blocks instead of emitting raw Markdown.

## Implemented changes

### 1. Image block

Files:

```text
packages/dsl/src/index.mjs
packages/blocks/src/ImageBlock.jsx
packages/blocks/src/registry.jsx
packages/blocks/src/index.jsx
packages/design/src/blocks.css
```

DSL:

```md
:::image{id="architecture" src="./architecture.png" alt="System architecture" title="Architecture" aspect="16:9" width="wide"}
Optional caption text.
:::
```

Supported attributes:

| Attribute | Purpose |
|---|---|
| `src` | Required image source: local path, URL, data URI |
| `alt` | Accessible alt text |
| `title` | Figure title |
| `caption` | Figure caption |
| `aspect` | `16:9`, `4:3`, `1:1` |
| `width` | RenderKit width hint |

Validation:

- Missing `src` produces `RK_IMAGE_SRC_REQUIRED`.

Renderer behavior:

- Lazy-loaded `<img>`.
- Styled figure frame.
- Optional title and caption.
- Aspect-ratio support for common document figure shapes.

### 2. Tabs block

Files:

```text
packages/dsl/src/index.mjs
packages/blocks/src/TabsBlock.jsx
packages/blocks/src/registry.jsx
packages/blocks/src/index.jsx
packages/design/src/blocks.css
```

DSL:

````md
:::::tabs{id="delivery-tabs" title="Delivery views" width="wide"}
::::tab{id="reader" label="Reader view"}
:::note{id="reader-note" title="Reader-first"}
Default view should read like a finished document.
:::
::::

::::tab{id="reviewer" label="Reviewer view"}
:::src{id="feedback-command" language="bash" title="Feedback"}
```bash
renderkit feedback plan.rk.md --json
```
:::
::::
:::::
````

Renderer behavior:

- Accessible `role="tablist"`, `role="tab"`, `role="tabpanel"` structure.
- Active tab state inside the block.
- Nested RenderKit blocks render through the existing registry.
- Useful for Reader/Reviewer views, before/after, platform-specific instructions, and option comparisons.

Validation:

- `tabs` requires at least one `tab` child: `RK_TABS_CHILD_REQUIRED`.
- Non-`tab` children under `tabs` produce `RK_TABS_CHILD_UNSUPPORTED`.
- Unsupported nested blocks inside `tab` produce `RK_TABS_BLOCK_UNSUPPORTED`.

### 3. Capability example

New file:

```text
examples/capabilities/rich-media-tabs.rk.md
```

Covers:

- `image` with an embedded SVG data URI.
- `tabs` with two tabs.
- Nested `note`, `table`, `warn`, and `src` blocks inside tabs.
- Blog/document-style rich media layout.

### 4. Authoring skill updated

File:

```text
skills/renderkit-authoring/SKILL.md
```

Added:

- `image` block guidance.
- `tabs` block guidance.
- Updated surface recommendations.
- New error code guidance.

## Verification

### Deterministic verifier

```bash
pnpm verify
```

Result:

```text
Results: 173 passed, 0 failed
ALL GOOD
```

New verifier coverage:

- `examples/capabilities/rich-media-tabs.rk.md` validates.
- Case has an image block.
- Case has a tabs block.
- Tabs block has two tabs.
- Tabs contain nested blocks.

### Smoke verifier

```bash
pnpm verify:smoke
```

Result:

```text
Results: 24 passed, 0 failed
ALL GOOD
```

### Browser verification

Commands used:

```bash
node packages/cli/bin/renderkit.mjs push examples/capabilities/rich-media-tabs.rk.md --json
pw session recreate renderkit-review --open 'http://localhost:3737/a/art_c66ee5f8ed'
pw errors -s renderkit-review
pw get -s renderkit-review --selector '.rk-image-block img' --fact count
pw get -s renderkit-review --selector '.rk-tabs-list button' --fact count
pw screenshot -s renderkit-review --path .pw-evidence/rich-media-tabs-pass5.png
pw click -s renderkit-review --text 'Reviewer view'
pw screenshot -s renderkit-review --path .pw-evidence/rich-media-tabs-pass5-reviewer-tab.png
```

Evidence files:

```text
.pw-evidence/rich-media-tabs-pass5.png
.pw-evidence/rich-media-tabs-pass5-reviewer-tab.png
```

Observed:

- Browser errors: `0` visible errors.
- `.rk-image-block img` count = `1`.
- `.rk-tabs-list button` count = `2`.
- Clicking `Reviewer view` switches tab content.

## Remaining gaps after pass 5

Important product gaps still remain:

1. Better local image asset serving/copying from `.rk.md` project directories.
2. Image zoom/lightbox interaction.
3. More tab keyboard handling: arrow keys, Home/End.
4. Deeper typography/token polish inspired by Apple/Notion/blog systems.
5. More blocks: quote, timeline, checklist, stat cards, comparison cards.
6. Automated Playwright spec files rather than only command evidence.

## Conclusion

Pass 5 adds two major composition primitives: rich media and tabs. This makes RenderKit documents more like mature technical/blog artifacts and less like decorated Markdown. The system still is not complete 1.0, but the authoring block set is materially stronger.
