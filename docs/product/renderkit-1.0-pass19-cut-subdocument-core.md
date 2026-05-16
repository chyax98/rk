# RenderKit 1.0 第 19 轮飞轮：裁剪 subdocument 核心块

状态：已实现并验证  
日期：2026-05-17

## 背景

`docs/product/renderkit-1.0-product-strategy.md` 明确把 `subdocument` 定为 1.0 应裁剪项：它当前只是一个链接卡片，不真正渲染子文档，也不能解决跨 artifact 评论/反馈汇总问题。继续保留会让 Agent grammar 变复杂，却不会提升阅读和评论的 1.0 核心产品力。

## 决策

从 1.0 核心 grammar、renderer registry、design CSS 和示例中移除 `subdocument`。

1.0 文档体系继续保留：

- `grid`：负责高密度二维布局。
- `table`：负责技术矩阵/状态跟踪。
- `diagram`：负责视觉化结构。
- `callout` / `summary` / `decision-card` / `code` / editorial blocks：负责阅读和评论体验。

跨文档嵌入、artifact link、子文档反馈汇总留到 2.0，不在当前阅读/评论闭环里伪实现。

## 改动

删除：

```text
packages/blocks/src/SubdocumentBlock.jsx
```

更新：

```text
packages/dsl/src/index.mjs
packages/shared/src/contracts.mjs
packages/shared/src/contracts.d.ts
packages/blocks/src/registry.jsx
packages/blocks/src/index.jsx
packages/design/src/blocks.css
apps/web/app/a/[id]/ArtifactView.jsx
examples/alpha-showcase.rk.md
examples/capabilities/grid-layout.rk.md
examples/theme-cases/*.rk.md
skills/renderkit-authoring/SKILL.md
docs/renderkit-complete-system.md
docs/theme-strategy.md
docs/product/renderkit-1.0-dsl-ergonomics.md
```

新增 regression fixture：

```text
examples/fixtures/removed-subdocument.rk.md
```

该 fixture 断言 `:::subdocument` 现在会返回：

```text
RK_UNKNOWN_BLOCK_TYPE
```

## 验证

已执行：

```bash
pnpm verify:contracts
# Results: 65 passed, 0 failed

pnpm verify:agent
# Results: 45 passed, 0 failed

pnpm verify
# Results: 225 passed, 0 failed

pnpm verify:sqlite
# Results: 102 passed, 0 failed

pnpm verify:smoke
# Results: 24 passed, 0 failed

pnpm verify:browser
# Results: 37 passed, 0 failed

node packages/cli/bin/renderkit.mjs validate examples/fixtures/removed-subdocument.rk.md --json | jq '.ok, .errors[0].code'
# false
# "RK_UNKNOWN_BLOCK_TYPE"
```

后续 final gate 仍需在最终 audit 阶段执行真实 `pw` 交互检查。

## 取舍

- 这是 intentional breaking change，不做旧代码兼容。
- 如果未来需要跨文档能力，应作为 artifact link / embedded artifact / feedback aggregation 的完整 2.0 方案实现，而不是恢复静态 metadata card。
- 示例中原来的子文档卡片改为 table/note/code prose，保证页面仍是阅读优先的一篇文档。
