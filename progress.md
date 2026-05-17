# RenderKit 全面重构进度

## 完成状态（2026-05-17）

### Wave 1 — 核心重构

| 模块 | 交付物 | 验证 |
|---|---|---|
| packages/shared | TS + renderer schema + chart block type + strict | contracts 76/76 |
| packages/dsl | 拆 14 compiler + chart block + strict | validate ✓ |
| packages/blocks | TSX + dispatch + 5 table profiles + code/ + ChartBlock + strict | build ✓ |
| apps/web | ArtifactView 94行 + ReviewPanel 3-tab + 全中文 UI + P0 bugs 修 + build | build ✓ |
| packages/cli | 模块化 + sourceFile lock | - |

### Wave 2 — 能力与验证

| 任务 | 状态 |
|---|---|
| chart-gallery fixture | ✅ |
| code-presentation fixture | ✅ |
| table-profiles fixture | ✅ |
| verify-browser 覆盖新 block | ✅ |
| verify-contracts 覆盖新 fixture | ✅ |
| authoring skill 文档更新 | ✅ |
| CSS 新组件样式 | ✅ (已有) |

### Wave 3 — 质量收束

| 任务 | 状态 |
|---|---|
| Mermaid SVG a11y | ✅ sanitize style + aria-hidden + figure |
| 中文 UI 全量 pass | ✅ 所有组件中文 |
| strict TypeScript (shared) | ✅ |
| strict TypeScript (blocks) | ✅ |
| strict TypeScript (dsl) | ✅ |

### 全量验证

```
pnpm verify           → 246 passed, 0 failed
pnpm verify:contracts → 76 passed, 0 failed
pnpm build (web)      → 成功
```

### 原始缺口评审覆盖

| 缺口 | 状态 |
|---|---|
| 评审侧边栏负担过重 | ✅ 3-tab + 94行 ArtifactView |
| 工程收束不足 | ✅ TS 全量 + strict 3/5 包 |
| 测试数据污染 Demo | ✅ smoke temp file |
| Feedback 命令不可靠 | ✅ renderkit bin |
| 中文优先 | ✅ 全中文 UI |
| Outline 语义 | ✅ heading-first |
| Mermaid 可访问文本 | ✅ sanitize + aria-hidden |

### 剩余（低优先级）

- [ ] strict TypeScript (web app + cli) — web build 已通过，可逐步收紧
- [ ] Playground block — P2，未来特性
- [ ] TanStack Table opt-in — P2，renderer=tanstack
