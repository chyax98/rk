# RenderKit 1.0 第 18 轮飞轮：Directive Auto IDs

状态：已实现并验证  
日期：2026-05-17

## 目标

`docs/product/renderkit-1.0-dsl-ergonomics.md` 和产品策略都指出：Agent 写 `.rk.md` 时每个 directive 都强制写 `id="..."` 会增加语法负担。1.0 的方向是保留稳定 review anchors，同时让 draft/display-only blocks 可以省略 id，由 parser 生成 deterministic `auto-...` id。

## 改动

更新：

```text
packages/dsl/src/index.mjs
scripts/verify-fixtures.json
scripts/verify.mjs
skills/renderkit-authoring/SKILL.md
docs/test-plan.md
docs/renderkit-complete-system.md
```

新增：

```text
examples/capabilities/auto-id.rk.md
docs/product/renderkit-1.0-pass18-auto-directive-ids.md
```

删除旧 bad fixture：

```text
examples/fixtures/missing-id.rk.md
```

## 实现方式

当 directive block 没有 `id` 时，parser 会生成 deterministic id：

```text
auto-<block-type>-<slug(seed)>
```

seed 优先来自：

```text
title / label / q / question / chosen / source / body text / block
```

生成器会避开文档中所有显式 id，并避免同文档内自动 id 碰撞。

示例：

```md
:::callout{tone="info" title="No ID"}
This callout has no id attribute.
:::
```

生成：

```text
auto-callout-no-id
```

## Authoring 规则

- 对于 draft/display-only block，可以省略 id。
- 对于可能收到人类评论的 block，仍建议写显式稳定 id。
- 已存在的显式 id 不能随意改，因为评论锚点依赖它。

## 验证

新增 verifier 断言：

```text
✓ auto-id case validates
✓ auto-id case generates deterministic directive id
```

验证命令：

```bash
pnpm verify
# Results: 220 passed, 0 failed
```

## 取舍

- 没有实现 `--freeze-ids` 写回源文件；这是后续增强。
- 自动 id 是 deterministic，但仍可能随着 block 标题/内容变化而变化；所以 review-critical blocks 仍应显式写 id。
- 保留 `RK_BLOCK_ID_REQUIRED` 常量作为 legacy/error-code 兼容说明，但正常 parser 不再为缺失 id 报错。
