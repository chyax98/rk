# RenderKit 1.0 第 11 轮飞轮：自动化浏览器回归验证

状态：已实现并验证  
日期：2026-05-17

## 目标

用户明确要求最终必须使用 `pw -h` / `pw` CLI 做真实交互验证，且不能只依赖代理信号。本轮把此前手工 `pw` 验证沉淀为可重复执行的浏览器回归脚本，避免后续阅读/评论体验出现假绿。

## 改动

新增脚本：

```text
scripts/verify-browser.mjs
```

新增 package script：

```json
{
  "verify:browser": "node scripts/verify-browser.mjs"
}
```

截图证据：

```text
.pw-evidence/verify-browser-diagram.png
```

## 覆盖范围

`pnpm verify:browser` 会执行真实浏览器交互，而不是只做静态检查。

覆盖项：

1. `pw -h` 可用，并确认是 Agent-first Playwright CLI。
2. 自动确认 `http://localhost:3737/api/health`；如果没有运行 Web server，则启动 `pnpm --filter @renderkit/web dev`。
3. 用 CLI push `examples/capabilities/product-system.rk.md`。
4. 通过 API 种下 open / resolved 两类评论。
5. Reading mode 验证：
   - `.rk-floating-tools` 文案仍是轻量的 `Review☰💬⎘`。
   - `Tab` 后 `.rk-skip-link:focus` 存在。
6. Review mode 验证：
   - 切换 review mode。
   - `.rk-comment-filters button` 数量为 4。
   - 默认 open 筛选显示 open comment。
   - 点击 `已解决` 后显示 resolved comment。
   - block 上存在 `data-rk-comment-status="open"` 侧边状态标记。
7. Diagram visual language 验证：
   - push `examples/capabilities/diagram-visual-language.rk.md`。
   - 页面渲染 `.rk-diagram-svg svg`。
8. 浏览器诊断：
   - `pw errors --output=json` 返回 0 个 page error。
   - 保存 screenshot 到 `.pw-evidence/verify-browser-diagram.png`。

## 验证结果

```bash
pnpm verify:browser
```

输出：

```text
Results: 37 passed, 0 failed
ALL GOOD
```

关键证据：

```text
✓ pw -h exits successfully
✓ pw -h is the agent-first Playwright CLI
✓ reading toolbar stays minimal
✓ skip link is keyboard-focusable
✓ comment filter exposes four statuses
✓ default filter shows open comment
✓ resolved filter shows resolved comment
✓ review mode marks blocks with open comment status
✓ diagram visual language renders inline SVG
✓ browser has no captured page errors
✓ browser screenshot exists
```

## 设计取舍

- 没有新增 `@playwright/test` 或其他重型测试依赖；脚本直接复用用户要求的 `pw` CLI。
- 截图只作为证据，不作为唯一断言；主要通过 DOM fact、错误诊断和 API 种子数据做确定性断言。
- 脚本会在需要时启动本地 Web server，结束后清理它启动的进程；如果外部已有 server，则复用，不强制接管。
- 使用短 session name，避免 `pw` 的 16 字符限制。

## 后续

1. 可以把 `pnpm verify:browser` 纳入最终发布前 gate。
2. 后续新增 block 或评论能力时，应补充到该脚本，而不是只留手工 screenshot。
3. TypeScript contracts 仍是后续架构硬化事项；本轮不引入迁移范围。
