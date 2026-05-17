# RenderKit Progress

## 当前状态：HTML-first 重构完成

**分支**: develop (worktree: /Users/xd/Worker/tools/RenderKit-dev)  
**Baseline tag**: baseline-html-wc-v1 @ master  
**Server**: http://localhost:3737

## 已完成

- [x] TypeScript 全面迁移（packages/shared/dsl/blocks/cli/scripts）
- [x] HTML-first 架构（Agent 写 HTML + WC，无 DSL 编译）
- [x] 21 个 Web Components（Light DOM，45KB bundle）
- [x] Server：linkedom anchor 注入 + Shiki 代码高亮
- [x] DB：anchors 表，HTML 存储路径
- [x] CLI：push/feedback/patch/append/anchors/components
- [x] 评论系统：右侧气泡 rail + 固定面板
- [x] rk-grid DOM-move 修复（无双重渲染）
- [x] 气泡 Y 坐标跟随 block 定位
- [x] 文档清理（删除 DSL 时代文档）
- [x] Git worktree 规范（develop 分支隔离开发）

## 待完成

- [ ] E2E Agent 闭环测试（push → 评论 → feedback → 修改）
- [ ] rk-3d / rk-chart CDN 加载验证（需真实浏览器含网络访问）
- [ ] examples/ HTML 格式示例完善
