# @renderkit/web — Spec 导航

> Next.js 15 App Router 应用，端口 3737。本地优先的 Agent artifact 渲染 + 评论系统。

## 文件清单

| Spec | 内容 |
|------|------|
| [architecture.md](./architecture.md) | 架构概览：服务端/客户端分离、数据流、HTML 处理管线 |
| [conventions.md](./conventions.md) | 编码约定：命名、导入、类型风格 |
| [data-layer.md](./data-layer.md) | SQLite + store.ts 数据层模式 |
| [api-routes.md](./api-routes.md) | API Route 约定与错误格式 |
| [components.md](./components.md) | 组件模式：RSC vs 客户端、hooks、评论交互 |
| [quality.md](./quality.md) | 质量标准：lint（biome）、类型检查、无测试现状 |

## 快速参考

- **框架**: Next.js 15, App Router, React Server Components
- **数据库**: better-sqlite3（同步 SQLite），数据目录 `~/.renderkit/data/`
- **HTML 处理**: linkedom 解析 → anchor 标注 + shiki 代码高亮 → 存储
- **评论定位**: W3C TextQuoteSelector 标准，open/resolved/orphaned 三态
- **样式**: `@renderkit/design` CSS tokens，全局 `style.css`，无 Tailwind/CSS Modules
- **Lint**: biome，单引号，2 空格缩进，100 字符行宽
- **测试**: 暂无
