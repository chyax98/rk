# RenderKit 1.0 第 16 轮飞轮：DSL Typed Boundary

状态：已实现并验证  
日期：2026-05-17

## 目标

第 12 轮已经完成 shared contracts，但 living audit 仍记录 TypeScript Stage 2+ 未完成。本轮推进最小 Stage 2：先把 DSL package 的公共边界类型化，让 CLI/Web/Agent 不再猜测 `parseRK()` 的返回形状。

## 改动

新增：

```text
packages/dsl/src/index.d.ts
```

更新：

```text
packages/dsl/package.json
scripts/verify-contracts.mjs
docs/product/renderkit-1.0-typescript-migration.md
```

`@renderkit/dsl` 现在导出 typed package surface：

```ts
import type { ParseResult } from '@renderkit/shared';

export function parseRK(source: string, file?: string): ParseResult;
```

这不是机械 TS 重写，而是一个低风险 typed boundary：运行时仍是 `index.mjs`，类型来自 `@renderkit/shared` 的 `ParseResult` / `RenderKitModel` / `Diagnostic`。

## Verifier

`verify:contracts` 新增检查：

- `@renderkit/dsl` 的 `package.json` 是否声明 `types: ./src/index.d.ts`。
- `@renderkit/dsl` 的 exports 是否暴露 typed `parseRK`。
- `index.d.ts` 是否引用 shared `ParseResult`。

## 验证

```bash
pnpm verify:contracts
# Results: 62 passed, 0 failed

pnpm verify
# Results: 218 passed, 0 failed
```

## 后续

Stage 2 还未完全结束。后续可以继续：

1. 给 `BLOCK_COMPILERS` 增加实现层类型或 typed JSDoc。
2. 拆出 per-block props discriminated unions。
3. Store/API 使用 shared `ArtifactComment` / `FeedbackPayload` 类型边界。
4. Renderer registry 改成 typed block-to-component map。
