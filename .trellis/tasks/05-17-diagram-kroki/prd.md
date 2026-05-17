# Diagram Engine Expansion — Multi-engine Support

## Goal

扩展 `<rk-diagram>` 支持 Mermaid / D2 / Graphviz / PlantUML，优先客户端渲染，渲染不了再用 Kroki SSR 兜底。

## 当前状态

- `rk-diagram` 只支持 Mermaid，CDN 客户端渲染
- `@terrastruct/d2` 已在 apps/web 依赖中（含 21MB WASM）
- `beautiful-mermaid` 在 `research/design-assets/external-repos/beautiful-mermaid/`

## 技术方案：客户端优先，Kroki 兜底

| 引擎 | 渲染方式 | 实现 |
|---|---|---|
| Mermaid | 客户端 CDN | 已有，保持 |
| D2 | 客户端 WASM | `@terrastruct/d2` dynamic import |
| Graphviz | 客户端 CDN | `@hpcc-js/wasm-graphviz` CDN |
| PlantUML | Kroki SSR | 无 WASM，Server 端 POST kroki.io/plantuml/svg → 内联 SVG |

**PlantUML Kroki 流程**：
```
html-processor.ts
  → <rk-diagram engine="plantuml">…</rk-diagram>
  → POST https://kroki.io/plantuml/svg
  → SVG 内联到 processedHtml
```

客户端 WC 检测到内联 SVG → 跳过 dynamic import。

## 决策

- **Kroki 实例**：公共 `https://kroki.io`，无需自建
- **失败处理**：失败就失败，简单错误占位即可，不 crash server
- **优先级**：客户端能跑就跑，跑不了才 SSR

## Acceptance Criteria

- [ ] `<rk-diagram engine="mermaid">` 正常渲染
- [ ] `<rk-diagram engine="d2">` WASM 客户端渲染
- [ ] `<rk-diagram engine="graphviz">` CDN 客户端渲染
- [ ] `<rk-diagram engine="plantuml">` Kroki SSR 内联 SVG

## Out of Scope

- Beautiful Mermaid（后续研究）
- Structurizr / BPMN / Excalidraw
- Kroki 自建
- 复杂降级逻辑
