---
title: RenderKit 代码块渲染器调研
version: 1
theme: paper-light
surface: decision-brief
---

# RenderKit 代码块渲染器调研

:::sum{id="research-summary" title="结论" width="wide"}
可以用成熟方案优化代码块，但不建议把 Monaco / CodeMirror 这种“编辑器”直接当默认代码块 renderer。RenderKit 的核心是阅读和评论，不编辑正文；默认代码块应走静态、高质量、可打印、可评论的渲染路线。推荐方向是 **Shiki / Expressive Code 风格的 server-side 或 pre-rendered code block**，保留 Monaco/CodeMirror/Sandpack 作为未来“交互式 playground / patch preview”的特殊 block。
:::

:::table{id="current-code-evidence" title="当前实现证据" width="wide"}
| 项目 | 当前状态 | 证据 | 判断 |
|---|---|---|---|
| 高亮引擎 | `highlight.js/lib/common` | `packages/blocks/src/CodeBlock.jsx` import hljs | 可用但普通 |
| 渲染结构 | header + copy + `<pre><code dangerouslySetInnerHTML>` | `CodeBlock.jsx` | 缺 line numbers、diff、focused lines、filename frame |
| 运行位置 | Client component | `useState` copy button，`ArtifactView.jsx` 是 client | 引擎进浏览器 bundle |
| 设计目标 | reading-first + commentable artifact | RenderKit 产品约束 | 不应默认变成 live editor |
:::

::::compare{id="renderer-options" title="候选方案对比" width="wide"}
| 方案 | 适配度 | 优点 | 风险 / 不适合点 |
|---|---|---|---|
| Shiki | 高 | VS Code TextMate grammar/theme；博客/docs 常用；支持 transformers、diff/highlight/focus/word markers | 包体比 highlight.js 大；最好 server/pre-render，不宜整包进 client |
| Expressive Code | 很高 | 基于 Shiki；内置 editor/terminal frames、line numbers、text markers；产品化程度接近优秀技术博客 | Astro/MDX 生态更成熟；RenderKit 要用 core/plugin 而不是直接搬框架集成 |
| Bright / Code Hike | 中 | server-side、VS Code highlighting、适合代码 walkthrough/scrollycoding | MDX/React Server Component 取向较强；和 RenderKit “不引入 MDX runtime”有冲突 |
| CodeMirror 6 | 中低 | 真编辑器；read-only code view 可做交互、selection、gutter、folding | 默认代码块用它会太重；编辑器语义压过文档；打印/静态导出不如 Shiki |
| Monaco | 低 | VS Code 级编辑体验、hover、diagnostics、diff editor | `monaco-editor` unpacked size 约 72.6MB；worker/layout 重；不适合默认阅读代码块 |
| Sandpack | 特殊用途 | live-running playground；适合教程/博客交互示例 | 不是普通 code renderer；依赖 bundler/runtime；local-first 和安全边界要单独设计 |
| Prism / react-syntax-highlighter | 中低 | 生态老、易用 | 相比当前 highlight.js 提升有限；不解决产品化 code frame 能力 |
::::

:::table{id="source-evidence" title="调研证据摘录" width="wide"}
| 来源 | 关键事实 | 对 RenderKit 的含义 |
|---|---|---|
| Shiki 官方 guide | Shiki 基于 TextMate grammar 和 VS Code themes | 最适合做“博客级静态代码块”核心引擎 |
| Shiki transformers | 官方提供 transformer 机制，可做 notation diff/highlight/focus 等 | 可把 Agent DSL 扩展为 `highlight="1,3-5"`、`diff`、`focus` |
| Expressive Code docs | 支持 editor/terminal frames；line numbers 插件；frames 可自动选择 editor/terminal | 代码块产品力可直接学习：文件标签、终端窗口、复制按钮、行号 gutter |
| react-shiki | React 组件/hook，支持 line numbers、language labels | 可快速试验，但默认 client-side 不是长期最优架构 |
| Bright | runs on server、no bundle-size impact、VS Code themes | 证明 server-side highlighting 是正确方向 |
| Sandpack docs | 用 CodeMirror under the hood，创建 live coding environment | 适合未来 `playground` block，不适合默认 `code` block |
| npm view | `monaco-editor` unpacked size 约 72.6MB；`@codesandbox/sandpack-react` 约 1.2MB | Monaco 默认引入风险过大；Sandpack 可作为 opt-in |
:::

:::dec{id="recommendation" q="RenderKit 默认代码块应该选哪条路？" chosen="Shiki/Expressive Code 风格的静态产品化代码块" status="proposed" width="wide"}
- 默认 `code` block 继续保持阅读优先：静态 HTML、可复制、可打印、可评论。
- 用 Shiki 取代 `highlight.js` 作为高亮核心；优先 server-side / pre-render，不把完整 highlighter 主路径塞进浏览器。
- 借鉴 Expressive Code 的产品能力：editor/terminal frame、filename tab、line numbers、line highlight、diff marker、word highlight、copy behavior。
- Monaco/CodeMirror 不做默认 renderer；保留为未来 `playground` / `diff` / `patch-review` 特殊 block。
:::

:::fig{id="target-architecture" caption="建议架构：静态 code renderer 与未来 playground 分层" width="wide"}
flowchart LR
  A[Agent writes :::code] --> B[DSL parse attrs]
  B --> C[Code renderer service]
  C --> D[Shiki / Expressive Code HTML]
  D --> E[Reading-first Web code block]
  E --> F[Block/selection comments]
  B --> G{block type?}
  G -- code --> C
  G -- future playground --> H[Sandpack/CodeMirror opt-in]
  G -- future diff --> I[Monaco/CodeMirror diff opt-in]
:::

:::roadmap{id="implementation-roadmap" title="建议实施路线" width="wide"}
- [active] Phase 0：把当前调研文档 push 成 RenderKit artifact，让你直接评论裁决。
- [next] Phase 1：改造 `:::code` DSL，支持 `filename`、`showLineNumbers`、`highlight`、`diff`、`frame="editor|terminal|none"`、`copyMode`。
- [next] Phase 2：引入 Shiki renderer，先做 deterministic server/pre-render；保留 highlight.js fallback。
- [planned] Phase 3：实现 Expressive Code 风格 UI：gutter、标题 tab、terminal frame、diff +/- 行、focus lines。
- [planned] Phase 4：browser + pw 验证：复制按钮、行号、diff、打印、selection comment、无 page errors。
- [planned] Phase 5：再评估是否新增 `playground` block，单独集成 Sandpack/CodeMirror，不污染默认阅读体验。
:::

:::todo{id="acceptance-checklist" title="代码块升级验收清单" width="wide"}
- [ ] 默认代码块视觉明显优于当前 highlight.js：有 filename/tab、line numbers、主题与 RenderKit tokens 对齐。
- [ ] 支持高亮行和 diff 行，适合工程 review 文档。
- [ ] 复制按钮复制纯代码，不复制行号和提示符。
- [ ] 终端代码块可选择去掉 `$` / `#` prompt 或 comment lines。
- [ ] 代码块能被 block comment 和 selection comment 精确锚定。
- [ ] 打印模式可读，不出现横向爆炸。
- [ ] 不引入 Monaco 级别的大依赖到默认路径。
- [ ] `pnpm verify`、`pnpm verify:browser`、真实 `pw` 通过。
:::

:::src{id="current-code-block-source" language="jsx" title="当前 CodeBlock 关键实现" width="wide"}
```jsx
import hljs from 'highlight.js/lib/common';

export default function CodeBlock({ language, title, code }) {
  const highlighted = highlightCode(code || '', language || '');
  return (
    <pre>
      <code dangerouslySetInnerHTML={{ __html: highlighted }} />
    </pre>
  );
}
```
:::

:::note{id="research-boundary" title="边界说明" width="wide"}
本轮是调研和产品决策，不直接替换实现。若进入实现，第一步应先做一个 `examples/capabilities/code-presentation.rk.md`，覆盖 JS/TS/bash/diff/terminal/long lines/line highlight，再以它作为视觉和回归验证基准。
:::
