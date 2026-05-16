# RenderKit 1.0 第 14 轮飞轮：Agent 元数据一致性收口

状态：已实现并验证  
日期：2026-05-17

## 目标

在第 13 轮加入 Agent-facing 设计资源 CLI 后，worker 审查指出仍存在跨层不一致：

- design CSS 支持 `proposal` / `documentation`，但 DSL/contracts/recipes/gallery 不完整。
- theme guide 中 `paper-light` 重复。
- recipes 推荐块与 authoring skill 推荐块不一致。
- error code 常量不完整。
- CLI 还缺少 blocks / aliases / errors 等自描述入口。

本轮目标是把这些元数据收口成 Agent 可查询、可验证的一致系统。

## 改动

### 1. surface 一致性

更新：

```text
packages/shared/src/contracts.mjs
packages/shared/src/contracts.d.ts
packages/shared/src/index.mjs
examples/gallery.json
examples/surfaces/proposal.rk.md
examples/surfaces/documentation.rk.md
```

`SURFACE_NAMES` 现在覆盖 7 个 surface：

```text
engineering-plan
decision-brief
review-report
runbook
data-report-lite
proposal
documentation
```

新增 recipes：

- `proposal`：平衡型产品/实现提案。
- `documentation`：博客/Notion 风格解释性文档。

新增 gallery examples：

```text
examples/surfaces/proposal.rk.md
examples/surfaces/documentation.rk.md
```

### 2. CLI 自描述能力补齐

更新：

```text
packages/cli/bin/renderkit.mjs
```

新增：

```bash
renderkit surfaces --json
renderkit themes --json
renderkit blocks --json
renderkit aliases --json
renderkit errors --json
```

配合已有命令：

```bash
renderkit recipes list --json
renderkit recipes show <surface> --json
renderkit design resources --json
```

Agent 现在可以不读源码，直接通过 CLI 查询 authoring 所需元数据。

### 3. recipes 与 skill 对齐

更新：

```text
packages/shared/src/index.mjs
skills/renderkit-authoring/SKILL.md
```

改动：

- 删除 Theme guide 中重复的 `paper-light` 行。
- Surface guide 补充 `proposal` / `documentation`。
- `engineering-plan` recipe 从 5 个推荐块扩展到完整的高密度方案文档块集合。
- 其他 surface recipes 补充 table/checklist/comparison/stat 等常用 review blocks。

### 4. error code 常量补齐

更新：

```text
packages/shared/src/contracts.mjs
```

补充：

```text
RK_DUPLICATE_BLOCK_ID
RK_GRID_CHILD_UNSUPPORTED
RK_TABS_CHILD_UNSUPPORTED
RK_TABS_BLOCK_UNSUPPORTED
RK_DECISION_YAML_INVALID
RK_TABLE_BODY_REQUIRED
RK_IMAGE_SRC_REQUIRED
RK_STAT_VALUE_REQUIRED
RK_CHECKLIST_BODY_REQUIRED
RK_QUOTE_BODY_REQUIRED
RK_COMPARISON_BODY_REQUIRED
RK_TIMELINE_BODY_REQUIRED
RK_TABS_CHILD_REQUIRED
```

### 5. verifier 加强

更新：

```text
scripts/verify-agent.mjs
scripts/verify-contracts.mjs
scripts/verify.mjs
```

新增检查：

- recipes list 暴露 7 个 surfaces。
- surfaces command 暴露 `proposal` / `documentation` 且都有 recipe。
- themes command 无重复。
- blocks / aliases / errors command 可用。
- gallery surfaces 与 shared `SURFACE_NAMES` 完全一致。
- 所有 shared surfaces 都有 recipe。
- proposal / documentation examples parse 后满足 shared contract。

## 验证

```bash
pnpm verify:agent
# Results: 37 passed, 0 failed

pnpm verify:contracts
# Results: 60 passed, 0 failed

pnpm verify
# Results: 218 passed, 0 failed
```

命令抽样：

```bash
node packages/cli/bin/renderkit.mjs recipes list --json | jq '.surfaces|length'
# 7

node packages/cli/bin/renderkit.mjs surfaces --json | jq '.surfaces|length'
# 7

node packages/cli/bin/renderkit.mjs aliases --json | jq '.aliases.metric,.aliases.todo'
# { "name": "stat" }
# { "name": "checklist" }
```

## 取舍

- 没有新增重型依赖。
- 没有把外部设计仓库 runtime 直接并入 RenderKit。
- `proposal` / `documentation` 被正式纳入 DSL/contracts/recipes/gallery，因为 CSS 和 theme cases 已经实际支持它们；这比保留孤儿 CSS 更清晰。
- `deck` 仍未加入正式 surface，因为当前目标仍集中在文档展示和评论，deck 是 future opt-in。

## 后续

1. 可继续实现 `renderkit design recommend --surface ...`。
2. 可为 `proposal` / `documentation` 增加 `pw` gallery 截图证据。
3. 可把 recipes 输出用于 validate warning hint，但需避免对 Agent 造成噪音。
