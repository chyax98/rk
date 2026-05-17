# Progress

## Status
Wave 3: TypeScript strict 收紧完成

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
