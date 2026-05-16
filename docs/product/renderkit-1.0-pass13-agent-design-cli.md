# RenderKit 1.0 第 13 轮飞轮：Agent 设计资源 CLI

状态：已实现并验证  
日期：2026-05-17

## 目标

用户要求 RenderKit 不只是漂亮页面，还要让 Agent 能通过积木式 `.rk.md` 产出优美方案文档；细节应在 CLI/server/Agent loop 中处理，页面只承载阅读和评论。本轮把已经分析、排序的外部设计资源和 surface recipes 暴露为 **Agent 可调用 CLI 能力**，减少 Agent 只能靠记忆或阅读长文档的风险。

## 改动

### 1. 设计资源变成机器可读 shared manifest

新增：

```text
packages/shared/src/design-assets.mjs
packages/shared/src/design-assets.d.ts
```

导出：

```text
DESIGN_RESOURCES
listDesignResources()
getDesignResource()
listDesignResourcePriorities()
```

覆盖用户指定的六个外部资源：

```text
md2html
html-anything
fireworks-tech-graph
thesvg
ui-ux-pro-max-skill
guizang-ppt-skill
```

每个资源包含：

```text
priority
repo
url
localPath
commit
primaryValue
integrationStatus
adoptedIn
recommendedUse
risks
```

### 2. CLI 新增 Agent planning commands

更新：

```text
packages/cli/bin/renderkit.mjs
packages/cli/package.json
```

新增命令：

```bash
renderkit recipes list --json
renderkit recipes show engineering-plan --json
renderkit design resources --json
renderkit design resources --priority P0 --json
renderkit design resource md2html --json
```

用途：

- `recipes`：让 Agent 在写 `.rk.md` 前选择 surface、block 结构和 anti-patterns。
- `design resources`：让 Agent 查询本地设计资产排序、集成状态和风险，不需要重新读长文档。

### 3. Authoring skill 更新

更新：

```text
skills/renderkit-authoring/SKILL.md
```

新增：

- `renderkit recipes ...` / `renderkit design resources ...` 使用说明。
- alias 表补齐 `metric -> stat`、`todo -> checklist`。
- 强调不要把外部 runtime 直接复制进 `.rk.md`；只吸收 deterministic 结构、token、排版和设计规则。

### 4. 新增 Agent-facing verifier

新增：

```text
scripts/verify-agent.mjs
```

新增 package script：

```json
{
  "verify:agent": "node scripts/verify-agent.mjs"
}
```

`pnpm verify` 已纳入该 gate。

## 验证

```bash
pnpm verify:agent
# Results: 26 passed, 0 failed
```

覆盖：

- recipes list 返回 5 个 surfaces。
- engineering-plan recipe 包含 summary/code/diagram 等推荐 blocks。
- design resources 返回 6 个用户指定资源。
- design resources 按 P0/P1/P2 排序。
- priority filter 只返回 P0。
- md2html resource 暴露 localPath/commit/integrationStatus。
- authoring skill 记录关键 alias 和 CLI commands。

## 取舍

- 没有引入新依赖。
- 没有把外部仓库 vendoring 进 runtime。
- 没有改变 Web 页面主视觉；这是 CLI/Agent 能力增强，符合“页面阅读优先、细节由 Agent/CLI 处理”。
- 设计资源 manifest 先做小型 deterministic metadata，不把大体积设计 DB 塞进包。

## 后续

1. 可以继续做 `renderkit design recommend --surface ...`，把 resource guidance 进一步变成推荐 block/template。
2. 可以让 `renderkit validate` 在发现 surface 时附带 recipe hint，但需要避免噪音。
3. 如果未来接入 icon helper，必须先处理 `thesvg` 的品牌/商标许可元数据。
