# RenderKit Diagram Visual Language

Status: Prototype spec — docs only, no runtime changes  
Date: 2026-05-17  
Sources: `fireworks-tech-graph` (MIT), `thesvg` (MIT)  
Audience: Agents authoring `.rk.md` artifacts with diagram blocks

---

## 1. Purpose

RenderKit already supports Mermaid, SVG, PlantUML, D2, ECharts, and infographic blocks via the `:::diagram` directive. This document defines a **semantic visual vocabulary** so that any agent (or human) can produce consistent, high-quality diagrams without ad-hoc aesthetic decisions.

The vocabulary covers three concerns:

1. **Shape semantics** — what shape means what concept.
2. **Arrow semantics** — what color, dash, and weight mean what flow.
3. **Style presets** — how diagrams align with RenderKit themes (`paper-light`, `dark-pro`, `amber-terminal`, `editorial-kami`).

This is a *convention layer*, not a new engine. Apply it inside any supported engine (Mermaid classes/styles, raw SVG, D2 styles, PlantUML skinparams).

---

## 2. Shape Vocabulary

| Concept | Shape | SVG Pattern | Mermaid Hint |
|---------|-------|-------------|--------------|
| User / Human | Rounded rect, thin border | `<rect rx="12">` with avatar circle | `A[User]` with `style A fill:#f0fdf4` |
| LLM / Model | Rounded rect, gradient or tinted fill | `<rect rx="8">` + accent bg | `A[LLM]` with `style A fill:#eff6ff` |
| Agent / Orchestrator | Hexagon or double-border rect | `<polygon points="...">` hex | `A{{Agent}}` |
| Memory (short-term) | Rounded rect, **dashed** border | `stroke-dasharray="6,3"` | `A[Working Memory]:::dashed` |
| Memory (long-term) | Cylinder (database) | SVG path ellipse + rect | `[(Vector DB)]` |
| Tool / Function | Rect with gear accent or small icon | `<rect rx="4">` + embedded icon | `A[Tool]` with `style A fill:#fff7ed` |
| API / Gateway | Hexagon (single border) | `<polygon>` | `A{{API}}` |
| Queue / Stream | Horizontal tube / pipe | `<rect rx="20">` wide & short | `A[Queue]` with `style A fill:#faf5ff` |
| File / Document | Folded-corner rect | SVG path with corner fold | `A[(Config File)]` |
| Decision | Diamond | `<polygon>` or `<path>` | `A{Decision?}` |
| Process / Step | Rounded rect, solid border | `<rect rx="8">` | `A[Step]` |
| External Service | Rect, **dashed** border, cloud icon | `stroke-dasharray="4,2"` + icon | `A[External]:::dashed` |
| Data / Artifact | Parallelogram | `<polygon>` slanted | `A[/Data/]` |

### Minimal SVG shape templates

```svg
<!-- Process node -->
<rect x="0" y="0" width="140" height="50" rx="8"
      fill="#ffffff" stroke="#d1d5db" stroke-width="1.5"/>
<text x="70" y="30" text-anchor="middle" font-size="13" fill="#111827">Process</text>

<!-- Agent (hexagon) -->
<polygon points="25,0 125,0 150,25 125,50 25,50 0,25"
         fill="#eff6ff" stroke="#2563eb" stroke-width="1.5"/>
<text x="75" y="30" text-anchor="middle" font-size="13" fill="#111827">Agent</text>

<!-- Long-term memory (cylinder) -->
<path d="M20,10 h100 a10,8 0 0,1 0,16 h-100 a10,8 0 0,1 0,-16
         v30 a10,8 0 0,0 100,0 v-30"
      fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
<text x="70" y="35" text-anchor="middle" font-size="12" fill="#111827">Store</text>
```

---

## 3. Arrow Semantics

Always assign meaning. Never use color or dash purely for decoration.

| Flow Type | Color | Weight | Dash | Use When |
|-----------|-------|--------|------|----------|
| Primary data / request | `#2563eb` (blue) | 2px solid | none | Main request→response path |
| Control / trigger | `#ea580c` (orange) | 1.5px solid | none | One system triggering another |
| Memory read | `#059669` (green) | 1.5px solid | none | Retrieval from store |
| Memory write | `#059669` (green) | 1.5px | `5,3` | Write/store operation |
| Async / event | `#6b7280` (gray) | 1.5px | `4,2` | Non-blocking, event-driven |
| Transform / embed | `#7c3aed` (purple) | 1px solid | none | Data transformation |
| Feedback / loop | `#7c3aed` (purple) | 1.5px curved | none | Iterative reasoning loop |
| Error / fallback | `#dc2626` (red) | 1.5px | `6,3` | Error path, circuit breaker |

### Arrow rules

1. **Every diagram with ≥2 arrow types must include a legend.**
2. Use orthogonal (L-shaped) routing over straight diagonals. Route around nodes, not through them.
3. Arrow labels get a background rect (`opacity="0.95"`, canvas bg color) to prevent text-on-line collisions.
4. Arrow endpoints attach to shape edges, not geometric centers.
5. Feedback loops use cubic bezier curves: `M x1,y1 C cx1,cy1 cx2,cy2 x2,y2`.

### SVG arrow marker template

```svg
<defs>
  <marker id="arrow-blue" markerWidth="10" markerHeight="7"
          refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 10 3.5, 0 7" fill="#2563eb"/>
  </marker>
</defs>
<line x1="100" y1="50" x2="250" y2="50"
      stroke="#2563eb" stroke-width="2"
      marker-end="url(#arrow-blue)"/>
```

---

## 4. Theme-Aligned Style Presets

Each RenderKit theme has a diagram style variant. Agents should pick the one matching the artifact's `theme` frontmatter.

### paper-light (default)

```
Background:  #ffffff
Box fill:    #ffffff
Box stroke:  #d1d5db
Box radius:  8px
Text:        #111827 primary, #6b7280 secondary
Font:        system-ui, sans-serif, 14px labels, 12px sub-labels
Arrows:      per semantic table above
Shadow:      none or subtle <feDropShadow dx="0" dy="1" stdDeviation="2"> on key nodes only
```

### dark-pro

```
Background:  #0f0f1a
Box fill:    #1e1e2e
Box stroke:  #4b5563
Box radius:  8px
Text:        #e5e7eb primary, #9ca3af secondary
Font:        system-ui, monospace fallback, 14px labels
Arrows:      brighter variants — #60a5fa (blue), #f97316 (orange), #34d399 (green)
Shadow:      none — rely on stroke contrast
```

### amber-terminal

```
Background:  #1a1400
Box fill:    #2a2000
Box stroke:  #a16207
Box radius:  4px
Text:        #fbbf24 primary, #a3842a secondary
Font:        monospace, 13px
Arrows:      #fbbf24 (primary), #ea580c (control), #a3e635 (memory)
Shadow:      none
```

### editorial-kami

```
Background:  #faf8f5
Box fill:    #ffffff
Box stroke:  #e5e0d8
Box radius:  10px
Text:        #2c2417 primary, #8b7e6a secondary
Font:        Georgia, serif, 14px labels
Arrows:      #7c3aed (primary — warm purple), #ea580c (control), #059669 (memory)
Accent:      restrained red #b91c1c for callout emphasis
Shadow:      none
```

---

## 5. Layout Rules

Adapted from fireworks-tech-graph layout best practices, simplified for RenderKit's diagram block viewport.

### Spacing

| Metric | Value |
|--------|-------|
| Same-layer horizontal gap | 80px |
| Layer vertical gap | 120px |
| Canvas margin | 40px minimum |
| Arrow label safety from nodes | 10px |
| Arrow label text max | 3 words |
| Snap grid | x: 120px, y: 80px |

### ViewBox defaults

| Layout | ViewBox |
|--------|---------|
| Standard | `0 0 960 600` |
| Tall stack | `0 0 960 800` |
| Wide flow | `0 0 1200 600` |

### Routing discipline

- Prefer L-shaped orthogonal paths.
- Anchor arrows on component edges, not centers.
- Parallel arrows stagger by 15–20px vertical offset.
- Unavoidable crossings use small semicircular jump-over arcs (radius 5px).
- Filtered elements (drop-shadow) must stay ≥30px from viewBox edges to avoid clipping.

---

## 6. Diagram Type Reference

Quick-reference for mapping intent to diagram type and shape usage.

| Intent | Diagram Type | Key Shapes | Typical Layout |
|--------|-------------|-----------|----------------|
| System architecture | Architecture | Process, Agent, External | Top-to-bottom layers |
| Data pipeline | Data Flow | Process, Queue, Store | Left-to-right |
| Agent reasoning loop | Architecture + loops | Agent, Tool, Memory | Cycle with feedback arrows |
| Memory system | Memory Architecture | Memory (short/long), Store | Read/write path split |
| Sequence of messages | Sequence | Vertical lifelines + horizontal arrows | Top-to-bottom time |
| Decision logic | Flowchart | Decision diamond + Process | Top-to-bottom |
| Comparison | Feature Matrix | Table grid | Grid |
| Class / API structure | Class / ER | Class boxes, relationship lines | Hierarchical |

---

## 7. Agent Authoring Guide

When writing a `:::diagram` block in `.rk.md`:

1. **Pick engine** based on content:
   - Simple flow / architecture → Mermaid
   - Pixel-perfect custom diagram → SVG
   - Structured data → ECharts
   - Complex text-based spec → D2 or PlantUML
2. **Apply shape vocabulary** — use the semantic shapes above.
3. **Apply arrow semantics** — color by flow meaning, include legend if ≥2 types.
4. **Match theme** — use the style preset matching the artifact's `theme` frontmatter.
5. **Validate** — for SVG, run `python3 -c "import xml.etree.ElementTree as ET; ET.parse('file.svg')"`.
6. **Keep labels short** — ≤3 words on arrows, ≤5 words in nodes. Move detail to sub-labels.

---

## 8. License & Attribution Cautions

### fireworks-tech-graph

- **License**: MIT (Copyright © 2025 fireworks-tech-graph contributors)
- **What we use**: Shape vocabulary, arrow semantics, layout rules, style tokens — *conceptual patterns only*. No code, SVG templates, or fixture files were copied.
- **Attribution**: Shape/arrow/layout tables in this document were originally designed by the fireworks-tech-graph project under MIT. RenderKit's adaptation is a derived conceptual work; if this doc is ever published publicly, include MIT attribution per the license.

### thesvg

- **License**: MIT (Copyright © 2025 thesvg.org)
- **What we use**: Icon availability reference only. RenderKit does not bundle thesvg icons. If SVG diagrams embed brand icons from thesvg, each icon retains its original license (most are MIT; cloud provider icons like AWS use CC BY-ND 2.0 — see below).
- **Cloud provider icons**: AWS Architecture icons distributed by thesvg are sourced from official AWS packages under **CC BY-ND 2.0**. These icons may be used with attribution but **may not be modified**. If RenderKit artifacts include AWS icons, they must remain unmodified with proper attribution.

### General guidance

- Do not bundle third-party SVG assets into RenderKit runtime.
- Diagrams in `.rk.md` artifacts are user/agent-authored content; license responsibility sits with the author.
- When referencing brand icons in SVG blocks, prefer simple labeled shapes over imported icon assets to avoid license friction.

---

## 9. Example: .rk.md Fixture

See `examples/capabilities/diagram-visual-language.rk.md` for a minimal artifact exercising the vocabulary.
