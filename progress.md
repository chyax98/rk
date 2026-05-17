# Progress

## Status
Wave 3: TypeScript strict 收紧 + .mjs 全删完成

## .mjs Deletion Results

| 包 | .mjs 状态 | package.json |
|---|---|---|
| packages/shared/src/ | 0 个 .mjs（contracts.mjs / design-assets.mjs / index.mjs 已消失） | exports → .ts ✅ |
| packages/dsl/src/ | 0 个 .mjs（index.mjs 已消失） | exports → .ts ✅ |
| packages/cli/bin/ | renderkit.mjs 保留（thin loader） | 指向 src/index.ts ✅ |

## CLI bin 修正
- bin/renderkit.mjs 从 import `../src/cli.ts` 改为 `../src/index.ts`
- Node 24 `--experimental-strip-types` 直接跑 .ts

## Tasks
- [x] packages/shared/tsconfig.json strict: true
- [x] packages/dsl/tsconfig.json strict: true
- [x] packages/dsl/src/index.ts 去掉所有 any
- [x] packages/dsl/src/parse.ts 去掉所有 any
- [x] packages/dsl/src/compilers/decision.ts catch(e: unknown)
- [x] packages/dsl/src/compilers/chart.ts 修复 import 顺序和多余 cast
- [x] 全量验证：dsl/shared 中 0 处 any 残留

## Files Changed
- packages/shared/tsconfig.json
- packages/dsl/tsconfig.json
- packages/dsl/src/index.ts
- packages/dsl/src/parse.ts
- packages/dsl/src/compilers/decision.ts
- packages/dsl/src/compilers/chart.ts

## Notes
- catch 子句全部改为 `catch (e: unknown)` + `e instanceof Error` 守卫
- `Record<string, any>` 全部改为 `Record<string, unknown>`
- chart.ts 底部 import 移到顶部，消除循环引用风险

## Wave 4 — Web .jsx → .tsx 迁移（2024-05-17）

### 完成项
- [x] `apps/web/app/layout.jsx` → `layout.tsx`（+ Metadata 类型，children: React.ReactNode）
- [x] `apps/web/app/page.jsx` → `page.tsx`（+ ArtifactSummary 类型，中文空态文案）
- [x] `apps/web/app/gallery/page.jsx` → `gallery/page.tsx`（+ GalleryData/GallerySurface 类型）
- [x] `apps/web/tsconfig.json` strict: false → true

### 文件变更
- 创建：`layout.tsx`, `page.tsx`, `gallery/page.tsx`
- 删除：`layout.jsx`, `page.jsx`, `gallery/page.jsx`（已不存在，前 worker 已删）
- 修改：`tsconfig.json`（strict: true）
