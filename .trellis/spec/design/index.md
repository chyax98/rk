# @renderkit/design — 设计系统 Spec

纯 CSS 设计系统包。零 JS、零构建。通过 CSS Custom Properties 提供 token、主题和组件样式。

## 文件结构

```
packages/design/
├── package.json          # 6 个 CSS 导出点
└── src/
    ├── index.css         # 总入口（@import 其他 5 个文件）
    ├── tokens.css        # 基础 token：spacing/radius/typography/shadow/motion/z-index/icon/accessibility/print/border/opacity/density
    ├── themes.css        # 语义 token per theme：color/accent/status/chrome/button/code/scrollbar
    ├── surfaces.css      # Surface 布局：文档类型适配（engineering-plan/decision-brief/runbook 等）
    ├── blocks.css        # 组件块样式：heading/paragraph/callout/code/table/image/tabs/stat/timeline/comparison 等
    └── chrome.css        # App 级布局：shell/topbar/sidebar/rail/content/buttons/mobile
```

## 导出

```json
{
  "./tokens.css": "./src/tokens.css",
  "./themes.css": "./src/themes.css",
  "./surfaces.css": "./src/surfaces.css",
  "./blocks.css": "./src/blocks.css",
  "./chrome.css": "./src/chrome.css",
  "./index.css": "./src/index.css"
}
```

消费者通常只需 `@import "@renderkit/design/index.css"`。可按需单独导入子模块。

## Spec 文档

| 文档 | 内容 |
|---|---|
| [architecture.md](./architecture.md) | 分层架构与数据流 |
| [tokens.md](./tokens.md) | Token 命名规范、分类、使用规则 |
| [theming.md](./theming.md) | 主题系统、如何添加新主题 |
| [component-css.md](./component-css.md) | 组件 CSS 编写规范、BEM 变体、与 components 包协作 |

## 核心约束

- **纯 CSS**：不允许 JS、不允许构建步骤、不允许 PostCSS 插件
- **无外部依赖**：不引入 npm 包
- **变量优先**：所有可变值必须是 `--rk-*` custom property，禁止硬编码颜色/尺寸
- **分层导入顺序**：tokens → themes → surfaces → blocks → chrome（`index.css` 中的 @import 顺序）
