# RenderKit 全面重构进度

## 当前状态（2026-05-17）

### 已完成

| 模块 | 状态 | 验证 |
|---|---|---|
| packages/shared | ✅ renderer schema + chart block type + 4 error codes | contracts 72/72 |
| packages/dsl | ✅ chart compiler + compileChart 函数 | validate ✓ |
| packages/blocks | ✅ dispatch + 5 table profiles + code/ (Shiki+hljs) + ChartBlock | build ✓ |
| apps/web | ✅ ArtifactView 94行 + ReviewPanel 3-tab + P0 bugs 全修 | build ✓ |
| chart fixture | ✅ examples/capabilities/chart-gallery.rk.md | contracts ✓ |

### 全量验证
```
pnpm verify           → 231 passed, 0 failed
pnpm verify:contracts → 72 passed, 0 failed
pnpm build (web)      → 成功
```

### 待做（Wave 2）
- [ ] CSS 新组件样式（table profiles + code frame + chart + ReviewPanel tabs）
- [ ] capability fixtures（code-presentation + table-profiles）
- [ ] verifier 更新（verify-browser 覆盖新 block）
- [ ] authoring skill 更新
- [ ] strict TypeScript 收紧
