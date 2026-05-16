# RenderKit 1.0 第 15 轮飞轮：Design Recommend CLI

状态：已实现并验证  
日期：2026-05-17

## 目标

前两轮已经把 recipes 和外部设计资源变成 Agent 可查询的结构化数据。本轮进一步把这些数据组合成一个 **Agent authoring bundle**：Agent 在写 `.rk.md` 前只需调用一个命令，就能拿到 surface 对应的主题、推荐块、结构、反模式、相关设计资源、写作规则和验证命令。

这对应用户要求：细节在 CLI/server/Agent 侧处理，Web 页面继续阅读优先；Agent 通过积木式 `.rk.md` 生成优美方案文档。

## 改动

### 1. Shared recommendation API

更新：

```text
packages/shared/src/index.mjs
packages/shared/src/contracts.d.ts
```

新增：

```text
getDesignRecommendation(surface)
```

输出内容：

```text
surface
recipe
theme
blocks
structure
antiPatterns
suggestedFrontmatter
suggestedBlockOrder
designResources
authoringRules
validation
```

推荐逻辑是 deterministic 的：

- 基于 `RECIPES[surface]` 选择主题、推荐 blocks、结构和反模式。
- 基于本地 `DESIGN_RESOURCES` 选择相关设计资源。
- 默认纳入 `html-anything` 和 `md2html`，因为它们分别提供 Agent 反 slop 规则与阅读/打印/a11y 基础。
- 各 surface 再补充相关资源，例如 `documentation` 追加 `fireworks-tech-graph`，`engineering-plan` 追加 `ui-ux-pro-max-skill` 和 `fireworks-tech-graph`。
- 对包含 diagram 的 surface，把 `thesvg` 作为**风险可见的参考资源**纳入 recommend：只暴露用途和商标/许可风险，不提供 icon helper、下载、bundling 或 picker。

### 2. CLI 新增命令

更新：

```text
packages/cli/bin/renderkit.mjs
```

新增：

```bash
renderkit design recommend --surface documentation --json
```

示例验证：

```bash
node packages/cli/bin/renderkit.mjs design recommend --surface documentation --json | jq '.ok,.recommendation.theme,.recommendation.designResources[].id'
```

输出摘要：

```text
true
"editorial-kami"
"html-anything"
"md2html"
"fireworks-tech-graph"
"thesvg"
```

### 3. Authoring skill 更新

更新：

```text
skills/renderkit-authoring/SKILL.md
```

新增建议流程：

```bash
renderkit design recommend --surface documentation --json
```

Agent 可用该命令获得紧凑 authoring bundle，而不是每次阅读长文档或源码。

### 4. Verifier 更新

更新：

```text
scripts/verify-agent.mjs
```

新增检查：

- `design recommend documentation` 返回 `ok=true`。
- 返回主题 `editorial-kami`。
- 返回推荐 block `quote`。
- 返回相关设计资源 `md2html` / `html-anything`。
- diagram surface 会返回 `thesvg`，且必须带商标/许可风险。
- 返回 `suggestedFrontmatter`。
- 返回 `suggestedBlockOrder`。
- 返回 Agent validation command：`renderkit validate <file> --json`。
- Authoring skill 记录 `renderkit design recommend`。

## 验证

```bash
pnpm verify:agent
# Results: 45 passed, 0 failed
```

抽样命令：

```bash
node packages/cli/bin/renderkit.mjs design recommend --surface documentation --json | jq '.ok,.recommendation.theme,.recommendation.designResources[].id'
# true
# "editorial-kami"
# "html-anything"
# "md2html"
# "fireworks-tech-graph"
# "thesvg"
```

## 取舍

- 没有新增依赖。
- 没有引入 LLM 或不确定推荐；recommend 是 deterministic metadata bundle。
- 没有把外部设计 runtime 复制进 RenderKit；只把已经分析过的设计资产以推荐信息形式连接到 Agent workflow。
- `thesvg` 根据 worker scope review 只作为 risk-visible reference；当前不进入 runtime、不提供 icon helper。
- 仍保持 Web 页面只负责阅读和评论。

## 后续

1. 可以让 `renderkit validate` 在需要时输出 recipe hint，但默认不要增加噪音。
2. `thesvg` icon helper 根据 worker scope review 推迟：当前只作为 risk-visible reference，不进入 runtime。
3. `guizang` deck surface 仍是 future opt-in，不进入当前文档阅读主线。
