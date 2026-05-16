# RenderKit Alpha 决策记录

状态：已确认  
日期：2026-05-16

---

## 1. 发布形态

### 决策

Alpha 阶段不发布 npm 包，不做全局安装，不考虑外部用户分发。

当前只做本地源码工具：

```bash
cd ~/Worker/tools/RenderKit
pnpm dev
node packages/cli/bin/renderkit.mjs push examples/plan.rk.md --open
```

### 理由

- 当前目标是自用验证和本地工作流，不是发包。
- 不需要现在解决 npm package、workspace dependency、Next app bundling、跨机器安装问题。
- 先把本地能力做稳，再考虑未来是否单包发布。

### 后续可能

未来如果确实要发包，再评估单包 `renderkit`：CLI + server bundled。

---

## 2. Server Start

### 决策

Alpha 阶段 `renderkit server start` 可以直接启动本地源码里的 Next.js server。

当前可接受实现：

```bash
pnpm --filter @renderkit/web dev
```

或者 CLI 包装：

```bash
renderkit server start
```

### 说明

“通过一个包直接启动 Next.js 服务”理论上可以，但比当前目标复杂：

- 需要把 Next app build 产物和 server entry 一起打包。
- 需要处理 `next start` / standalone output / static assets 路径。
- 需要确认全局安装后的运行目录、数据目录、端口、资源路径。

Alpha 不解决这个问题。先保证源码 checkout 下能启动。

---

## 3. 数据目录

### 决策

数据放用户全局目录：

```text
~/.renderkit/data
```

不做项目目录 `.renderkit-data`。
不做复杂 env 配置。

### 理由

- RenderKit 是本地自用工具，不是每个项目独立部署。
- 全局数据目录便于 server 和 CLI 一致访问。
- 避免 cwd 导致 `.data` 分散在不同目录。

### 后续改造

当前代码仍用 `process.cwd()/.data`，需要改成：

```text
/Users/xd/.renderkit/data
```

实现上应使用 `os.homedir()` 计算。

---

## 4. 评论范围

### 决策

Alpha 阶段可以允许任意 block 评论。

包括：

- heading
- paragraph
- callout
- decision-card
- diagram

### 风险

heading/paragraph 当前 id 是自动生成：

```text
heading-1
paragraph-1
```

如果源文件插入内容，id 可能漂移，评论锚点可能不稳定。

### 暂定接受

Alpha 阶段接受该风险，先验证评论反馈闭环。

后续如果锚点漂移明显，再收紧规则：只允许显式 id directive block 评论。

---

## 5. Unknown Block 策略

### 决策

新 `.rk.md` 文档中出现 unknown block：validate 失败。

理由：

- Agent 需要明确知道哪里写错。
- 不应默默渲染出奇怪页面。
- Alpha 阶段 block catalog 有限，严格失败更利于修正。

### 历史兼容

未来如果已有历史 artifact 中出现旧 block，而新 renderer 不认识，可以用 `UnknownBlock` fallback。

即：

```text
新输入：validate fail
历史数据：render fallback
```

---

## 6. 当前 Alpha 优先级

1. 本地源码模式跑稳。
2. CLI + server + feedback 闭环稳。
3. 数据目录迁移到 `~/.renderkit/data`。
4. Web UI 接入 design token。
5. 增加少量 block。
6. 暂不考虑发包、部署、MCP、Docker。
