# 编码约定

## 导入风格

- **单引号**，trailing commas，分号必加（biome 强制）
- **导入路径带 `.ts` 扩展名**：`import { getDb } from './db.ts'`（`tsconfig` 启用了 `allowImportingTsExtensions`）
- **npm 包无扩展名**：`import Database from 'better-sqlite3'`
- **跨包引用**：`import { BlockFrame } from '@renderkit/blocks'`

## 类型风格

### 服务端数据层

- **DB 行类型**：`Db*` 接口，snake_case 字段，匹配 SQLite 列名
  ```ts
  interface DbArtifact {
    id: string;
    current_revision: number;
    created_at: string;
  }
  ```
- **运行时模型**：导出的 `PascalCase` 接口，camelCase 字段，通过 `rowTo*` 映射函数转换
  ```ts
  export interface ArtifactMeta {
    id: string;
    currentRevision: number;
    createdAt: string;
  }
  ```
- **联合返回**：操作函数返回 `{ ok: true, comment } | { ok: false, status, error }` 模式
  ```ts
  return { ok: false as const, status: 404, error: 'artifact not found' };
  ```

### 客户端

- Props 接口内联在组件参数中，不单独导出（除非被复用）
- `any` 类型允许在旧格式（block model）中使用，HTML 格式使用具体类型
- Next.js `params` 类型为 `Promise<{ id: string }>`（Next.js 15 async params）

## 命名

| 类别 | 规则 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `CommentCard.tsx`, `ReviewPanel.tsx` |
| Hook 文件 | camelCase, `use` 前缀 | `useComments.ts`, `useReviewState.ts` |
| 工具函数文件 | kebab-case | `html-processor.ts`, `anchor-diff.ts` |
| CSS 类名 | `rk-` 前缀, BEM 风格 | `rk-comment-card__anchor-text` |
| data 属性 | `data-rk-*` | `data-rk-anchor`, `data-rk-theme`, `data-rk-surface` |
| DB 表名 | 复数 snake_case | `artifacts`, `revisions`, `comments`, `anchors` |
| ID 生成 | 类型前缀 + 随机 hex | `art_`, `cmt_`, `anc_` + 10 hex chars |
| store 函数 | 动词开头 | `listArtifacts`, `getArtifact`, `pushHTML`, `addComment` |
| API 响应 | `{ ok: boolean, ... }` | `{ ok: true, artifact }` / `{ ok: false, error }` |

## 文件组织

```
app/a/[id]/
├── page.tsx              # 服务端入口，generateMetadata + 渲染
├── ArtifactView.tsx      # 客户端视图（旧格式）
├── HtmlArtifactView.tsx  # 客户端视图（HTML 格式）
├── lib.ts               # 工具函数：flattenBlocks, blockLabel, copyToClipboard
├── hooks/               # 自定义 hooks，每个文件一个 hook
└── components/          # UI 子组件，每个文件一个组件
```

## 异步模式

- **store 函数声明为 `async` 但内部是同步 SQLite 调用**。这是有意为之，预留异步存储切换空间：
  ```ts
  export async function listArtifacts(): Promise<ArtifactMeta[]> {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM artifacts ...').all();
    return rows.map(rowToArtifact);
  }
  ```
- **客户端用 `useCallback` 包裹 API 调用**，依赖数组包含相关 state

## 禁止模式

- ❌ 不要在客户端组件中直接 import `lib/store.ts`（store 只在服务端/RPC 边界使用）
- ❌ 不要使用 `getServerSideProps` / `getStaticProps`（App Router 用 RSC 替代）
- ❌ 不要创建 CSS Modules / Tailwind 类名（项目使用 CSS tokens + BEM）
- ❌ 不要引入新的全局状态管理库（评论状态通过 props + fetch 更新）
