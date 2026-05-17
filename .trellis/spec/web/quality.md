# 质量标准

## Lint & 格式化

**工具**: biome（非 ESLint/Prettier）
**配置**: 根目录 `biome.json`

### 格式化规则
- 缩进：2 空格
- 行宽：100 字符
- 引号：单引号
- 尾逗号：all
- 分号：always
- Import 自动排序：`assist.actions.source.organizeImports: "on"`

### Lint 规则（全部 warn 级别）

| 类别 | 规则 | 说明 |
|------|------|------|
| correctness | `noUnusedImports`, `noUnusedVariables` | 清理死代码 |
| suspicious | `noConsole`, `noExplicitAny`, `noAssignInExpressions` | 代码质量 |
| security | `noDangerouslySetInnerHtml` | 允许但 warn，需 biome-ignore 注释 |
| style | `noNonNullAssertion` | 减少运行时风险 |
| a11y | `useButtonType`, `noStaticElementInteractions` 等 | 无障碍基础 |
| complexity | `useOptionalChain`, `useLiteralKeys` | 简化代码 |

### 运行命令
```bash
npx biome check apps/web/
npx biome format --write apps/web/
npx biome lint apps/web/
```

## 类型检查

**工具**: TypeScript 6.0.3
**配置**: `apps/web/tsconfig.json`

### 关键设置
- `strict: true`
- `noEmit: true`（Next.js 负责编译）
- `allowImportingTsExtensions: true`（导入路径带 `.ts`）
- `moduleResolution: "bundler"`
- `jsx: "react-jsx"`
- `skipLibCheck: true`

### 运行命令
```bash
npx tsc --noEmit --project apps/web/tsconfig.json
```

## 测试

**当前状态：无测试**

项目没有测试文件，没有测试框架配置，没有 test script。

### 已知风险

1. **store.ts** 的 CRUD 逻辑无覆盖，schema 变更容易破坏
2. **html-processor.ts** 的 anchor 生成逻辑依赖 DOM 结构，无回归保护
3. **API routes** 无集成测试
4. **客户端 hooks** 无单元测试

### 添加测试的建议方向

优先级排序：
1. `lib/store.ts` — 数据层是核心，测试 pushHTML/comment lifecycle
2. `lib/html-processor.ts` — 输入/输出明确，容易单元测试
3. `api/` routes — Next.js 15 route handler 测试需要 `next/test/server`
4. hooks — 需要 React Testing Library

## 构建验证

```bash
# 完整验证流程
npx biome check apps/web/                    # lint + format
npx tsc --noEmit -p apps/web/tsconfig.json   # 类型检查
npx next build                               # 生产构建（验证 SSR/RSC 正确性）
```

## 常见问题

### dangerouslySetInnerHTML
必须加 biome-ignore 注释，且 HTML 必须经过服务端 `processHTML()` 处理：
```tsx
{/* biome-ignore lint/security/noDangerouslySetInnerHtml: server-processed HTML */}
```

### Next.js 15 async params
所有 route handler 和 page 的 `params` 必须用 `Promise<{ id: string }>` 类型并 await：
```ts
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

### SQLite 同步 API
store 函数标记 `async` 但内部同步。调用方用 `await` 保持一致性，但不要在事务内加 `await`。
