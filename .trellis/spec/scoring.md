# RenderKit 质量评分标准

> 当前实现的评分真值来源：`scripts/score.ts`
> 最新快照文件：`score-report.json`
> 更新时间：2026-05-18

## 最新结果

- 总分：`99/100`
- 等级：`S（卓越）`

### 各维度

| 维度 | 当前分数 | 依据 |
|---|---:|---|
| 渲染质量 | 20/20 | 24 WC、4 图表引擎、Kroki SSR、ECharts、HTML processor |
| 设计系统 | 20/20 | 8 主题、132 tokens、WC CSS、Mermaid 主题感知 |
| CLI 成熟度 | 19/20 | push / feedback / open / status / serve、锁文件、错误处理、Markdown 输出 |
| 测试覆盖 | 20/20 | 4 个测试文件、3 个 test HTML、4 个 verify 脚本 |
| 生产就绪 | 20/20 | skip link、`lang=zh-CN`、打印样式、health、DB 安全创建、架构文档 |

## 推荐验证命令

```bash
pnpm run test
cd apps/web && pnpm exec tsc --noEmit --pretty false
pnpm --filter @renderkit/web build
node --experimental-strip-types scripts/score.ts
curl -s http://localhost:3737/api/health
```

## 99 → 100 的现实候选

当前 1 分缺口来自 CLI 维度。
按 `scripts/score.ts` 的实现，CLI 命令覆盖位给了 6 分，但当前命令集合是：

- `push`
- `feedback`
- `open`
- `status`
- `serve`

也就是 5 个命令，拿到 `5/6` 的命令覆盖分。

### 下一期可选方向

1. **补一个真正有价值的第 6 个 CLI 命令**
   - 例如：`review` / `doctor` / `verify`
   - 要求不是为了凑分，而是能改善 agent 回路

2. **或者调整评分脚本口径**
   - 如果产品定义上 CLI 核心命令就是 5 个，应把脚本改成与产品定义一致

## 下一期任务建议（基于当前仓库证据）

### P0: 统一质量门禁
- 目标：让 `pnpm biome:check` 也能通过
- 依据：当前 repo 仍有 packages/components、CLI、public CSS/JS 的历史 Biome 债务

### P1: 更深的测试覆盖
- 目标：补 Route Handler / store 错误分支测试
- 依据：当前虽然已有 63 tests，但 direct route coverage 仍不如 CLI / processor / WC 强

### P2: 视觉回归自动化
- 目标：把图表 / Mermaid / 评论 overlay / 8 主题纳入稳定 screenshot baseline
- 依据：目前验证仍主要依赖人工截图与 smoke/browser verify
