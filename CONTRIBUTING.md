# Contributing to RenderKit

## 开发环境

```bash
# 前置：Node 24+, pnpm 9+
node --version   # >= 24.0.0
pnpm --version   # >= 9.0.0

pnpm install
pnpm dev         # 启动 Next.js dev server
```

## CLI 开发

```bash
# 直接运行（Node 24 strip-types，无需编译）
node packages/cli/bin/renderkit.mjs validate examples/alpha-showcase.rk.md
node packages/cli/bin/renderkit.mjs --help

# 或通过 pnpm script
pnpm renderkit validate examples/alpha-showcase.rk.md
```

## 验证

```bash
pnpm verify:contracts    # 76 个合约检查（DSL/renderer/store 对齐）
pnpm ci                  # CI 等价命令
```

## 添加新 Block 类型

1. **shared**: 在 `packages/shared/src/contracts.ts` 的 `BLOCK_TYPES` 加入新 type
2. **dsl**: 在 `packages/dsl/src/compilers/` 新建 `myblock.ts`，导出 `compileMyblock`
3. **dsl**: 在 `packages/dsl/src/compilers/index.ts` 的 `BLOCK_COMPILERS` 注册
4. **blocks**: 在 `packages/blocks/src/MyblockBlock.tsx` 新建 React 组件
5. **blocks**: 在 `packages/blocks/src/registry.tsx` 注册
6. **examples**: 在 `examples/capabilities/` 加 fixture
7. **verify**: 运行 `pnpm verify:contracts` 确认 76/76

## 添加新 DSL 属性

修改对应 compiler 文件，使用 `packages/dsl/src/attrs.ts` 里的 coerce helpers：

```ts
import { coerceBool, coerceNumber, coerceEnum } from '../attrs.ts';

const hidden = coerceBool(attrs.hidden, false);
const cols = coerceNumber(attrs.cols, 1, 1, 12);
const profile = coerceEnum(attrs.profile, TABLE_PROFILES, 'matrix');
```

## 文件结构约定

- 所有 import 路径必须带 `.ts` / `.tsx` 扩展名（Node strip-types 要求）
- `packages/` 内部相对 import：`from './helpers.ts'`（有扩展名）
- 跨包 import：`from '@renderkit/shared/contracts'`（package exports 解析）
- 禁止 `.mjs` / `.jsx` / `.js` 源文件（只有 `bin/renderkit.mjs` 是 bin 壳）

## CSS 约定

- 所有样式变量通过 `--rk-*` CSS custom properties
- 组件 class 前缀 `.rk-`
- 新组件样式追加到 `apps/web/app/style.css`
- 不引入 Tailwind / antd / material-ui

## Git 约定

```
feat:     新功能
fix:      bug 修复
refactor: 重构（无功能变化）
docs:     文档更新
chore:    构建/工具链变化
```
