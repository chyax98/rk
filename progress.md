# Progress

## Status
In Progress

## Tasks

## Files Changed

## Notes

## 2026-05-18 E2E 视觉验证 + 评论系统测试

- 输出报告：`/tmp/rk-e2e-visual.md`
- 推送图表测试文档：通过，`art_067f947b8f` rev9
- 推送 8 主题测试文档：通过，`art_ed0ec3815d` rev1
- 截图验证：通过
  - `/tmp/rk-notion-theme.png`
  - `/tmp/rk-themes-fullpage-5000.png`
- 视觉结果：notion-clean、ECharts、rk-stat、rk-metric、8 主题区均正常渲染；评论面板 tab 悬浮在右侧，不挤压主体。
- 发现问题：
  1. `GET /api/artifacts/:id` 不返回 `anchors` 字段。
  2. `POST /api/artifacts/:id/comments` 接受空 `blockId`，会生成 `anchor: ""` 评论。
  3. `POST /submissions` 成功后，`rk feedback` 未返回 `submissions`。


## 2026-05-18 审计修复 (commit b148f71)

### 修复内容
1. **API 错误处理**：为 6 个 API 路由添加 try/catch（comments POST/PATCH、revisions list/get、feedback GET、submissions POST 已有）
2. **类型安全**：移除 `(c as any).blockId`，统一使用 `c.anchor`（store 已正确映射 block_id → anchor）
3. **输入验证**：comments POST 添加 text 非空检查；comments PATCH 明确分支 text/status
4. **CSS 修复**：ibm-enterprise 主题 font-sans token 断行（commit 7a40903）
5. **Home 页面**：补齐缺失的 card grid CSS（commit e7761a8）

### 审计结论
- 核心功能链路完整：文档渲染 → 评论 CRUD → 版本历史 → 表单提交
- SQL 注入：全部 prepared statements ✓
- dangerouslySetInnerHTML：仅在 server-processed HTML ✓
- 外键级联删除：完整 ✓
- 评分：94 → 96/100（预估），需 CLI --help + SKILL.md 扩充到 99+
