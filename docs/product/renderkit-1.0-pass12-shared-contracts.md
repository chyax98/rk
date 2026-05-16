# RenderKit 1.0 第 12 轮飞轮：Shared TypeScript Contracts 与漂移验证

状态：已实现并验证  
日期：2026-05-17

## 目标

前几轮已经把展示、评论、SQLite、浏览器验证推进到可用状态。本轮处理 1.0 收口前的架构硬化缺口：**DSL、Web renderer、CLI/API、Agent feedback 之间需要一个共享契约，避免 block type、theme、surface、comment selector 发生隐性漂移。**

本轮不是把全仓一次性迁移到 TypeScript，而是落实 `docs/product/renderkit-1.0-typescript-migration.md` 的 Stage 1：contracts first。

## 改动

### 1. 新增共享契约

新增：

```text
packages/shared/src/contracts.d.ts
packages/shared/src/contracts.mjs
```

`contracts.d.ts` 定义 Agent/API/renderer 共享类型：

```text
RenderKitModel
RenderKitBlock
BlockType
SourceRange
Diagnostic
ThemeName
SurfaceName
ArtifactMeta
ArtifactRevision
ArtifactComment
TextQuoteSelector
FeedbackPayload
```

`contracts.mjs` 提供运行时常量和 validator：

```text
BLOCK_TYPES
THEME_NAMES
SURFACE_NAMES
COMMENT_STATUSES
DIAGRAM_ENGINES
SERVER_RENDERED_DIAGRAM_ENGINES
BLOCK_WIDTHS
CALLOUT_TONES
BLOCK_ALIASES
WIDE_REVIEW_SURFACES
ERROR_CODES
validateRenderKitModel()
validateBlock()
validateTextQuoteSelector()
```

### 2. `@renderkit/shared` 导出 types 与 contracts 子路径

更新：

```text
packages/shared/package.json
packages/shared/src/index.mjs
```

导出：

```json
{
  ".": {
    "types": "./src/contracts.d.ts",
    "import": "./src/index.mjs"
  },
  "./contracts": {
    "types": "./src/contracts.d.ts",
    "import": "./src/contracts.mjs"
  }
}
```

### 3. DSL 接入共享契约

更新：

```text
packages/dsl/package.json
packages/dsl/src/index.mjs
```

DSL 现在从 `@renderkit/shared/contracts` 获取：

```text
DEFAULT_THEME
THEME_NAMES
SURFACE_NAMES
validateRenderKitModel
```

`parseRK()` 生成 model 后会运行共享契约验证。如果内部 compiler 产出非法 model，会返回 `RK_MODEL_CONTRACT_INVALID`，避免问题流入 Web/API/Agent feedback。

### 4. 新增契约漂移 gate

新增：

```text
scripts/verify-contracts.mjs
```

新增 package script：

```json
{
  "verify:contracts": "node scripts/verify-contracts.mjs"
}
```

该 gate 覆盖：

1. `@renderkit/shared` 是否导出 `.d.ts` types 和 `./contracts` 子路径。
2. `contracts.d.ts` 是否声明核心类型。
3. runtime contract list 是否唯一。
4. DSL compiler keys 是否等于可 author 的 block contract。
5. renderer registry keys 是否等于 `BLOCK_TYPES`。
6. DSL 是否导入 shared theme/surface contract。
7. DSL 是否对 model 执行 `validateRenderKitModel()`。
8. 关键 examples parse 后是否满足共享 model contract。
9. fixtures 是否覆盖每个可 author block（含 alias，例如 `metric -> stat`、`todo -> checklist`）。

### 5. 主验证链纳入 contract gate

更新：

```text
scripts/verify.mjs
```

`pnpm verify` 现在包含：

```text
== Shared contracts ==
✓ shared contracts drift gate passes
```

## 验证

```bash
pnpm verify:contracts
# Results: 52 passed, 0 failed

pnpm verify
# Results: 213 passed, 0 failed
```

## 设计取舍

- 没有一次性把 `.mjs/.jsx` 全部改成 `.ts/.tsx`，避免机械迁移干扰当前产品 flywheel。
- 先把最容易漂移的边界抽成 `.d.ts` + runtime validator：DSL model、block type、theme/surface、comment/selector、feedback payload。
- 没有新增重型依赖；当前使用 `.d.ts` 提供 TypeScript 消费面，用 JS runtime validator 提供真实执行保障。
- `surface` 类型允许未知字符串，因为现有 DSL 对 unknown surface 是 warning 而不是 hard fail，这保留了 Agent 实验空间。

## 后续

1. Stage 2：迁移 DSL compiler 到 TypeScript 或 typed JSDoc bridge。
2. Stage 3：Store/API row mapping 和 feedback payload 使用 shared contracts。
3. Stage 4：renderer registry 改成强类型 discriminated union。
4. Stage 5：`ArtifactView` 的 selection/comment state 最后迁移。
