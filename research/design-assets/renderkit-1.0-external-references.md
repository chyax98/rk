# Research: External References for RenderKit 1.0

**Scope:** Agent-generated high-density technical docs & data apps. Five reference systems evaluated for patterns, anti-patterns, and implications.

---

## Summary

Five mature systems provide concrete patterns for RenderKit 1.0: Observable Framework's file-based data loader architecture, Material Design 3's canonical layouts and pane model, Ant Design Pro's ProLayout/PageContainer nesting, Tailwind UI's application shells, and Confluence's inline annotation lifecycle. The W3C Web Annotation standard provides an open model for comments/annotations that surpasses Confluence's proprietary approach. Key takeaway: RenderKit should adopt Observable's build-time data pipeline, M3's canonical layout taxonomy (list-detail, supporting pane), Ant Design's layout→page→content nesting, and W3C Web Annotation selectors for comments — while avoiding the known anti-patterns of each.

---

## 1. Observable Framework — Data App Generation

### Patterns to Borrow

1. **Double-extension file routing for data loaders.** File named `data.csv.js` auto-generates `data.csv` at build time. Resolution order: `.js → .ts → .py → .sh`. This is elegant: zero config, polyglot, unix-pipe model. [Observable Data Loaders Docs](https://observablehq.observablehq.cloud/framework/data-loaders)

2. **Build-time precomputation → static output.** Data loaders run at build only, not request time. Result: instant page loads, no server dependency. For agent-generated docs, this means generate once → serve fast. [HN Launch Thread](https://news.ycombinator.com/item?id=39383386)

3. **Markdown + fenced code blocks as authoring format.** Pages are `.md` files with ````js` code blocks. Reactive expressions. `FileAttachment()` bridges data loaders to page content. Simple enough for agent output.

4. **Scheduled rebuilds for data freshness.** Cron-triggered rebuilds re-run data loaders. Keeps static output current without live server.

### Anti-Patterns / Limitations

1. **No user-specific data (static = same for everyone).** Can't do row-level security or per-user views. Agent-generated docs likely have the same constraint — but should plan for parameterized builds if needed.

2. **JS-only front-end.** Data loaders can be Python/Rust, but visualization code must be JS. Limits audience.

3. **No built-in UI components (tables, forms).** Observable Plot handles charts but no data tables, filters, or form controls. "Data tables are high on the list" but still missing. RenderKit should provide these.

4. **Embedding friction.** No clean way to embed Framework pages into other sites. iframe or subdomain only. RenderKit should be embeddable.

### Implications for RenderKit 1.0

- **Adopt file-based data pipeline** (double-extension convention or equivalent). Agent generates data loader + markdown page → build produces static output.
- **Provide built-in UI components** that Observable lacks: data tables, filter controls, stat cards.
- **Design for embeddability** from day one: web components or iframe-safe rendering.
- **Build-time architecture is right** for agent-generated docs. Don't add server dependency.

---

## 2. Material Design 3 — Layout & Data Visualization

### Patterns to Borrow

1. **Three canonical layouts cover 90% of cases.**
   - **List-Detail:** Two-pane, parent-child. List on left, detail on right. Compact: stack vertically.
   - **Supporting Pane:** Primary content + secondary panel (NOT parent-child). Key use: document editing + commenting. Fixed 360dp width at expanded.
   - **Feed:** Scrolling content stream. Single column → multi-column.
   
   [M3 Canonical Layouts](https://m3.material.io/foundations/layout/canonical-layouts/list-detail)

2. **5 window size classes** for responsive breakpoints: compact (<600dp), medium (600-839dp), expanded (840-1199dp), large (1200-1599dp), extra-large (1600dp+). Not arbitrary breakpoints — tested across real devices. [M3 Layout Overview](https://m3.material.io/foundations/layout/understanding-layout/overview)

3. **Pane taxonomy:** Fixed, Flexible, Floating, Semi-permanent. Drag handle for resizing. Clear mental model for composability.

4. **Supporting Pane for doc + comments pattern.** At expanded width: document in primary pane, comments/annotations in 360dp supporting pane. This is exactly the pattern RenderKit needs for technical docs with inline comments. [M3 Supporting Pane](https://m3.material.io/foundations/layout/canonical-layouts/supporting-pane)

### Anti-Patterns from Data Viz Guidelines

1. **Single hue with varying lightness** for sequential data. Not rainbow palettes. [M2 Data Visualization](https://m2.material.io/design/communication/data-visualization.html)
2. **Avoid red/green** for diverging data — colorblind unfriendly. Use blue/orange or other accessible pairs.

### Implications for RenderKit 1.0

- **Implement the 3 canonical layouts** as base templates: list-detail (data browsing), supporting pane (doc + comments), feed (log/activity stream).
- **Use M3's window size classes** for responsive breakpoints — well-tested taxonomy.
- **Supporting pane = doc + annotations pattern.** 360dp fixed-width comment panel at expanded width. Bottom sheet on compact.

---

## 3. Ant Design Pro — Layout & PageContainer

### Patterns to Borrow

1. **ProLayout → PageContainer → Content nesting.** Three-layer structure:
   - `ProLayout`: App shell (sidebar, header, breadcrumb, footer)
   - `PageContainer`: Per-page wrapper (title, breadcrumb, action buttons, tabs)
   - Content: Actual page body
   
   This nesting is the standard "admin dashboard" pattern used across thousands of production apps. [ProLayout Docs](https://procomponents.ant.design/en-US/components/layout/), [PageContainer Docs](https://procomponents.ant.design/en-US/components/page-container/)

2. **`RouteContext` exposes `isMobile` + `collapsed`** so child components adapt. Single source of truth for responsive state.

3. **Three navigation modes:** `side` (sidebar), `top` (top nav), `mix` (hybrid). Agent can select mode based on content type.

4. **Responsive sidebar collapse:** Default breakpoint `lg` (992px). Below that: auto-collapse to icon-only. Mobile: drawer overlay. Clean progressive disclosure. [ProLayout API](https://github.com/ant-design/ant-design-pro-layout/blob/master/docs/api.md)

### Anti-Patterns / Performance Issues

1. **ProTable + large data = laggy.** Virtual scroll (`virtual` prop) helps but has bugs with merged cells, expandable rows, and column pinning. [GitHub Issue #50343](https://github.com/ant-design/ant-design/issues/50343), [GitHub Issue #7540](https://github.com/ant-design/pro-components/issues/7540)
2. **EditableProTable + large data = very laggy.** Inline editing + virtualization don't compose well.
3. **ProTable adds overhead** on top of base Table (toolbar, search form, column config). For high-density data, consider lighter table primitives.

### Implications for RenderKit 1.0

- **Adopt 3-layer nesting:** App shell → Page wrapper → Content. Agent generates content layer; shell/wrapper are framework-provided.
- **Don't use Ant Design Pro's table implementation directly** for large datasets. Use lighter virtual scrolling (`@tanstack/react-virtual`) if RenderKit renders data tables.
- **`isMobile` context pattern** is worth borrowing — single responsive state propagated to all children.

---

## 4. Tailwind UI — Application Shells

### Patterns to Borrow

1. **Three shell categories:** Stacked (top nav), Sidebar (persistent side nav), Multi-Column. Same classification as M3's canonical layouts but expressed in utility-first CSS. [Tailwind UI App Shells](https://tailwindcss.com/plus/ui-blocks/application-ui/application-shells/stacked)

2. **Component taxonomy for data apps:** Stats (KPI cards), Tables (data tables with sorting/pagination), Description Lists (key-value), Feeds (activity streams), Grid Lists (card grids), Command Palettes (quick search). Covers the common building blocks.

3. **CSS is not the performance bottleneck.** Tailwind purges unused utilities → <10KB gzipped. Real issues: JS and DOM size. [Tailwind Production Optimization](https://tailwindcss.com/docs/optimizing-for-production)

### Performance Practices for Data-Dense Pages

1. **Virtual scrolling** for long lists/tables (`@tanstack/react-virtual`, `react-window`). Reduces DOM nodes by ~90%.
2. **Lazy-load tab content** — only render active tab's DOM.
3. **`React.memo` / `useMemo`** for expensive table cells.
4. **`content-visibility: auto`** for off-screen sections — browser skips rendering until near viewport.
5. **Web Workers** for client-side data processing (filtering, sorting large datasets).

### Implications for RenderKit 1.0

- **Shell categories align with M3 canonical layouts** — use both taxonomies as validation that list-detail / sidebar / stacked are the right primitives.
- **Component inventory** (stats, tables, feeds, description lists) = RenderKit's initial component set.
- **Performance: plan for virtual scrolling from day 1.** Agent-generated data tables may contain thousands of rows.

---

## 5. Atlassian/Confluence & W3C Web Annotation — Inline Comments

### Confluence's Pattern

1. **Two comment types:** General (page-level) and Inline (text-selection-based). Inline comments highlight text → floating toolbar → comment → threaded reply → resolve/reopen lifecycle. [Confluence Comment Docs](https://support.atlassian.com/confluence-cloud/docs/comment-on-pages-and-blog-posts/)

2. **Annotation model (proprietary):**
   - `inlineMarkerRef`: UUID anchoring comment to text position
   - `inlineOriginalSelection`: Original highlighted text
   - `resolutionStatus`: `open` → `resolved` → can be `reopened`
   - Versioned comments with author/timestamp tracking
   - Rich content (ADF format: bold, lists, @mentions, images)
   
   [Confluence REST API v2](https://developer.atlassian.com/cloud/confluence/rest/v2/api-group-comment/)

3. **Comments panel:** Unified view of all inline + general comments, filterable (unread, resolved, open), sortable. Key UX: minimal disruption to reading flow, yellow highlight as persistent marker.

### W3C Web Annotation Standard (Superior Model)

Full W3C Recommendation since Feb 2017. Open, cross-platform, more robust than Confluence's proprietary model. [W3C Annotation Model](https://www.w3.org/TR/annotation-model/)

**Core model:**
```
Annotation → Body (comment content) → Target (what's annotated) + Selector (where exactly)
```

**Selector types (key for inline comments):**

| Selector | How it works | Robustness |
|----------|-------------|------------|
| `TextQuoteSelector` | `exact` text + `prefix`/`suffix` context | **Most robust** — survives edits if surrounding context preserved |
| `TextPositionSelector` | Character offsets (`start`, `end`) | Precise but fragile — breaks on any edit before selection |
| `RangeSelector` | Start selector + End selector (XPath/CSS) | Good for complex DOM ranges |
| `FragmentSelector` | Media fragment IDs (`#xywh=...` for images) | Images, video, SVG |
| `SvgSelector` | SVG shape overlay | Arbitrary regions |

**Example (TextQuoteSelector):**
```json
{
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "type": "Annotation",
  "motivation": "commenting",
  "body": {
    "type": "TextualBody",
    "value": "This paragraph needs a citation.",
    "format": "text/html"
  },
  "target": {
    "source": "http://example.com/page1",
    "selector": {
      "type": "TextQuoteSelector",
      "exact": "the sky is blue",
      "prefix": "Scientists confirm that ",
      "suffix": " on clear days."
    }
  }
}
```

**Motivation vocabulary:** `commenting`, `replying`, `bookmarking`, `highlighting`, `editing`, `questioning`, `assessing`. Useful for distinguishing annotation types.

**REST Protocol:** Standard CRUD (`POST/GET/PUT/DELETE /annotations`) + search by target. [W3C Annotation Protocol](https://www.w3.org/TR/annotation-protocol/)

### Anti-Patterns

1. **Confluence's position-based anchoring is fragile.** `inlineMarkerRef` + `inlineOriginalSelection` without prefix/suffix context means comments drift or break on edits. W3C's `TextQuoteSelector` with surrounding context is more robust.

2. **Proprietary annotation formats create lock-in.** Confluence comments can't be exported to other tools. W3C standard is interoperable.

### Implications for RenderKit 1.0

- **Use W3C Web Annotation model** (not Confluence's proprietary one) for inline comments. `TextQuoteSelector` with prefix/suffix for robustness against document edits.
- **Implement resolve/reopen lifecycle** from Confluence — proven UX pattern for technical doc review.
- **Supporting pane layout** (from M3) for comment display: comments in 360dp side panel alongside doc content.
- **Motivation vocabulary** enables typed annotations: comment, highlight, question, edit suggestion. Agent-generated docs can use these for review workflows.

---

## Cross-Cutting Patterns

### Validated by Multiple Sources

1. **Three canonical layouts are universal:** List-detail, sidebar + content, stacked (top nav). M3, Tailwind UI, Ant Design Pro all converge on these. RenderKit should implement exactly these three.

2. **Build-time > request-time for static content.** Observable Framework's architecture proves this for data apps. Agent-generated docs are inherently static (generated once, viewed many times). Don't add server dependency.

3. **Virtual scrolling is mandatory** for data-dense views. Ant Design Pro's performance issues prove the need. Design table components for virtualization from day one.

4. **App shell → Page → Content nesting** is the standard composable layout pattern. Ant Design Pro's ProLayout/PageContainer, Tailwind UI's shells, M3's pane composition all use this pattern.

5. **Responsive breakpoints follow M3's size classes** (compact/medium/expanded/large/xl). These are well-tested across real devices. Don't invent custom breakpoints.

### Architecture Implications for RenderKit 1.0

| Concern | Recommended Pattern | Source |
|---------|-------------------|--------|
| Data pipeline | Build-time, file-based (double-extension convention) | Observable Framework |
| Layout primitives | 3 canonical layouts + pane taxonomy | Material Design 3 |
| Layout nesting | App shell → Page wrapper → Content | Ant Design Pro |
| Component set | Stats, tables, feeds, description lists | Tailwind UI |
| Data table rendering | Virtual scrolling from day one | Ant Design Pro (lessons from failures) |
| Responsive design | M3 window size classes | Material Design 3 |
| Inline comments | W3C Web Annotation (TextQuoteSelector) + resolve/reopen | W3C Standard + Confluence UX |
| Comment display | Supporting pane (360dp) at expanded, bottom sheet at compact | Material Design 3 |
| CSS framework | Utility-first, purged in production | Tailwind |
| Authoring format | Markdown + code blocks | Observable Framework |

---

## Sources

### Kept (Primary / High-Value)
- [Observable Framework Data Loaders](https://observablehq.observablehq.cloud/framework/data-loaders) — file-based data pipeline architecture
- [Observable HN Launch Thread](https://news.ycombinator.com/item?id=39383386) — limitations, community feedback, Bostock's own answers
- [M3 Canonical Layouts](https://m3.material.io/foundations/layout/canonical-layouts/list-detail) — 3 canonical layouts, pane specs
- [M3 Layout Overview](https://m3.material.io/foundations/layout/understanding-layout/overview) — window size classes, pane taxonomy
- [M2 Data Visualization](https://m2.material.io/design/communication/data-visualization.html) — color, chart type guidelines
- [Ant Design ProLayout API](https://procomponents.ant.design/en-US/components/layout/) — responsive props, collapse behavior
- [Ant Design PageContainer](https://procomponents.ant.design/en-US/components/page-container/) — page wrapper pattern
- [Ant Design Virtual Table Issues](https://github.com/ant-design/ant-design/issues/50343) — performance pitfalls of virtual scroll
- [Tailwind UI Application Shells](https://tailwindcss.com/plus/ui-blocks/application-ui/application-shells/stacked) — shell layout patterns
- [Tailwind Production Optimization](https://tailwindcss.com/docs/optimizing-for-production) — CSS purging, build perf
- [W3C Web Annotation Model](https://www.w3.org/TR/annotation-model/) — open annotation standard, selector types
- [W3C Annotation Protocol](https://www.w3.org/TR/annotation-protocol/) — REST API for annotations
- [Confluence REST API v2](https://developer.atlassian.com/cloud/confluence/rest/v2/api-group-comment/) — inline comment data model
- [Confluence Comment Docs](https://support.atlassian.com/confluence-cloud/docs/comment-on-pages-and-blog-posts/) — comment UX patterns

### Dropped
- Generic dashboard design blog posts (Medium, Domo, FusionCharts) — rehashed common advice, not primary sources
- Observable Cloud deprecation notice — tangential to architecture decisions
- Tailwind CSS v4 preview — not yet stable, current v3 JIT is sufficient

---

## Gaps

1. **Agent-specific generation patterns.** No mature reference for "LLM generates layout + components → framework renders." Observable is closest (markdown → app) but designed for human authoring. Need to validate that agent output can reliably target the component/layout model.

2. **Multi-document navigation.** None of the references deeply address cross-document navigation in generated doc sets. Confluence has space/page hierarchy but is wiki-model. Observable is single-page-focused.

3. **Print/export for generated docs.** None of the references address PDF or static export well. Agent-generated technical docs likely need this.

4. **Versioning/diff of generated content.** When agent regenerates a doc, how to diff against previous version? Git-based? No reference addresses this.

5. **Accessibility testing in generated contexts.** M3 has accessibility guidelines but no reference addresses "agent-generated UI must pass a11y checks automatically."

### Suggested Next Steps

- Prototype agent → Observable Framework markdown generation to validate file-based pipeline
- Test W3C Web Annotation `TextQuoteSelector` robustness against document edits in a real implementation
- Evaluate `@tanstack/react-virtual` vs `react-window` for RenderKit's table component
- Define RenderKit's component inventory (aligned with Tailwind UI taxonomy) and validate agent can reliably target it
