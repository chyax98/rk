# RenderKit 测试计划

状态：草案，可评审  
日期：2026-05-16

目标：给 RenderKit 后续迭代提供统一验证框架，避免“代码生成很快，但验证信号不可信”。本计划优先服务本地自用 Alpha，不追求企业级测试体系。

---

## 1. 测试目标

RenderKit 的核心风险不是单个函数错误，而是完整 Agent-to-UI loop 中任一环节失真：

```text
.rk.md source
→ validate
→ push
→ Web render
→ human comment
→ feedback
→ Agent edit
→ push new revision
```

测试计划要证明：

1. Agent 写出的 `.rk.md` 能被稳定校验。
2. 校验失败时，错误足够明确，Agent 能修。
3. push 后 Web 页面能正确渲染 artifact。
4. 人类评论能绑定到 block。
5. feedback 能带回 sourceRange/sourceExcerpt。
6. revision/comment/status 不因 UI/design/block 改动回退。
7. 视觉系统更新后，artifact 仍可读、可评论、可审阅。

---

## 2. 测试分层

### 2.1 DSL Validation Tests

验证 `.rk.md` parser / compiler / diagnostics。

覆盖：

- good examples validate 通过。
- bad fixtures validate 失败。
- error code 稳定。
- error location 有 file/line/column。
- block model 有 id/type/props/sourceRange/sourceExcerpt。

当前已有 bad fixtures：

```text
examples/fixtures/bad-id.rk.md
examples/fixtures/duplicate-id.rk.md
examples/fixtures/heading-directive.rk.md
examples/fixtures/missing-id.rk.md
examples/fixtures/paragraph-directive.rk.md
examples/fixtures/unknown-block.rk.md
```

后续新增 block 时必须新增对应 good/bad fixture。

### 2.2 CLI Smoke Tests

验证 Agent-facing CLI 不回退。

核心命令：

```bash
node packages/cli/bin/renderkit.mjs validate <file> --json
node packages/cli/bin/renderkit.mjs push <file> --json
node packages/cli/bin/renderkit.mjs status <file|artifactId> --json
node packages/cli/bin/renderkit.mjs feedback <file|artifactId> --json
node packages/cli/bin/renderkit.mjs server status --json
```

要求：

- stdout 在 `--json` 下必须是可解析 JSON。
- 失败时 exit code 非 0。
- 错误结构稳定，Agent 可读。
- `push --open --json` 不污染 stdout。

### 2.3 Store / Revision Tests

验证本地数据模型。

覆盖：

- 数据写入 `~/.renderkit/data`。
- 新 artifact 创建 rev 1。
- 再 push 创建新 revision。
- `status` 返回 currentRevision 和 comment counts。
- 删除 block 后，相关 comment 不丢失，进入 orphaned 或明确状态。
- resolved comment 不再作为 open feedback 返回。

### 2.4 Web Render Tests

验证 Browser artifact 页面。

覆盖：

- artifact 页面可打开。
- 所有 known block 渲染。
- 单 block 出错不白屏。
- Mermaid 正常渲染；Mermaid 错误局部显示。
- 每个 block 有可检查：
  - `data-block-id`
  - `data-block-type`
- comment button 可用。
- right rail 可创建评论。

### 2.5 Visual / Design Tests

验证视觉系统，不只看 build green。

覆盖：

- `dark-pro` 可读。
- `paper-light` 可读。
- `amber-terminal` 可读，不能出现黑字不可见或黑底突兀。
- block 层级清楚。
- comment affordance 清楚但不喧宾夺主。
- artifact 比普通 Markdown preview 更像产品产物。

这部分必须人工评审，不能完全自动化。

### 2.6 Agent Authoring Skill Tests

验证 Agent 是否会写 RenderKit。

覆盖：

- 给 Agent 一个任务：生成 decision brief。
- Agent 使用 `skills/renderkit-authoring/SKILL.md`。
- 生成 `.rk.md`。
- validate 通过。
- push 后可读。
- 若 validate 失败，Agent 能根据 error 修复。

这类测试是 RenderKit 特有的关键测试。

---

## 3. 当前基础回归命令

### 3.1 Good example

```bash
node packages/cli/bin/renderkit.mjs validate examples/plan.rk.md --json
```

期望：

- exit 0
- `.ok == true`
- blocks 包含 heading、paragraph、callout、decision-card、diagram
- 每个 block 有 sourceRange/sourceExcerpt

### 3.2 Bad fixtures

```bash
node packages/cli/bin/renderkit.mjs validate examples/fixtures/bad-id.rk.md --json
node packages/cli/bin/renderkit.mjs validate examples/fixtures/unknown-block.rk.md --json
node packages/cli/bin/renderkit.mjs validate examples/fixtures/missing-id.rk.md --json
node packages/cli/bin/renderkit.mjs validate examples/fixtures/duplicate-id.rk.md --json
node packages/cli/bin/renderkit.mjs validate examples/fixtures/heading-directive.rk.md --json
node packages/cli/bin/renderkit.mjs validate examples/fixtures/paragraph-directive.rk.md --json
```

期望：

| Fixture | Expected code |
|---|---|
| `bad-id.rk.md` | `RK_BLOCK_ID_INVALID` |
| `unknown-block.rk.md` | `RK_UNKNOWN_BLOCK_TYPE` |
| `missing-id.rk.md` | `RK_BLOCK_ID_REQUIRED` |
| `duplicate-id.rk.md` | `RK_DUPLICATE_BLOCK_ID` |
| `heading-directive.rk.md` | `RK_UNKNOWN_BLOCK_TYPE` |
| `paragraph-directive.rk.md` | `RK_UNKNOWN_BLOCK_TYPE` |

### 3.3 Server status

```bash
node packages/cli/bin/renderkit.mjs server status --json
```

期望：

- server running: exit 0, `{ ok: true }`
- server down: non-zero exit, valid JSON error

### 3.4 Push/status/feedback

```bash
node packages/cli/bin/renderkit.mjs push examples/plan.rk.md --json
node packages/cli/bin/renderkit.mjs status examples/plan.rk.md --json
node packages/cli/bin/renderkit.mjs feedback examples/plan.rk.md --json
```

期望：

- push exit 0，返回 artifactId/revision/url。
- status exit 0，返回 artifact/comment counts。
- feedback exit 0，返回 open/orphaned comments 列表。

### 3.5 Web build

```bash
pnpm --filter @renderkit/web build
```

期望：exit 0。

---

## 4. Visual Artifact System 新增测试

当 Visual Artifact System 实现后，新增测试。

### 4.1 Showcase validate

```bash
node packages/cli/bin/renderkit.mjs validate examples/alpha-showcase.rk.md --json
```

期望：

- exit 0
- model 包含 `theme`
- model 包含 `surface`
- blocks 包含 summary/code 等新增 block
- 所有 directive blocks 有 stable id

### 4.2 Showcase push

```bash
node packages/cli/bin/renderkit.mjs push examples/alpha-showcase.rk.md --open --json
```

期望：

- stdout 是可解析 JSON
- browser 打开不影响 stdout
- 页面显示 theme/surface

### 4.3 Theme visual check

至少检查：

- `dark-pro`
- `paper-light`
- `amber-terminal`

人工验收问题：

1. 文本是否可读？
2. block 层级是否清楚？
3. comment affordance 是否清楚？
4. amber 主题是否没有黑色不可见问题？
5. 页面是否比 Markdown preview 明显更像 artifact？

### 4.4 Block visual check

检查每种 block：

- heading
- paragraph
- summary
- callout
- decision-card
- code
- table（若实现）
- diagram

期望：

- 视觉一致。
- 有 `data-block-id` / `data-block-type`。
- 可评论。
- block 局部错误不影响全页。

---

## 5. Agent Authoring Skill 测试

### 5.1 Skill smoke

给 Agent 一个任务：

```text
使用 RenderKit 生成一份“认证模块重构 decision brief”，保存为 /tmp/auth-decision.rk.md。
```

要求 Agent 使用 `skills/renderkit-authoring/SKILL.md`。

验证：

```bash
node packages/cli/bin/renderkit.mjs validate /tmp/auth-decision.rk.md --json
```

期望：

- validate 通过。
- 包含 frontmatter title/surface/theme。
- 包含 stable ids。
- 至少包含 summary、decision-card、callout、code 或 diagram。

### 5.2 Feedback repair

流程：

1. push `/tmp/auth-decision.rk.md`。
2. Web 添加评论。
3. `feedback /tmp/auth-decision.rk.md --json`。
4. 让 Agent 根据 feedback 修改源文件。
5. 再 validate/push。

期望：

- Agent 不改无关 block id。
- 修改点对应 sourceRange/sourceExcerpt。
- 新 revision 正常生成。

---

## 6. 建议新增 `pnpm verify`

当前先不要求完整测试框架，但建议新增一个轻量验证脚本。

目标：一条命令跑本地关键回归。

建议：

```bash
pnpm verify
```

内部执行：

1. good examples validate。
2. bad fixtures validate 并检查 expected error code。
3. `pnpm --filter @renderkit/web build`。
4. 如果 server running，则可选跑 push/status/feedback smoke。

注意：

- `verify` 不应强依赖 browser。
- `verify` 不应要求 server 一定 running。
- push smoke 可独立命令，例如 `pnpm verify:smoke`。

---

## 7. Review 前检查清单

每次大模块实现完成后，先由主 session 跑：

```bash
git diff --stat
node packages/cli/bin/renderkit.mjs validate examples/plan.rk.md --json
node packages/cli/bin/renderkit.mjs validate examples/alpha-showcase.rk.md --json
pnpm --filter @renderkit/web build
```

如果 server running，再跑：

```bash
node packages/cli/bin/renderkit.mjs push examples/alpha-showcase.rk.md --open --json
node packages/cli/bin/renderkit.mjs status examples/alpha-showcase.rk.md --json
node packages/cli/bin/renderkit.mjs feedback examples/alpha-showcase.rk.md --json
```

然后再进入 reviewer。

---

## 8. 统一 Review 角度

大模块完成后再开 reviewer，不为小 bug 开 chain。

建议 reviewer 角度：

1. **Product/UI Review**
   - 是否像 artifact，而不是 Markdown preview。
   - theme/surface 是否有价值。
   - review chrome 是否清楚。

2. **DSL/Agent Review**
   - `.rk.md` 是否清晰。
   - errors 是否 Agent-fixable。
   - skill 是否足够指导 Agent。

3. **Architecture Review**
   - `packages/design` / `packages/blocks` / `apps/web` 边界是否清楚。
   - 是否过早引入复杂度。

4. **Regression Review**
   - CLI/Web/comment/feedback/revision 是否回退。

Review 输出只分三类：

- 必须修
- 可延后
- 忽略

---

## 9. 非目标

本测试计划暂不要求：

- CI。
- Playwright 全自动浏览器测试。
- screenshot diff。
- 单元测试框架大迁移。
- 覆盖率指标。
- 多浏览器矩阵。

这些后续可以加，但当前最重要是建立可信本地验证闭环。

---

## 10. 待确认

1. 是否现在就实现 `pnpm verify`。
2. 是否引入 Playwright 做最小浏览器 smoke。
3. Visual check 是否需要保存截图。
4. Agent skill 测试是否用独立临时文件还是 examples 下固定文件。
5. `verify:smoke` 是否允许写入 `~/.renderkit/data`。
