# RenderKit 1.0 第 21 轮飞轮：OG / Social Metadata

状态：已实现并验证  
日期：2026-05-17

## 背景

Completion audit 预审指出：阅读/评论核心已基本完备，但 Web metadata 过薄，只有 `title: RenderKit`，缺少 Open Graph / Twitter card / artifact-level dynamic metadata。虽然 RenderKit 是 local-first 工具，不以公开分享为核心，但完整产品代码库仍应该提供基础 social preview 和文档标题语义。

## 改动

新增：

```text
apps/web/public/renderkit-og.svg
```

更新：

```text
apps/web/app/layout.jsx
apps/web/app/a/[id]/page.jsx
scripts/verify.mjs
```

## 能力

Root layout 现在声明：

- `metadataBase`
- default/template title
- description
- applicationName
- Open Graph website metadata
- Twitter large image card
- shared OG image `/renderkit-og.svg`

Artifact page 现在声明 `generateMetadata()`：

- 读取 artifact 当前或指定 revision。
- 使用 artifact title 生成页面 title。
- 从 summary/paragraph/callout/decision/quote 等 block 中提取 180 字内 description。
- 输出 article Open Graph metadata 和 Twitter card。

## Verification gate

`pnpm verify` 新增 Web metadata 静态断言：

- root layout declares metadataBase
- root layout declares Open Graph metadata
- root layout declares Twitter card metadata
- artifact page generates dynamic metadata
- artifact page metadata uses artifact title
- OG image asset exists

验证结果：

```bash
pnpm verify
# Results: 231 passed, 0 failed

# With local dev server and pushed alpha-showcase artifact:
curl http://localhost:3737/a/<artifact>?rev=<rev> | grep -E 'og:title|twitter:card|renderkit-og.svg'
# <meta property="og:title" content="RenderKit Alpha Showcase"/>
# <meta property="og:image" content="http://localhost:3737/renderkit-og.svg"/>
# <meta name="twitter:card" content="summary_large_image"/>
```

## 边界

- OG image 是 deterministic local SVG asset，不引入远程服务或动态图片生成。
- local-first 场景下 `metadataBase` 指向 `http://localhost:3737`。
- 当前不做 per-artifact dynamic OG image；需要时可在 2.0 增加本地 image route。
