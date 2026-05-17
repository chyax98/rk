# RenderKit HTML + Web Components 改造方案

> 验证状态：Demo 已跑通（Light DOM + Selection API ✅ | CSS variables ✅ | anchor ✅）  
> Mermaid：client-side 渲染（浏览器直接跑）  
> 执行方式：一次性全量实现，无分阶段

---

## 一句话

```
现在：Agent 写 .rk.md → DSL 编译 → React 渲染 → 人看
改后：Agent 写 .html + <rk-*> → Server 注入 anchor → 浏览器渲染 → 人看
```

---

## 文件树变化

### 新增

```
packages/components/
  src/
    elements/
      rk-callout.ts       tone(info/warning/danger/success/tip/decision/note), title
      rk-stat.ts          label, value, unit, delta, deltadir, tone
      rk-summary.ts       title
      rk-code.ts          language, title, filename, frame(editor/terminal)
      rk-table.ts         profile(matrix/status/key-value/cards/compact), title
      rk-chart.ts         type(bar/line/pie/kpi), title, xfield, yfield
      rk-diagram.ts       engine(mermaid), caption — client-side 渲染
      rk-decision.ts      question, chosen, status
      rk-checklist.ts     title（子元素 <rk-item checked note="...">）
      rk-comparison.ts    variant(proscons/matrix), title
      rk-timeline.ts      title（子元素 <rk-step status tags>）
    css/
      theme.css           CSS custom properties（一套变量）
      components.css      全部组件样式（light DOM，BEM 命名）
    index.ts              Node 侧导出（给 Server 用）
  package.json
  tsconfig.json

apps/web/
  lib/
    html-processor.ts     linkedom 解析 + anchor 注入 + Shiki 代码预渲染
    anchor-diff.ts        anchor 列表 diff → 孤儿评论标记
  app/a/[id]/
    HtmlArtifactView.tsx  HTML artifact 渲染页（dangerouslySetInnerHTML）
  app/api/artifacts/[id]/
    patch/route.ts        fragment patch API
  public/rk/
    theme.css             (构建产物)
    components.css        (构建产物)
    components.js         (esbuild bundle)
```

### 修改

```
apps/web/lib/db.ts                 schema: format 列 + anchors 表
apps/web/lib/store.ts              新增 pushHTML() / patchHTML()
apps/web/app/api/artifacts/route.ts  HTML push 分支
apps/web/app/a/[id]/page.tsx       format 路由（html → HtmlArtifactView）
packages/cli/src/index.ts          删 7 个死命令，加 4 个新命令
packages/cli/src/commands/push.ts  .html 自动检测
```

### 删除（与旧路径同步退役）

```
packages/cli/src/commands/validate.ts
packages/cli/src/commands/aliases.ts
packages/cli/src/commands/recipes.ts
packages/cli/src/commands/surfaces.ts
packages/cli/src/commands/themes.ts
packages/cli/src/commands/design.ts
packages/cli/src/commands/errors.ts
```

---

## DB Schema

```sql
-- artifacts 加 format
ALTER TABLE artifacts ADD COLUMN format TEXT NOT NULL DEFAULT 'rkmd';
-- format: 'rkmd' | 'html'

-- revisions 加 HTML 源
ALTER TABLE revisions ADD COLUMN html_source TEXT;
ALTER TABLE revisions ADD COLUMN processed_html TEXT;

-- anchor 清单（每 revision 一份，用于 diff 和 feedback）
CREATE TABLE IF NOT EXISTS anchors (
  id           TEXT PRIMARY KEY,
  revision_id  TEXT NOT NULL REFERENCES revisions(id) ON DELETE CASCADE,
  artifact_id  TEXT NOT NULL,
  anchor       TEXT NOT NULL,
  element_tag  TEXT NOT NULL,
  position     INTEGER NOT NULL,
  text_preview TEXT
);
CREATE INDEX IF NOT EXISTS idx_anchors_revision ON anchors(revision_id);
CREATE INDEX IF NOT EXISTS idx_anchors_artifact ON anchors(artifact_id);
```

---

## 11 个 Web Components 规格

### 核心模式（所有组件统一）

```typescript
class RkFoo extends HTMLElement {
  connectedCallback() {
    if (!this._raw) this._raw = this.innerHTML; // 保存原始内容，一次
    this._render();
  }
  static get observedAttributes() { return ['attr1', 'attr2']; }
  attributeChangedCallback() { if (this._raw !== undefined) this._render(); }
  _render() {
    const attr = this.getAttribute('attr1') || '';
    this.innerHTML = `<div class="rk-foo rk-foo--${attr}">...</div>`;
  }
}
customElements.define('rk-foo', RkFoo);
```

**规则**：Light DOM（不用 attachShadow），CSS 用 `rk-foo__bar` 命名空间，不用 shadow boundary。

### rk-callout
- 属性：`tone` (info|warning|danger|success|tip|decision|note)，`title`
- 图标：Lucide 风格 inline SVG（18px stroke，hardcoded per tone）
- 结构：`.rk-callout.rk-callout--{tone}` > `.rk-callout__icon` + `.rk-callout__body`

### rk-stat
- 属性：`label`，`value`，`unit`，`delta`，`deltadir` (up|down|neutral)，`tone` (positive|negative|neutral)
- 结构：`.rk-stat.rk-stat--{tone}` > `__value` + `__unit` + `__label` + `__delta`
- delta 颜色：up + positive = success；up + negative = danger

### rk-summary
- 属性：`title`
- 结构：`.rk-summary` > `__title` + `__content`（原始 innerHTML）

### rk-code
- 属性：`language`，`title`，`filename`，`frame` (editor|terminal|none)，`showlinenumbers`
- 内容：textContent 作为代码，HTML escape，`<pre><code>` 包裹
- Server 预渲染：Shiki 生成高亮 HTML 放入 `data-highlighted` attr，组件优先用它

### rk-table
- 属性：`profile` (matrix|status|key-value|cards|compact)，`title`
- 内容：innerHTML 是 pipe table markdown，组件解析成 `<table>`
- profile=status：第一列值 healthy/degraded/critical 自动加色点

### rk-chart
- 属性：`type` (bar|line|pie|scatter|kpi)，`title`，`xfield`，`yfield`，`caption`
- 内容：innerHTML 是 pipe table markdown，解析为数据
- 渲染：动态 `import('echarts')` + SVG renderer，挂到内部 `<div>`

### rk-diagram
- 属性：`engine` (mermaid)，`caption`
- 内容：textContent 是 mermaid 语法
- 渲染：client-side，动态 `import('mermaid')`，渲染 SVG

### rk-decision
- 属性：`question`，`chosen`，`status` (draft|proposed|decided)
- 子元素：`<rk-reason>`（ul/li 理由），`<rk-alternative name="...">`（备选项）
- 结构：eyebrow + question + chosen badge + rationale + alternatives list

### rk-checklist
- 属性：`title`
- 子元素：`<rk-item checked note="...">文字</rk-item>`
- 渲染：`querySelectorAll('rk-item')` 解析，生成 checklist 行

### rk-comparison
- 属性：`variant` (proscons|matrix)，`title`
- 内容：pipe table（proscons：两列 ✓/✗；matrix：多列对比）
- proscons：绿色左列 + 红色右列

### rk-timeline
- 属性：`title`
- 子元素：`<rk-step status="done|active|next" tags="tag1,tag2">标题 — 描述</rk-step>`
- 渲染：编号步骤卡 + 竖线连接器

---

## Server HTML 处理（html-processor.ts）

```typescript
import { parseHTML } from 'linkedom';
import { codeToHtml } from 'shiki';

const TOP_LEVEL_TAGS = new Set([
  'rk-callout','rk-stat','rk-summary','rk-code','rk-table',
  'rk-chart','rk-diagram','rk-decision','rk-checklist','rk-comparison','rk-timeline',
  'h1','h2','h3','h4','h5','h6','p','blockquote','img','figure',
  'div','section','table','ul','ol','pre','details',
]);

export async function processHTML(rawHtml: string): Promise<ProcessResult> {
  const { document } = parseHTML(`<!doctype html><html><body>${rawHtml}</body></html>`);
  const anchors: AnchorEntry[] = [];
  let title = '';
  let pos = 0;

  for (const el of Array.from(document.body.children)) {
    const tag = el.tagName.toLowerCase();
    if (!TOP_LEVEL_TAGS.has(tag)) continue;

    if (!title && tag === 'h1') title = el.textContent?.trim() ?? '';

    const anchor = el.getAttribute('id') ?? el.getAttribute('data-rk-anchor') ?? `anc_${uid()}`;
    el.setAttribute('data-rk-anchor', anchor);

    // Shiki 预渲染 rk-code
    if (tag === 'rk-code') {
      const lang = el.getAttribute('language') || 'text';
      const code = el.textContent?.trim() ?? '';
      try {
        const highlighted = await codeToHtml(code, { lang, theme: 'github-dark' });
        el.setAttribute('data-highlighted', Buffer.from(highlighted).toString('base64'));
      } catch { /* fallback to client */ }
    }

    anchors.push({ anchor, elementTag: tag, position: pos++,
      textPreview: el.textContent?.trim().slice(0, 80) ?? '' });
  }

  return { processedHtml: document.body.innerHTML, anchors, title: title || 'Untitled' };
}
```

---

## CSS Theme（一份，所有组件引用）

```css
:root {
  --rk-bg:            #ffffff;
  --rk-bg-secondary:  #f8f9fa;
  --rk-bg-tertiary:   #f1f3f5;
  --rk-text:          #1a1a1a;
  --rk-text-secondary:#6b7280;
  --rk-text-muted:    #9ca3af;
  --rk-border:        #e5e7eb;
  --rk-accent:        #2563eb;
  --rk-accent-light:  #eff6ff;
  --rk-success:       #16a34a;  --rk-success-bg: #f0fdf4;
  --rk-warning:       #d97706;  --rk-warning-bg: #fffbeb;
  --rk-danger:        #dc2626;  --rk-danger-bg:  #fef2f2;
  --rk-info:          #2563eb;  --rk-info-bg:    #eff6ff;
  --rk-tip:           #7c3aed;  --rk-tip-bg:     #f5f3ff;
  --rk-decision:      #0891b2;  --rk-decision-bg:#ecfeff;
  --rk-note:          #6b7280;  --rk-note-bg:    #f9fafb;
  --rk-radius:        8px;
  --rk-radius-sm:     4px;
  --rk-font:          'Inter', -apple-system, 'PingFang SC', sans-serif;
  --rk-font-mono:     'Cascadia Code', 'Fira Code', monospace;
  --rk-space:         1rem;
  --rk-max-width:     72ch;
}
```

---

## CLI 变更

### 删除（直接删文件）
`validate` `aliases` `recipes` `surfaces` `themes` `design` `errors`

### 保留 + 修改
- `push`：自动检测 `.html` vs `.rk.md`
- `feedback`、`status`、`server`：不变

### 新增命令

```bash
renderkit components [--json]          # 列出 11 个 <rk-*> 组件和属性
renderkit patch <file.html> \
  --anchor <id> --fragment <frag.html> # 替换单个 anchor 的内容
renderkit append <file.html> \
  --fragment <frag.html>               # 追加到末尾
renderkit anchors <file.html> [--json] # 列出当前 artifact 的所有 anchor
```

---

## API 变更

### POST /api/artifacts（扩展，向后兼容）
```typescript
type Body =
  | { format: 'html';  html: string;   file?: string }
  | { format: 'rkmd';  source: string; file?: string }  // 旧路径不变
```

### POST /api/artifacts/:id/patch（新增）
```typescript
Body: { anchor: string; fragment: string; resolveComments?: string[] }
```

### GET feedback 响应（anchor 替代 blockId）
```typescript
{
  anchor: string;       // data-rk-anchor 值（原 blockId）
  elementTag: string;   // rk-callout / h2 / div ...
  textPreview: string;  // 前 80 字
  text: string;
  selector?: TextQuoteSelector;
}
```

---

## 经过实验验证的结论

| 问题 | 结论 | 依据 |
|---|---|---|
| Light DOM + Selection API | ✅ 完全兼容 | Demo 实测：能选中 custom element 内部中文文字 |
| CSS custom properties 穿透 | ✅ 正常 | `--rk-accent` 在 light DOM 内读取正确 |
| Mermaid server-side | ❌ 不用 | `mermaid-isomorphic` 要 Playwright；直接 client-side |
| Shiki server-side | ✅ 用 | 已在现有 `/api/render/code` 验证，预渲染存 base64 attr |
| linkedom HTML 解析 | ✅ 用 | 轻量，DOM API 兼容，anchor 注入简单 |
| shadow DOM | ❌ 不用 | Selection API 看不到 shadow DOM 内容 |

## 实施结果（2025-05）

### 已验证
- ✅ Light DOM + Selection API 可跨组件选中文字
- ✅ CSS custom properties 主题覆盖正常工作
- ✅ data-rk-anchor 注入正常，评论定位准确
- ✅ rk-grid DOM-move 方案解决双重渲染
- ✅ 气泡 getBoundingClientRect + scrollY 跟随 block 位置
- ✅ CDN 动态 import（Three.js/ECharts/Mermaid）按需加载

### Bundle 数据
- components.js: 45.5KB（ESM，esbuild bundle）
- components.css: 核心样式
- theme.css: CSS custom properties

### 21 个组件清单
rk-3d, rk-callout, rk-chart, rk-checklist, rk-code, rk-collapsible,
rk-comparison, rk-decision, rk-diagram, rk-grid, rk-highlight,
rk-image, rk-metric, rk-progress, rk-quote, rk-stat, rk-steps,
rk-summary, rk-table, rk-tabs, rk-timeline
