# @renderkit/cli

Push HTML artifacts to a RenderKit server, read feedback, drive the
agent ↔ human close-loop.

## 安装（仓库内自用）

```bash
# 工作区已自动装好；仓库根目录直接：
pnpm renderkit --help

# 或者全局可调（symlink 到 ~/.local/bin）：
cd packages/cli && pnpm link --global
renderkit --help
rk --help
```

## 配置 endpoint

CLI 默认指向 `http://localhost:3737`（dev 模式）。

```bash
# 临时切换
RENDERKIT_ENDPOINT=https://your-server rk feedback doc.html

# 永久切换（写 shell rc）
export RENDERKIT_ENDPOINT=https://your-server
```

每个命令也接受 `--endpoint <url>` 覆盖。

## 命令一览

| 命令 | 作用 |
|---|---|
| `rk push <file>` | 推送 / 更新 artifact。`--author agent` 标记来源，`--test` 进沙盒，`--open` 打开浏览器 |
| `rk feedback <file>` | 拉评论 thread + `waitingFor` + form submissions + render errors |
| `rk reply <file> <cid> <text>` | 回复评论（默认 author=agent） |
| `rk address <file> <cid>` | 标 addressed，等人验收 |
| `rk resolve <file> <cid>` | 解决（agent 自验通过） |
| `rk reopen <file> <cid>` | 重开 |
| `rk validate <file>` | 离线校验 HTML / WC 使用 |
| `rk doctor` | CDN 探活 / 服务端可达性 |
| `rk components` | 列出当前 registry 已覆盖的组件，以及源码里已注册但尚未补完描述的组件 |
| `rk open <file>` | 浏览器打开 artifact |

## 闭环示例

```bash
# Agent 推送
rk push report.html --author agent --open

# 人评论后，agent 拉反馈
rk feedback report.html
#   → comments[].waitingFor: 'agent'  ← 该处理
#   → comments[].waitingFor: 'human'  ← 已回复，等验收

# Agent 回复 + 标 addressed
rk reply report.html cmt_xxx "已修复"
rk address report.html cmt_xxx

# 改完重推
rk push report.html --author agent
```

## 锁文件

每次 push 会写 `<同目录>/.rk-lock/<basename>.json`，记录 artifactId
和 server endpoint。后续 `feedback / reply / address / resolve / reopen
/ open` 都从锁文件解析目标。

锁文件已 gitignore，**不要 commit**。
