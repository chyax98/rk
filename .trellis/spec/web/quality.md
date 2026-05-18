# 质量标准

## 当前基线（2026-05-18）

已验证通过：

- `pnpm run test` → `63/63` 通过
- `cd apps/web && pnpm exec tsc --noEmit --pretty false` → 无错误
- `pnpm --filter @renderkit/web build` → 通过
- `curl -s http://localhost:3737/api/health` → `{ ok: true, name: 'renderkit', version }`

## 工具链

### Lint / Format
- 工具：Biome
- 主要命令：
  ```bash
  pnpm biome:check
  pnpm format
  ```

### 类型检查
- 工具：TypeScript 6
- 命令：
  ```bash
  cd apps/web && pnpm exec tsc --noEmit --pretty false
  ```

### 构建
- 工具：Next.js App Router
- 命令：
  ```bash
  pnpm --filter @renderkit/web build
  ```

### 测试
- 默认测试脚本：
  ```bash
  pnpm run test
  ```
- 当前覆盖：
  - `tests/comment-anchor.test.ts`
  - `tests/html-processor.test.ts`
  - `tests/wc-render.test.ts`
  - `tests/cli.test.ts`

## 当前覆盖到的关键链路

1. HTML body 剥离 / hydration 修复
2. anchor 生成确定性
3. comment anchor contract（只接受 `anchor`，旧 `blockId` 拒绝）
4. anchor 删除 → comment `orphaned`
5. CLI `push → status → feedback` 闭环
6. 24 WC 基础渲染
7. web 构建与健康检查

## 仍需关注的风险

1. **Repo 级 Biome 债务仍存在**
   - `pnpm biome:check` 在 packages/components、public CSS/JS、CLI 等目录仍有历史警告/格式问题
   - 不阻塞当前 web build / test，但会影响统一质量门禁

2. **API route 级直接测试仍偏少**
   - 当前更多依赖 CLI 集成测试和 store/route 直调
   - 还缺少更系统的 Next Route Handler 集成测试

3. **视觉回归仍以人工截图为主**
   - 当前有 smoke / browser verify 脚本与人工截图证据
   - 但还没有稳定的自动截图 diff 基线

## 下一期建议优先级

### P0
- 清理 repo 级 Biome 债务，收敛到可作为统一 CI gate

### P1
- 增加 route/store 级测试，尤其是 comments / revisions / submissions 的错误分支

### P2
- 建立自动化视觉回归（重点：图表、Mermaid、评论 overlay、8 主题）
