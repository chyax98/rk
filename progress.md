# Progress

## Status
In Progress

## Tasks
- [x] 评论系统重写：评论面板改为 `position: fixed` 浮层，文档宽度不再随面板开关变化
- [x] 删除错误布局规则：`.panel-open .rk-html-body { max-width: 600px; margin-left: 40px; margin-right: 0; }`
- [x] 评论角标系统：有评论的 anchor 自动设置 `data-comment-count`，CSS `::after` 显示数量
- [x] 评论编辑：评论卡片 hover 显示“编辑”，PATCH `text` 保存
- [x] 评论删除：评论卡片 hover 显示“删除”，二次确认后 PATCH `status: resolved`
- [x] 评论面板不影响主体：`.rk-layout` 改为 `display: block`，`.rk-comment-panel` fixed + transform 滑入

## Files Changed
- `apps/web/app/a/[id]/HtmlArtifactView.tsx`
- `apps/web/app/style.css`
- `apps/web/app/api/artifacts/[id]/comments/[commentId]/route.ts`
- `apps/web/lib/store.ts`

## Notes
- `context.md` / `plan.md` 在仓库根目录不存在，已按任务正文和实际代码执行。
- 当前工作区存在其他任务的未提交改动；本任务只提交评论系统相关文件。
