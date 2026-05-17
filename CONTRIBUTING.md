# Contributing to RenderKit

## 开发环境

```bash
# 前置：Node 24+, pnpm 9+
node --version   # >= 24.0.0
pnpm --version   # >= 9.0.0

# 安装依赖（在主 worktree 或 dev worktree）
pnpm install --ignore-scripts
```

## 工作流

```bash
# 所有开发在 develop branch（dev worktree）
cd /Users/xd/Worker/tools/RenderKit-dev

# 启动 server（另一个终端）
pnpm dev  # 或 rk serve

# 开发 → commit → push → master merge
LEFTHOOK=0 git add -A
LEFTHOOK=0 git commit -m "feat: ..."
git push origin develop

# 合并到 master
cd /Users/xd/Worker/tools/RenderKit
git merge origin/develop --no-ff -m "merge: ..."
git push origin master
```

## 重建 Bundle

24 个 WC 的 bundle（改动 `packages/components/` 后需重建）：

```bash
npx esbuild packages/components/src/bundle.ts \
  --bundle --format=esm \
  --outfile=apps/web/public/rk/components.js \
  --resolve-extensions=.ts,.tsx,.js \
  --loader:.ts=ts \
  --platform=browser
```

## 添加新 Web Component

1. 创建 `packages/components/src/elements/rk-xxx.ts`
2. 在 `packages/components/src/bundle.ts` 中 `import './elements/rk-xxx.ts'`
3. 重建 bundle
4. 在 `.pi/skills/renderkit-author/SKILL.md` 中添加用法文档

**关键约定**：
- Light DOM（无 shadow DOM）
- 用 `_raw` 缓存 `textContent`（在 `connectedCallback` 首次读取，`this.innerHTML = ...` 之前）
- CSS 用 `var(--rk-*)` 语义 token，不硬编码颜色
- 子元素用显式关闭标签（Custom Elements 不支持自闭合）

## 调试

```bash
# 健康检查
curl http://localhost:3737/api/health

# 测试推送
rk push examples/hello.html --open

# 获取评论
rk feedback examples/hello.html
```
