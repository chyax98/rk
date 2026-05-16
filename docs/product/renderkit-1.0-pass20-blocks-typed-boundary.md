# RenderKit 1.0 第 20 轮飞轮：Blocks Renderer Typed Boundary

状态：已实现并验证  
日期：2026-05-17

## 目标

TypeScript migration 仍是 1.0 硬化轨道。Shared、DSL、Store/API 已有 typed boundary 后，下一处高价值边界是 `@renderkit/blocks`：它连接 shared model contract 和 React renderer registry，如果这里漂移，Web 页面会出现 unknown block 或 props 不匹配。

## 改动

新增：

```text
packages/blocks/src/index.d.ts
```

更新：

```text
packages/blocks/package.json
scripts/verify-contracts.mjs
docs/product/renderkit-1.0-typescript-migration.md
docs/product/renderkit-1.0-living-audit.md
```

## Typed boundary

`@renderkit/blocks` 现在暴露：

```text
BlockFrameProps
RenderBlockProps
RenderKitBlockComponent
RenderKitRegistry
registry
RenderBlock
BlockFrame
各 block component exports
```

并复用 shared contracts：

```text
RenderKitBlock
BlockType
```

`package.json` 现在有 root types export：

```json
{
  "types": "./src/index.d.ts",
  "exports": {
    ".": {
      "types": "./src/index.d.ts",
      "import": "./src/index.jsx"
    }
  }
}
```

## Verification gate

`pnpm verify:contracts` 新增断言：

- `@renderkit/blocks` exposes package types
- `@renderkit/blocks` exports typed root entry
- `@renderkit/blocks` declares renderer registry boundary
- `@renderkit/blocks` typed boundary uses shared block contract

验证结果：

```bash
pnpm verify:contracts
# Results: 69 passed, 0 failed

pnpm verify
# Results: 225 passed, 0 failed
```

## 边界

这不是完整 `.tsx` runtime migration。当前目标是先锁住 package/API contract，防止 Agent-facing / Web-facing renderer boundary 继续漂移。后续再把具体 block component props 和 `RenderBlock` runtime 迁移到 TSX。
