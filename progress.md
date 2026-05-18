# Progress

## Status
In Progress

## Tasks

### Done
- [x] 13 new WC components (rk-card, rk-section, rk-diff, rk-infographic, rk-map, rk-plot, rk-datagrid, rk-narrative, rk-sketch, rk-zdog, rk-model, rk-globe, rk-chart extensions)
- [x] D2 SSR via local binary (`spawn d2 - -`) in html-processor
- [x] Mermaid SSR via Kroki in html-processor
- [x] PlantUML/Graphviz SSR via Kroki (pre-existing)
- [x] D2 WC: remove broken WASM, friendly error message
- [x] render-error feedback loop: WC CustomEvent → HtmlArtifactView → POST API → SQLite → rk feedback
- [x] rk doctor: d2 installation check
- [x] Build: 130KB, 75/75 tests, 40 WCs
- [x] rk-plot3d (Plotly.js 3D): surface, scatter3d, mesh3d, cone, streamtube
- [x] rk-graph3d (3d-force-graph): 3D force-directed network graph with DAG layout
- [x] Build: 149.3KB, 75/75 tests, 42 WCs

- [x] rk-graph (Cytoscape.js): 2D network/knowledge graph, group coloring, layout options (cose/circle/grid/breadthfirst/concentric)
- [x] rk-flow (@antv/x6): flow/DAG diagram, auto-layout, rounded rects, edge labels, pan/zoom
- [x] Build: 140.5KB, 75/75 tests, 44 WCs

### In Progress
- [ ] Design system: theme.css unification, surface tokens for new WCs
- [ ] ECharts SSR (Node.js + jsdom)

## Files Changed
See git log for full history.

## Notes
- All visualization libraries loaded via CDN (zero bundle impact except component code)
- SSR engines: d2=local binary, mermaid/plantuml/graphviz=Kroki HTTP
- Mermaid SSR is best-effort with graceful client-side fallback
- rk-plot3d: Plotly.js handles both 3D (scatter3d, surface, mesh3d, cone, streamtube) and 2D types
- rk-graph3d: dark background (#0f0f23), group-based accent palette, optional DAG mode
