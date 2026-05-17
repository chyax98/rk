# CLI Rewrite — HTML-first Agent Loop

## 问题
CLI 当前引用了已删除的 `@renderkit/dsl` 和 `@renderkit/shared` 包，`push` 命令完全无法运行。整个 Agent 核心循环断裂。

## 目标

重写 `packages/cli/bin/renderkit.mjs`，支持 HTML-first 工作流。Agent 写 HTML → `rk push doc.html` 上传 → 人评论 → `rk feedback doc.html` 读取结构化 JSON → Agent 迭代。

## 命令设计

```bash
rk push <file.html>       # 上传/更新 artifact
  --open                  # 推送后打开浏览器
  --endpoint <url>        # 服务器地址，默认 http://localhost:3737

rk feedback <file.html>   # 获取所有 open 评论（JSON 输出，给 Agent 读）
  --json                  # 强制 JSON（默认就是）
  --format md             # Markdown 格式（人读）

rk open <file.html>       # 在浏览器中打开
rk status <file.html>     # 查看 artifact 状态
rk serve                  # 启动本地 web 服务器（`pnpm --filter web dev`）
```

## Lock 文件格式

`.rk-lock/<filename>.json`（文件名去掉 .html 后缀）：
```json
{
  "artifactId": "abc123",
  "url": "http://localhost:3737/a/abc123",
  "endpoint": "http://localhost:3737",
  "pushedAt": "2026-05-17T00:00:00Z"
}
```

## API 端点映射

- **首次 push**: `POST /api/artifacts` `{ html: "...", title: "..." }`
- **更新 push**: `POST /api/artifacts/:id/revisions` `{ html: "..." }`
- **获取评论**: `GET /api/artifacts/:id/comments`（status=open 筛选）
- **获取状态**: `GET /api/artifacts/:id`

## feedback 输出格式（JSON 默认）

```json
{
  "ok": true,
  "artifactId": "abc123",
  "comments": [
    {
      "id": "c1",
      "anchor": "section-2",
      "text": "这里的数据图表不够清晰",
      "status": "open",
      "createdAt": "..."
    }
  ],
  "summary": "2 条待处理评论"
}
```

## 去掉的内容

- `@renderkit/dsl` 引用（包已删除）
- `@renderkit/shared` 引用（包已删除）  
- `validate` 命令（HTML 不需要 validate）
- `surfaces`, `themes`, `blocks`, `aliases`, `errors` 命令（DSL-era）

## Acceptance Criteria

- [ ] `rk push hello.html` 成功上传，生成 `.rk-lock/hello.json`
- [ ] `rk push hello.html`（再次运行）更新已有 artifact
- [ ] `rk feedback hello.html` 返回评论 JSON
- [ ] `rk open hello.html` 打开浏览器
- [ ] `rk status hello.html` 返回状态
- [ ] 无 `@renderkit/dsl` 或 `@renderkit/shared` 引用
- [ ] `rk --help` 显示所有命令
