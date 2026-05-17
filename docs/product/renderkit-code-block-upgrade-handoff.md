# RenderKit 代码块渲染升级 Handoff

状态：待执行  
日期：2026-05-17  
负责人建议：下一轮实现 worker / 主控审查

## 1. 背景

用户反馈：当前代码块渲染比较普通，希望参考成熟博客/文档系统里的代码块 renderer，评估能否引入成熟方案。

已完成调研并生成 RenderKit artifact：

```text
docs/product/renderkit-code-block-renderer-research.rk.md
```

当前页面：

```text
http://localhost:3737/a/art_d81285bb2d
```

关联项目缺口评审：

```text
docs/product/renderkit-current-gap-review.rk.md
http://localhost:3737/a/art_08442cb06c
```

最新相关提交：

```text
1cb31d4 add renderkit gap and code block research artifacts
```

## 2. 调研结论

默认 `code` block 不建议使用 Monaco / CodeMirror 这类完整编辑器。

推荐默认路线：

```text
Shiki / Expressive Code 风格的静态、高质量、可打印、可评论代码块
```

原因：

- RenderKit 是 reading-first review surface，不是在线编辑器。
- 默认 code block 要服务阅读、评论、复制、打印、Agent feedback。
- Monaco/CodeMirror/Sandpack 应作为未来特殊 block，而不是默认代码块。

## 3. 候选方案排序

| 优先级 | 方案 | 判断 |
|---|---|---|
| P0 | Shiki | 默认高亮核心候选；VS Code TextMate grammar/theme；适合博客级静态代码块 |
| P0 | Expressive Code 风格能力 | 借鉴 editor/terminal frame、line numbers、text markers、copy behavior |
| P1 | Bright / Code Hike | 可参考 server-side highlighting / walkthrough，但避免引入 MDX runtime |
| P2 | CodeMirror 6 | 未来 read-only interactive block / patch preview 可评估 |
| P2 | Sandpack | 未来 `playground` block 可评估 |
| P3 | Monaco | 只适合 heavyweight diff/editor，默认路径不引入 |

## 4. 关键证据

现状代码：

```text
packages/blocks/src/CodeBlock.jsx
```

当前实现：

```jsx
import hljs from 'highlight.js/lib/common';
```

当前能力：

- header
- language label
- copy button
- highlight.js highlighting

当前缺口：

- 无 line numbers
- 无 filename/tab frame
- 无 terminal/editor frame
- 无 diff +/- 行
- 无 focus/highlight lines
- 无 word highlight
- copy 行为未区分 terminal prompt/comment
- highlighter 在 client path 上执行

包体证据：

```text
monaco-editor dist.unpackedSize ≈ 72.6MB
@codesandbox/sandpack-react dist.unpackedSize ≈ 1.2MB
shiki + langs/themes 较大，但可 server/pre-render，避免默认 client bundle 污染
```

## 5. 待办拆解

### P0 — 建立验证样例

新增：

```text
examples/capabilities/code-presentation.rk.md
```

必须覆盖：

- TypeScript / JSX
- Bash terminal
- JSON/YAML
- diff patch
- long lines
- highlighted lines
- copied text correctness
- print mode
- selection comment in code block

验收：

```bash
node packages/cli/bin/renderkit.mjs validate examples/capabilities/code-presentation.rk.md --json
pnpm verify
```

### P0 — 扩展 `:::code` DSL 属性

建议属性：

```md
:::code{
  id="example"
  language="tsx"
  title="Renderer entry"
  filename="packages/blocks/src/CodeBlock.tsx"
  frame="editor"
  showLineNumbers="true"
  highlight="3,8-12"
  diff="true"
  copyMode="code"
}
```

需要更新：

```text
packages/dsl/src/index.mjs
packages/dsl/src/index.d.ts
packages/shared/src/contracts.d.ts
packages/shared/src/contracts.mjs
scripts/verify-contracts.mjs
skills/renderkit-authoring/SKILL.md
```

### P0 — 引入 Shiki renderer

建议新增模块：

```text
packages/blocks/src/code/renderShiki.mjs
```

或如果选择 server/pre-render：

```text
apps/web/lib/code-renderer.mjs
apps/web/app/api/render/code/route.js
```

设计原则：

- 默认不把完整 highlighter 放入浏览器主路径。
- Shiki 失败时 fallback 到 escaped plain text 或当前 highlight.js。
- 输出结构必须可被 CSS token 控制。

### P0 — 实现产品化 Code UI

目标能力：

- editor frame
- terminal frame
- filename tab
- language badge
- copy button
- line number gutter
- highlighted lines
- diff +/- marker
- line wrapping policy

涉及文件：

```text
packages/blocks/src/CodeBlock.jsx
packages/design/src/blocks.css
packages/design/src/tokens.css
packages/design/src/themes.css
```

### P1 — 验证与回归

更新：

```text
scripts/verify.mjs
scripts/verify-browser.mjs
```

必须验证：

- code-presentation fixture validates
- code block has frame/line numbers/diff markers
- copy button exists
- no browser errors
- screenshot evidence saved

真实交互：

```bash
pw -h
pw session create rk-code --open <artifact-url>
pw read-text -s rk-code --selector main --max-chars 2000
pw click -s rk-code --text Copy
pw errors -s rk-code --action recent --output=json
pw screenshot -s rk-code --path .pw-evidence/code-presentation.png
```

### P1 — 文档与 skill

更新：

```text
docs/product/renderkit-code-block-renderer-research.rk.md
docs/product/renderkit-1.0-living-audit.md
skills/renderkit-authoring/SKILL.md
```

新增 pass doc：

```text
docs/product/renderkit-1.0-pass22-code-renderer-upgrade.md
```

## 6. 不做事项

本轮不要做：

- 不默认集成 Monaco。
- 不默认集成 CodeMirror。
- 不引入 MDX runtime。
- 不做在线正文编辑。
- 不把 Sandpack 作为普通 `code` block。
- 不顺手重构整个侧边栏；侧边栏另有独立 P0 backlog。

## 7. 决策点

进入实现前需要确认：

1. 默认主题是否采用 Shiki `github-light` / `vitesse-light` / 自定义 token-mapped theme？
2. Shiki 渲染放在 server/pre-render，还是先 client prototype？
3. `highlight` / `diff` 语法用属性还是 code fence meta？
4. 复制 terminal code 时是否自动移除 `$` / `#` prompt？
5. 是否保留 highlight.js fallback？

## 8. 推荐下一步

建议下一轮直接执行：

```text
Phase 1：code-presentation fixture + DSL 属性 + Shiki 静态 renderer prototype
```

完成后用：

```bash
pnpm verify
pnpm verify:browser
pw CLI 实测
```

再让用户在 RenderKit 页面上评审视觉效果。
