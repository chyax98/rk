# RenderKit 重构进度

## Wave 1 状态

| 包 | 状态 | 说明 |
|---|---|---|
| packages/shared | ✅ 完成 | TS + renderer schema, chart block type |
| packages/dsl | ✅ 完成 | 15 个 compiler 文件 + attrs.ts + types.ts + chart block |
| packages/blocks | ⏳ 待完成 | dispatch + table profiles + Shiki + ChartBlock |
| apps/web | ✅ 完成 | ArtifactView 拆分 + P0 bugs 修复 |
| packages/cli | ⏳ 待完成 | 模块化 + sourceFile lock + test fixes |
| verify:contracts | ✅ 通过 | 72 passed, 0 failed |

## 验证基线
```
✅ renderkit validate examples/alpha-showcase.rk.md → ok
✅ renderkit validate examples/capabilities/chart-gallery.rk.md → ok
✅ pnpm verify:contracts → 72 passed, 0 failed
```
