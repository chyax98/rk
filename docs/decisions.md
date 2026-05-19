# RenderKit Technical Decisions

决策日志 — 记录关键技术选择的依据与取舍。每条决策包含：背景、选项对比、最终选择、来源。

---

## ADR-01: HTML-first 而非 DSL

**背景**: 早期 RenderKit 使用 `.rk.md` DSL，需要编译步骤，Agent 不熟悉。

**选项**:
- A: 保留 DSL，Agent 学习 DSL 语法
- B: HTML-first，Agent 直接写 HTML + `<rk-*>` WC

**决定**: B — HTML-first

**理由**:
- LLM 对 HTML 的掌握度远高于私有 DSL
- 无编译步骤，减少工具链复杂度
- Agent 可以利用完整的 HTML 能力（内联 CSS、脚本）
- 参考: markdown-viewer-extension 也是直接在 Markdown 中嵌入自定义块

---

## ADR-02: Light DOM（无 Shadow DOM）

**背景**: Web Components 有 Shadow DOM 选项，但 Shadow DOM 跨越 Selection API 边界。

**决定**: 全部使用 Light DOM（无 shadow DOM）

**理由**:
- Selection API 无法穿越 Shadow DOM 边界
- Feishu 式评论系统需要 Selection API 读取锚点文本
- CSS 变量（`--rk-*` token）可以穿透 Light DOM，主题系统正常工作

---

## ADR-03: 飞书式评论面板

**背景**: 需要支持人类对 Agent 生成内容的评论。

**选项**:
- A: 每个 anchor 一个气泡弹窗（Google Docs 风格）
- B: 右侧统一评论面板（Feishu 风格）

**决定**: B — 右侧面板，所有评论按文档位置排序

**理由**:
- 气泡弹窗遮挡内容
- 一次看到所有评论，方便 Agent 整体阅读
- Feishu 文档的评论体验更适合长文档审阅

---

## ADR-04: 图表引擎策略（客户端优先 + Kroki SSR 兜底）

**背景**: 需要支持 Mermaid、D2、Graphviz、PlantUML。

**实验结果** (2026-05-18):
- Mermaid@11 CDN: ✅ 工作
- @terrastruct/d2 WASM CDN: ⚠️ API 不确定，可能不工作
- @hpcc-js/wasm-graphviz CDN: ❌ UMD 导出问题，CDN URL 变更
- **@viz-js/viz lib/viz-standalone.js**: ✅ 工作（globalThis.Viz 访问方式）
- Kroki SSR (kroki.io): ✅ 工作（PlantUML + Graphviz）

**最终策略**:
| 引擎 | 方式 | 依据 |
|---|---|---|
| Mermaid | CDN 客户端 | 原有，成熟 |
| D2 | CDN WASM 客户端 | 有 WASM 包 |
| Graphviz | Kroki SSR（server 推送时预渲染）| 来自 docu.md 调研 |
| PlantUML | Kroki SSR | 无 WASM，需 Java |

**关键 Bug 修复（必须记录）**:
- `_render()` 替换 `this.innerHTML` 前必须先保存 `.rk-diagram__prerendered` 内容，否则 Kroki SSR 结果丢失
- Graphviz viz-standalone.js 是 UMD，需用 `globalThis.Viz.instance()` 而非 named import

**来源**: 研究 docu.md (markdown-viewer-extension) 源码 — `src/renderers/dot-renderer.ts`

---

## ADR-05: Graphviz 库选择

**选项**:
- A: @hpcc-js/wasm-graphviz（CDN 路径变更频繁）
- B: **@viz-js/viz**（来自 docu.md 实践）
- C: Kroki.io SSR

**决定**: C（Kroki SSR，在 html-processor.ts 预渲染），客户端 fallback 用 @viz-js/viz

**来源**: docu.md `DotRenderer` 用 `@viz-js/viz`，经过 local 实验验证

---

## ADR-06: ECharts 数据格式

**背景**: rk-chart 原本只支持 Markdown pipe table 格式。

**决定**: 优先支持 JSON array，pipe table 作为 fallback

**理由**:
- JSON 更自然，Agent 写 JSON 比 pipe table 更简单
- JSON 支持多个数值字段 → 自动多系列图表
- Agent 常见输出格式就是 JSON

**ECharts Y 轴格式**: 大数字自动转换为 K/M 单位（98000 → 98K）

---

## ADR-07: 设计系统主题来源

**决定**: 从 open-design/design-systems/ 移植真实品牌 token，不手写颜色

**8 套主题来源**:
- paper-light: md2html 阅读优先规范
- dark-pro: internal
- notion-clean: open-design/design-systems/notion/tokens.css
- linear-app: open-design/design-systems/linear-app/tokens.css
- glassmorphism: open-design/design-systems/glassmorphism/DESIGN.md
- ibm-enterprise: open-design/design-systems/ibm/DESIGN.md (Carbon Design System)
- amber-terminal: internal
- editorial-kami: internal

---

## ADR-08: HTML 自闭合标签规则（Critical Bug）

**发现**: HTML5 解析器对自定义元素（Custom Elements）**不支持自闭合**标签。

```html
<!-- ❌ 错误: <rk-field /> 后续元素变成子元素 -->
<rk-form>
  <rk-field label="评分" type="rating" />
  <rk-field label="反馈" type="textarea" />  ← 被解析为上一个的子元素!
</rk-form>

<!-- ✅ 正确 -->
<rk-form>
  <rk-field label="评分" type="rating"></rk-field>
  <rk-field label="反馈" type="textarea"></rk-field>
</rk-form>
```

**决定**: 所有 Agent authoring skill 示例使用显式闭合标签，并在 SKILL.md 头部警告。

---

## ADR-09: Feishu 评论 API 架构

**数据模型**:
- 评论存储 `anchor` 字段 = `anc_*` ID（由 html-processor 在 push 时生成）
- 每次 push 新 revision 时对比 anchor 变化，删除的 anchor 对应评论标为 orphaned
- `rk feedback` 命令只返回 `open` 和 `orphaned` 状态的评论

**反馈 JSON 给 Agent**:
```json
{
  "ok": true,
  "artifactId": "...",
  "openCount": 2,
  "comments": [
    { "id": "cmt_xxx", "anchor": "anc_section-2", "text": "..." }
  ]
}
```

Agent 根据 anchor 定位文档位置，修改对应内容，再次 push。

---

## ADR-10: Diagram Authoring Route — D2 and Mermaid First

**Status**: Accepted, supersedes the client-D2 parts of ADR-04.

**Context**: Browser scans found that diagram failures are easiest to diagnose when the source is a small text DSL and the server can produce push-time warnings.

**Decision**:
- Use `rk-diagram engine="d2"` for architecture, dependency, topology, system boundary, and deployment diagrams.
- Use `rk-diagram engine="mermaid"` for flowcharts, sequence diagrams, state machines, gantt, ER, class, and journey diagrams.
- Use Graphviz/PlantUML only when a document explicitly needs those legacy DSLs.
- Do not add compatibility fallback chains for broken old syntax or obsolete CDN paths; fix the source case and the main rendering path.

**Evidence**:
- `scripts/render-scan.mjs` catches push warnings, DOM errors, console errors, network failures, feedback render errors, and smoke failures.
- `examples/cases/diagram-rendering-matrix.html` verifies D2/Mermaid as the main route.

## ADR-11: Component Cleanup Requires Decision Evidence

**Status**: Accepted.

**Context**: Some niche visual components may be worse-looking or harder for agents to author than a higher-level replacement.

**Decision**: A component can be removed only after a decision entry records:
- observed usage in examples/cases
- replacement path
- visual/authoring reason for removal
- migration checklist

**Initial evaluation candidates**:
- `rk-sketch` → usually replace with D2/Mermaid
- `rk-zdog` → replace with `rk-model` or remove use case
- `rk-3d` → replace with `rk-model`
- `rk-plot3d` → replace with `rk-chart` / `rk-plot` for most reports
- `rk-graph3d` → replace with `rk-graph`
- `rk-infographic` → replace with `rk-chart` + `rk-metric`
