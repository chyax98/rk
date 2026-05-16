# RenderKit 1.0 Product Pass 2 — Technical Presentation

Status: implemented and verified  
Date: 2026-05-17

## Objective

Continue increasing product quality for Agent-authored technical artifacts. This pass focuses on two high-value presentation gaps:

1. Technical documents need mature code presentation, not plain `<pre>` blocks.
2. Agents need simple chart authoring without writing large raw ECharts option JSON.

This directly supports the product goal: beautiful, high-density solution documents that are easier to read than raw Markdown/Notion-style blocks, with a building-block DSL suitable for AI Agents.

## Implemented changes

### 1. Mature code presentation with `highlight.js`

Files:

```text
packages/blocks/package.json
pnpm-lock.yaml
packages/blocks/src/CodeBlock.jsx
packages/design/src/blocks.css
```

Changes:

- Added mature syntax highlighter dependency: `highlight.js`.
- `CodeBlock` now highlights code via `highlight.js/lib/common`.
- Added a code copy affordance in the code header.
- Added RenderKit theme-compatible CSS for common highlight classes:
  - keywords
  - strings/types/names
  - comments/meta
  - numbers/variables
- Added dark-theme compatible highlight colors.

Why this matters:

- Technical docs are code-heavy.
- Plain monochrome code reads like raw Markdown output.
- Syntax highlighting makes generated plans, runbooks, patches, and configs much easier to scan.

### 2. ECharts shorthand engines

Files:

```text
packages/dsl/src/index.mjs
packages/blocks/src/DiagramBlock.jsx
packages/blocks/src/EChartsBlock.jsx
skills/renderkit-authoring/SKILL.md
examples/capabilities/product-system.rk.md
scripts/verify.mjs
```

Added supported engines:

```text
echarts-bar
echarts-line
echarts-pie
```

Before this pass, `echarts` required raw option JSON. That is powerful but high-friction for Agents.

New shorthand example:

```md
:::fig{id="latency-trend" engine="echarts-line" caption="RND latency trend" width="wide"}
window,p50,p95
09:00,82,138
10:00,79,142
11:00,77,136
12:00,80,144
13:00,76,132
:::
```

Implementation behavior:

- `echarts` still accepts raw JSON option.
- `echarts-line`, `echarts-bar`, `echarts-pie` accept CSV/tab/pipe-like data.
- `EChartsBlock` converts simple data into an ECharts option at render time.
- Charts use SVG renderer.
- Chart resizes on browser resize.

Why this matters:

- Agents can now author common charts from simple tables.
- Humans get visual trend/comparison/part-to-whole charts without hand-written chart config.
- This moves RenderKit closer to Observable-like data-app affordances while keeping `.rk.md` simple.

### 3. Product demo updated

File:

```text
examples/capabilities/product-system.rk.md
```

Added:

- `latency-trend` using `engine="echarts-line"`.
- Existing code block now renders with syntax-highlight-capable renderer and copy affordance.

## Verification

### Deterministic verifier

```bash
pnpm verify
```

Result:

```text
Results: 163 passed, 0 failed
ALL GOOD
```

New coverage:

- Product system chart shorthand supports `echarts-line`.
- Product system chart shorthand has CSV-like data.

### Smoke verifier

```bash
pnpm verify:smoke
```

Result:

```text
Results: 18 passed, 0 failed
ALL GOOD
```

### Browser evidence

Commands used:

```bash
node packages/cli/bin/renderkit.mjs push examples/capabilities/product-system.rk.md --json
pw session recreate renderkit-review --open 'http://localhost:3737/a/art_2c68c48f39?rev=2'
pw errors -s renderkit-review
pw press -s renderkit-review PageDown
pw screenshot -s renderkit-review --path .pw-evidence/product-system-pass2-chart-code.png
pw press -s renderkit-review PageDown
pw screenshot -s renderkit-review --path .pw-evidence/product-system-pass2-code.png
```

Evidence files:

```text
.pw-evidence/product-system-pass2-chart-code.png
.pw-evidence/product-system-pass2-code.png
```

Observed:

- Browser errors: `0` visible errors.
- `echarts-line` shorthand rendered as a line chart.
- Code block rendered with header and copy affordance.
- Browser selectors confirmed:
  - `.rk-echarts svg` count = `1`
  - `.rk-block-code .hljs` count = `1`
  - `.rk-code-copy` count = `1`

## Remaining gaps after pass 2

Important gaps still open:

1. True Feishu/Notion-like inline comments with text-range anchors.
2. Persistent supporting-pane comment rail on large screens.
3. More chart presets: stacked bar, area, timeline, waterfall, sankey.
4. Image/media block and high-quality figure layout.
5. Tab block for multi-view technical content.
6. More mature Apple/Notion/blog-inspired token and typography pass.
7. Automated browser assertions for chart SVG existence and code highlight spans.

## Conclusion

Pass 2 improves the core technical-document experience: code is now highlighted with a mature library, and Agents can author charts with simple CSV-like data. This is an incremental product-quality pass, not completion of the full RenderKit 1.0 objective.
