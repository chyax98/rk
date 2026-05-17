# RenderKit HTML + Web Components 改造全方案

> 状态：设计阶段 | 日期：2026-05-17

---

## 一、变化总览

```
现在：Agent 写 .rk.md → DSL 编译 → React 渲染 → 人看
将来：Agent 写 .html + <rk-*> → Server 注入锚点 → 浏览器渲染 → 人看
```

**保留**：评论系统、版本追踪、SQLite、CLI 框架  
**重写**：packages/components（Web Components 替 React blocks）、Server HTML 处理路径  
**删除**：packages/dsl、packages/blocks、BLOCK_TYPES 常量体系  

---

## 二、文件树变化

### 新增

```
packages/
  components/                    ← 新包（11个 Web Components）
    src/
      elements/
        rk-callout.ts
        rk-chart.ts
        rk-checklist.ts
        rk-code.ts
        rk-comparison.ts
        rk-decision.ts
        rk-diagram.ts
        rk-stat.ts
        rk-summary.ts
        rk-table.ts
        rk-timeline.ts
      css/
        theme.css                ← CSS custom properties 主题
        components.css           ← 所有组件样式（无 shadow DOM）
      prerender/
        code.ts                  ← Shiki server-side 预渲染
        diagram.ts               ← Mermaid server-side 预渲染
      anchor.ts                  ← data-rk-anchor 注入器
      bundle.ts                  ← 打包入口（给浏览器用的 JS）
      index.ts                   ← Node 导出（给 Server 用）
    package.json
    tsconfig.json

apps/web/
  app/api/artifacts/
    route.ts                     ← 新增 HTML 接收分支
  app/api/artifacts/[id]/
    patch/route.ts               ← 新增 fragment patch API
  app/a/[id]/
    HTMLArtifactView.tsx         ← 新增 HTML artifact 渲染页
  lib/
    html-processor.ts            ← anchor 注入 + 预渲染（linkedom）
    anchor-diff.ts               ← anchor 列表 diff（孤儿评论检测）
```

### 修改

```
apps/web/lib/db.ts               ← schema 加 format 列、anchors 表
apps/web/lib/store.ts            ← 新增 pushHTML() / patchHTML()
apps/web/app/a/[id]/page.tsx     ← 按 format 路由到不同 View
packages/cli/src/index.ts        ← 删 7 个命令，加 components/patch/append
packages/cli/src/commands/push.ts ← 自动检测 .html vs .rk.md
```

### 删除（分阶段）

```
packages/dsl/                    ← Step 4 删
packages/blocks/                 ← Step 4 删
scripts/verify-contracts.ts      ← Step 4 简化
packages/cli/src/commands/
  validate.ts  aliases.ts  recipes.ts
  surfaces.ts  themes.ts  design.ts  errors.ts
```

---

## 三、DB Schema 变更

```sql
-- 现有表加列
ALTER TABLE artifacts ADD COLUMN format TEXT NOT NULL DEFAULT 'rkmd';
-- format: 'rkmd' | 'html'

ALTER TABLE revisions ADD COLUMN html_source TEXT;
-- html_source: 存 Agent 原始 HTML（未处理，用于 feedback 回显）

ALTER TABLE revisions ADD COLUMN processed_html TEXT;
-- processed_html: 注入 anchor 后的完整页面 HTML

-- 新表：anchor 清单，每 revision 一份
CREATE TABLE IF NOT EXISTS anchors (
  id           TEXT PRIMARY KEY,
  revision_id  TEXT NOT NULL REFERENCES revisions(id) ON DELETE CASCADE,
  artifact_id  TEXT NOT NULL,
  anchor       TEXT NOT NULL,          -- data-rk-anchor 值
  element_tag  TEXT NOT NULL,          -- rk-callout / h2 / p / div ...
  position     INTEGER NOT NULL,       -- 在文档中的顺序
  text_preview TEXT                    -- 前 80 字，用于 feedback 显示
);
CREATE INDEX IF NOT EXISTS idx_anchors_revision ON anchors(revision_id);
CREATE INDEX IF NOT EXISTS idx_anchors_artifact ON anchors(artifact_id);

-- comments 表：block_id 列改名含义（anchor 值，兼容旧格式）
-- 不需要 ALTER，block_id 字段就是 anchor id，语义一致
```

---

## 四、Server HTML 处理流程

```
CLI push artifact.html
  ↓
POST /api/artifacts { format: 'html', html: '<h1>...' }
  ↓
html-processor.ts:
  1. parseHTML(html) via linkedom
  2. 遍历顶层元素 → 注入 data-rk-anchor（用 id 或生成 anc_xxx）
  3. 找 <rk-code> → Shiki 预渲染 → 替换 data-rk-code-rendered
  4. 找 <rk-diagram> → Mermaid 渲染 SVG → 替换 data-rk-diagram-rendered
  5. 提取 title（第一个 <h1> 的 textContent）
  6. 返回 { processedHtml, anchors[], title }
  ↓
store.pushHTML():
  - 存 artifacts（format='html', title）
  - 存 revisions（html_source=原始, processed_html=处理后）
  - 存 anchors（每个 anchor 一行）
  ↓
返回 { ok, artifactId, url }
```

### html-processor.ts 核心逻辑

```typescript
import { parseHTML } from 'linkedom';
import { renderCode } from './prerender/code.ts';
import { renderDiagram } from './prerender/diagram.ts';

const TOP_LEVEL_TAGS = new Set([
  'rk-summary','rk-callout','rk-stat','rk-code','rk-table',
  'rk-chart','rk-diagram','rk-decision','rk-checklist',
  'rk-comparison','rk-timeline',
  'h1','h2','h3','h4','h5','h6',
  'p','blockquote','img','figure','div','section','table','ul','ol','pre',
]);

export async function processHTML(rawHtml: string): Promise<ProcessResult> {
  const { document } = parseHTML(`<!doctype html><html><body>${rawHtml}</body></html>`);
  const anchors: AnchorEntry[] = [];
  let title = '';
  let position = 0;

  for (const el of Array.from(document.body.children)) {
    const tag = el.tagName.toLowerCase();
    if (!TOP_LEVEL_TAGS.has(tag)) continue;

    // 提取 title
    if (!title && tag === 'h1') title = el.textContent?.trim() ?? '';

    // 注入 anchor
    const existingId = el.getAttribute('id') || el.getAttribute('data-rk-anchor');
    const anchor = existingId ?? `anc_${randomId()}`;
    if (!el.getAttribute('data-rk-anchor')) el.setAttribute('data-rk-anchor', anchor);

    // Server 预渲染
    if (tag === 'rk-code') await prerenderCode(el);
    if (tag === 'rk-diagram') await prerenderDiagram(el);

    anchors.push({
      anchor,
      elementTag: tag,
      position: position++,
      textPreview: el.textContent?.slice(0, 80) ?? '',
    });
  }

  return {
    processedHtml: document.body.innerHTML,
    anchors,
    title: title || 'Untitled',
  };
}
```

---

## 五、Web Components 规格

### 核心原则

- **Light DOM，不用 shadow DOM** — Selection API 需要看到文字，评论系统才工作
- **CSS 命名空间** — `rk-callout__title`、`rk-stat__value`，靠前缀隔离，不靠 shadow boundary
- **`connectedCallback` 保存原始 innerHTML** — render 后才覆写，避免循环
- **CSS custom properties 全部透传** — 组件样式 100% 依赖 `:root` 变量，Agent 可覆盖

### 每个组件规格

#### `<rk-callout>`
```html
<rk-callout tone="info" title="注意事项">内容文字</rk-callout>

<!-- 渲染后 light DOM: -->
<rk-callout tone="info" title="注意事项" data-rk-rendered>
  <div class="rk-callout rk-callout--info">
    <svg class="rk-callout__icon"><!-- lucide info --></svg>
    <div class="rk-callout__body">
      <p class="rk-callout__title">注意事项</p>
      <div class="rk-callout__content">内容文字</div>
    </div>
  </div>
</rk-callout>
```
属性：`tone` (info|warning|danger|success|tip|decision|note)、`title`

#### `<rk-stat>`
```html
<rk-stat label="月活用户" value="128,400" unit="人" delta="+12%" deltadir="up" tone="positive"></rk-stat>
```
属性：`label`、`value`、`unit`、`delta`、`deltadir` (up|down|neutral)、`tone` (positive|negative|neutral)

#### `<rk-code>`
```html
<rk-code language="typescript" title="parse.ts" frame="editor" showlinenumbers>
const x = 1;
</rk-code>
```
属性：`language`、`title`、`filename`、`frame` (editor|terminal|none)、`showlinenumbers`  
Server 预渲染：Shiki 生成 HTML 存入 `data-rk-code-rendered`，浏览器组件直接用

#### `<rk-table>`
```html
<rk-table profile="status" title="服务状态">
| 服务 | 状态 | 延迟 |
|------|------|------|
| API  | healthy | 12ms |
</rk-table>
```
属性：`profile` (matrix|status|key-value|cards|compact)、`title`  
组件内部解析 pipe table（同当前 TableBlock 逻辑）

#### `<rk-chart>`
```html
<rk-chart type="bar" title="月活趋势" xfield="月份" yfield="用户数">
| 月份 | 用户数 |
|------|--------|
| 1月  | 8.2    |
</rk-chart>
```
属性：`type` (bar|line|pie|scatter|kpi)、`title`、`xfield`、`yfield`、`caption`  
组件动态 `import('echarts')` 渲染到内部 `<div>`

#### `<rk-diagram>`
```html
<rk-diagram engine="mermaid" caption="数据流">
flowchart LR
  A --> B
</rk-diagram>
```
属性：`engine` (mermaid|d2)、`caption`  
Server 预渲染：生成 SVG 存入 `data-rk-diagram-rendered`

#### `<rk-decision>`
```html
<rk-decision question="存储选型" chosen="SQLite" status="decided">
  <rk-reason>
    <li>零配置</li>
    <li>无需 Docker</li>
  </rk-reason>
  <rk-alternative name="PostgreSQL">需要 Docker，成本高</rk-alternative>
</rk-decision>
```
属性：`question`、`chosen`、`status` (draft|proposed|decided)

#### `<rk-checklist>`
```html
<rk-checklist title="发布前检查">
  <rk-item checked>TypeScript 迁移完成</rk-item>
  <rk-item>Dead CSS 清理</rk-item>
  <rk-item note="下一阶段">Infographic 增强</rk-item>
</rk-checklist>
```

#### `<rk-timeline>`
```html
<rk-timeline title="发布计划">
  <rk-step status="done" tags="Q1,infra">TypeScript 迁移</rk-step>
  <rk-step status="active" tags="进行中">Block 质量提升</rk-step>
  <rk-step status="next">Web Components 改造</rk-step>
</rk-timeline>
```

#### `<rk-comparison>`
```html
<rk-comparison variant="proscons" title="SQLite vs PostgreSQL">
| ✓ 优点 | ✗ 缺点 |
|--------|--------|
| 零配置 | 无并发写 |
</rk-comparison>
```
属性：`variant` (proscons|matrix)

#### `<rk-summary>`
```html
<rk-summary title="项目摘要">
  <p>RenderKit 是本地 Agent artifact renderer。</p>
</rk-summary>
```

---

## 六、CSS 主题系统

一份 `packages/components/src/css/theme.css`，所有组件引用这些变量：

```css
/* ── 基础 ── */
:root {
  --rk-bg:            #ffffff;
  --rk-bg-secondary:  #f8f9fa;
  --rk-bg-tertiary:   #f1f3f5;
  --rk-text:          #1a1a1a;
  --rk-text-secondary:#6b7280;
  --rk-text-muted:    #9ca3af;
  --rk-border:        #e5e7eb;
  --rk-border-strong: #d1d5db;

  /* ── 强调 ── */
  --rk-accent:        #2563eb;
  --rk-accent-light:  #eff6ff;

  /* ── 语义色 ── */
  --rk-success:       #16a34a;
  --rk-success-bg:    #f0fdf4;
  --rk-warning:       #d97706;
  --rk-warning-bg:    #fffbeb;
  --rk-danger:        #dc2626;
  --rk-danger-bg:     #fef2f2;
  --rk-info:          #2563eb;
  --rk-info-bg:       #eff6ff;

  /* ── 排版 ── */
  --rk-font:     'Inter', -apple-system, 'PingFang SC', sans-serif;
  --rk-font-mono:'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace;
  --rk-text-base: 0.9375rem;   /* 15px */
  --rk-line-height: 1.75;

  /* ── 空间 ── */
  --rk-radius:    8px;
  --rk-radius-sm: 4px;
  --rk-radius-lg: 12px;
  --rk-space:     1rem;
  --rk-max-width: 72ch;
}

/* Agent 想换主题，只需要在文档里写一个 <style>: */
/* dark-pro: */
/* :root { --rk-bg: #0d1117; --rk-text: #e6edf3; ... } */
```

---

## 七、浏览器端 bundle 注入

Server 在返回页面时，在 HTML 底部注入：

```html
<!-- Server 注入，Agent 不需要写 -->
<link rel="stylesheet" href="/rk/theme.css">
<link rel="stylesheet" href="/rk/components.css">
<script type="module" src="/rk/components.js"></script>
<script src="/rk/comment-overlay.js"></script>
```

`/rk/components.js` 是 `packages/components` 打包后的 bundle（esbuild，约 30KB gz）。  
`/rk/comment-overlay.js` 是现有评论系统移植版（TextQuoteSelector + 气泡 + CommentThread）。

---

## 八、CLI 变更

### 删除的命令
```
validate   → 无 DSL，不需要
surfaces   → 退役
themes     → 变成 CSS 变量文档
aliases    → 无 alias
recipes    → 无 recipe
design     → 变成组件文档
errors     → 无 DSL 错误码
```

### 保留 + 修改的命令

```bash
# push — 自动检测格式
renderkit push artifact.html --open    # 新路径
renderkit push artifact.rk.md --open   # 旧路径（继续工作）

# feedback — 返回结构不变，anchor 替代 blockId
renderkit feedback artifact.html --json

# status — 同上
renderkit status artifact.html --json

# server — 不变
renderkit server --port 3737
```

### 新增命令

```bash
# 列出可用组件（替代 blocks 命令）
renderkit components
renderkit components --json

# fragment patch — 替换指定 anchor 的内容
renderkit patch artifact.html \
  --anchor "exec-summary" \
  --fragment updated-section.html

# 追加 section 到末尾
renderkit append artifact.html \
  --fragment new-section.html

# 解析文件返回 anchor 列表（方便 Agent 做 feedback 定位）
renderkit anchors artifact.html --json
```

### push 命令逻辑

```typescript
async function doPush(file: string, opts: PushOptions) {
  const content = fs.readFileSync(file, 'utf8');
  const isHTML = file.endsWith('.html') || file.endsWith('.htm');

  if (isHTML) {
    return await http.post('/api/artifacts', {
      format: 'html',
      html: content,
      file: path.basename(file),
    });
  } else {
    // 原有 .rk.md 路径
    return await http.post('/api/artifacts', {
      format: 'rkmd',
      source: content,
      file: path.basename(file),
    });
  }
}
```

---

## 九、API 变更

### POST /api/artifacts（扩展）

```typescript
// 请求体新增 format 字段
type PushBody =
  | { format: 'rkmd'; source: string; file?: string }
  | { format: 'html'; html: string; file?: string };
```

### 新增 PATCH /api/artifacts/[id]/patch

```typescript
// fragment patch
POST /api/artifacts/:id/patch
Body: {
  anchor: string;           // 目标 anchor
  fragment: string;         // 新的 HTML fragment
  resolveComments?: string[]; // 同时解决的评论 id
}
// Server 做：找到当前 processedHtml 里的 anchor，替换其父元素，生成新 revision
```

### feedback 响应结构调整

```typescript
// 现在返回 blockId
{ blockId: 'callout-abc', text: '...' }

// 改为返回 anchor（兼容旧格式）
{
  anchor: 'exec-summary',   // data-rk-anchor 值
  elementTag: 'rk-summary', // 元素类型
  textPreview: '...',        // 前 80 字
  text: '评论内容',
  selector: { ... }         // TextQuoteSelector，不变
}
```

---

## 十、anchor diff（孤儿评论检测）

```typescript
// anchor-diff.ts
export interface AnchorDiff {
  added:   string[];   // 新 revision 新增的 anchor
  removed: string[];   // 消失的 anchor
  kept:    string[];   // 两个版本都有
}

export function diffAnchors(prev: string[], next: string[]): AnchorDiff {
  const prevSet = new Set(prev);
  const nextSet = new Set(next);
  return {
    added:   next.filter(a => !prevSet.has(a)),
    removed: prev.filter(a => !nextSet.has(a)),
    kept:    next.filter(a => prevSet.has(a)),
  };
}

// store.pushHTML 里：
const diff = diffAnchors(prevAnchors, newAnchors);
// diff.removed 的 anchor → 关联评论标为 orphaned
// 同现有 block_ids diff 逻辑，只是数据来源变了
```

---

## 十一、ArtifactView 页面路由

```typescript
// apps/web/app/a/[id]/page.tsx
export default async function ArtifactPage({ params }) {
  const artifact = await getArtifact(params.id);
  
  if (artifact.format === 'html') {
    return <HTMLArtifactView artifact={artifact} />;
  }
  return <RkmdArtifactView artifact={artifact} />;  // 现有
}
```

### HTMLArtifactView

```tsx
// 不需要 React 渲染 blocks，直接 dangerouslySetInnerHTML
// 评论气泡覆盖层通过 client script 注入
export function HTMLArtifactView({ artifact }) {
  return (
    <div className="rk-html-artifact">
      {/* Server 已注入 anchor，直接渲染 */}
      <div
        className="rk-html-body"
        dangerouslySetInnerHTML={{ __html: artifact.processedHtml }}
      />
      {/* 评论气泡层 — 同现有，只是 blockId → anchor */}
      <CommentRail anchors={artifact.anchors} comments={artifact.comments} />
    </div>
  );
}
```

---

## 十二、执行计划

### Step 1：packages/components — 独立可运行（不改 Server）

```
新建 packages/components/
写 11 个 Web Components（Light DOM）
写 theme.css + components.css
esbuild 打出 components.js
写一个 test/index.html 能直接 open 看效果
```

**完成标准**：`open packages/components/test/index.html` 能看到全部 11 个组件，无 JS 错误。

---

### Step 2：Server 支持 HTML push

```
安装 linkedom 到 apps/web
写 apps/web/lib/html-processor.ts
  - anchor 注入
  - Shiki 预渲染
  - Mermaid 预渲染
DB schema 迁移（format 列 + anchors 表）
store.ts 新增 pushHTML()
POST /api/artifacts 加 HTML 分支
apps/web/public/rk/ 提供 theme.css + components.js
HTMLArtifactView.tsx
page.tsx 路由分发
```

**完成标准**：`renderkit push test.html --open` 能打开，Web Components 正常渲染，评论系统工作。

---

### Step 3：CLI 精简 + patch/append

```
删除 7 个死命令（validate/surfaces/themes/aliases/recipes/design/errors）
push 命令加 .html 自动检测
新增 components 命令
新增 patch 命令
新增 append 命令
新增 anchors 命令
```

**完成标准**：`renderkit --help` 只显示有用命令；`renderkit patch` 能替换单个 section。

---

### Step 4：文档 + 旧路径并存（可选退役 DSL）

```
写 docs/agent-guide.md（Agent 如何写 artifact.html）
写 packages/components/README.md（组件参考文档）
packages/dsl 降级为 legacy（不删，留给 .rk.md 兼容）
```

---

## 十三、风险与决策点

| 风险 | 处置 |
|---|---|
| Agent 写裸 HTML 质量参差 | `<rk-*>` 组件保证高频场景质量；裸 HTML 由 Agent 自己负责 |
| linkedom 解析不完整的 HTML | 包一层 `<body>` 再解析；测试边界情况 |
| Mermaid server-side 渲染依赖 | `@mermaid-js/mermaid-isomorphic` 可 Node 端运行；或降级：client-side 渲染 |
| anchor 不稳定（Agent 没写 id） | feedback 里明确提示 Agent 要写 id；`renderkit anchors` 命令帮 Agent 查当前 anchor 列表 |
| Shadow DOM 注释不到 | 已决策：Light DOM，无此问题 |
| 旧 .rk.md artifact 继续运行 | format='rkmd' 走旧路径，两路并存，不强制迁移 |
