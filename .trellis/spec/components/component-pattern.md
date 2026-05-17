# 组件编写模式

## Class 结构

每个组件一个文件，位于 `packages/components/src/elements/`。

```typescript
// rk-example.ts
class RkExample extends HTMLElement {
  _raw = '';  // 保存原始 innerHTML

  static get observedAttributes(): string[] {
    return ['tone', 'title'];  // 声明响应式属性
  }

  connectedCallback(): void {
    this._raw = this.innerHTML;
    this._render();
  }

  attributeChangedCallback(): void {
    if (this._raw) this._render();  // 防首次空渲染
  }

  _render(): void {
    const tone = this.getAttribute('tone') || 'info';
    const title = this.getAttribute('title') || '';
    // 读属性 → 构建 HTML → this.innerHTML = ...
    this.innerHTML = `<div class="rk-example rk-example--${tone}">...</div>`;
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-example', RkExample);
export { RkExample };
```

## 关键模式

### 1. `_raw` 缓存原始内容

`connectedCallback` 里 `this._raw = this.innerHTML`，之后 `_render()` 使用 `_raw` 而非 `innerHTML`（因为 `_render` 会覆写 `innerHTML`）。

对于文本内容（如 rk-code），用 `this.textContent || ''`。

### 2. `attributeChangedCallback` 防护

```typescript
attributeChangedCallback(): void {
  if (this._raw) this._render();  // _raw 有值才重渲染
}
```

首次 `connectedCallback` 前可能触发 `attributeChangedCallback`，此时 `_raw` 为空，跳过。

### 3. 属性读取

所有配置通过 HTML attributes 传入：
```typescript
const tone = this.getAttribute('tone') || 'info';       // 有默认值
const isOpen = this.hasAttribute('open');                  // 布尔属性
const rawValue = parseFloat(this.getAttribute('value') || '0');  // 数值解析
```

### 4. 子元素读取（仅部分组件）

带子元素的组件（decision/checklist/tabs/grid/steps/metric/timeline）在 `_render()` 里用 `this.querySelectorAll('rk-xxx')` 读取子元素数据。

### 5. `_rendered` 防重入模式

`rk-grid` 和 `rk-3d` 使用 `_rendered` 标记防止重复渲染：

```typescript
private _rendered = false;

connectedCallback(): void {
  if (this._rendered) return;
  this._rendered = true;
  this._build();
}
```

原因：`rk-grid` 做 DOM move（`appendChild` 会移动非复制节点），重复执行会破坏结构。`rk-3d` 初始化 WebGL，不能重复。

### 6. DOM Move 模式（rk-grid 特有）

```typescript
// 收集子元素 BEFORE 修改 DOM
const children = Array.from(this.children);
// appendChild 做的是 DOM move，不是 clone
for (const cell of cells) {
  wrapper.appendChild(cell);  // 移动，非复制
}
```

### 7. 事件绑定（rk-tabs 特有）

`rk-tabs` 在 `_render()` 末尾绑定 click handler：

```typescript
this.querySelectorAll('.rk-tabs__btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    // 切换 is-active class
  });
});
```

每次 `_render()` 覆写 `innerHTML` 时旧 listener 自动回收。

### 8. 外部依赖动态加载

`rk-3d` 用 CDN 动态 import：
```typescript
const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.170/build/three.module.js');
```
`rk-chart`（ECharts）和 `rk-diagram`（Mermaid）同理。

## 命名规范

| 项 | 规范 | 示例 |
|---|---|---|
| 文件名 | `rk-{name}.ts` | `rk-callout.ts` |
| 标签名 | `rk-{name}` | `<rk-callout>` |
| Class 名 | `Rk{Name}`（PascalCase） | `RkCallout` |
| CSS 根类 | `.rk-{name}` | `.rk-callout` |
| CSS 变体 | `.rk-{name}--{variant}` | `.rk-callout--warning` |
| CSS 部件 | `.rk-{name}__{part}` | `.rk-callout__icon` |
| CSS 状态 | `.is-{state}` | `.is-active`, `.is-checked` |

## HTML 转义

所有用户输入的属性值和文本内容必须通过 `_escape()` 或 `_escapeHtml()` 转义。

- `_escape()`：DOM textContent 方式，通用安全。
- `_escapeHtml()`（rk-code 特有）：手动替换 `&<>"`，处理代码高亮 HTML。

## 禁止模式

1. **禁止使用 Shadow DOM**：组件不使用 `attachShadow`，样式由外部 CSS 控制。
2. **禁止在 `_render()` 外修改 `innerHTML`**：所有 DOM 构建集中在 `_render()`。
3. **禁止硬编码颜色**：CSS 中使用 `var(--rk-*)` token，不用 `#hex` 或 `rgb()`。
4. **禁止在 constructor 里读 DOM**：Custom Element spec 要求 constructor 不读/写 DOM。
5. **禁止漏写 `observedAttributes`**：组件需响应的属性必须声明。
