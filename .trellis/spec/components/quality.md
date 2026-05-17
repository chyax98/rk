# 质量标准

## 代码结构要求

每个组件文件必须包含以下元素：

```typescript
// 1. 文件头注释
// ─── rk-{name} ──────────────────────────────────────────────

// 2. 辅助函数（如需要，如 rk-comparison 的 parsePipeTable）
// 放在 class 外部、文件顶部

// 3. Class 定义
class Rk{Name} extends HTMLElement {
  _raw = '';
  static get observedAttributes() { return [...]; }
  connectedCallback(): void { ... }
  attributeChangedCallback(): void { ... }
  _render(): void { ... }
  _escape(s: string): string { ... }
  // 可选：_escapeHtml, _build, _loadThree 等
}

// 4. 注册
customElements.define('rk-{name}', Rk{Name});

// 5. 导出
export { Rk{Name} };
```

## 功能正确性

### 属性处理

- [ ] `observedAttributes` 列出所有需要响应的属性
- [ ] 每个属性有合理的默认值（不依赖外部传入）
- [ ] 布尔属性用 `hasAttribute()` 检测
- [ ] 数值属性用 `parseFloat()` + fallback

### 安全性

- [ ] 所有用户输入经过 `_escape()` 转义
- [ ] 不使用 `innerHTML` 插入未转义的用户输入
- [ ] 唯一例外：`rk-code` 的 `data-highlighted`（base64 Shiki HTML，可信来源）

### 子元素处理

- [ ] 子元素不存在时显示友好提示（而非空白或报错）
- [ ] 示例：`<p style="color:var(--rk-muted)">No tabs found...</p>`

### 空状态处理

- [ ] 无数据时组件不崩溃
- [ ] 无数据时显示占位提示或留空（取决于组件语义）

## 一致性检查清单

添加新组件时核对：

- [ ] 文件命名 `rk-{name}.ts`
- [ ] Class 命名 `Rk{Name}`（PascalCase）
- [ ] 标签命名 `rk-{name}`
- [ ] `customElements.define` 在文件底部
- [ ] `export { Rk{Name} }` 在文件底部
- [ ] `bundle.ts` 添加了 import
- [ ] `index.ts` COMPONENTS 数组添加了描述符
- [ ] `components.css` 添加了 BEM 样式
- [ ] 样式全部使用 `var(--rk-*)` token
- [ ] 无硬编码颜色、间距、字号

## 常见错误

### 1. connectedCallback 里读 textContent 时 innerHTML 已被覆盖

```typescript
// ❌ 错误：_render() 覆写 innerHTML 后再读 textContent
connectedCallback(): void {
  this._render();           // innerHTML 被覆写
  this._raw = this.textContent;  // 读到的是渲染后的内容
}

// ✅ 正确：先缓存
connectedCallback(): void {
  this._raw = this.textContent || '';
  this._render();
}
```

### 2. attributeChangedCallback 在 connectedCallback 前触发

```typescript
// ❌ 错误：无条件重渲染
attributeChangedCallback(): void {
  this._render();  // _raw 为空，渲染空内容
}

// ✅ 正确：检查 _raw
attributeChangedCallback(): void {
  if (this._raw) this._render();
}
```

### 3. rk-grid 重复渲染

```typescript
// ❌ 错误：不做防重入
connectedCallback(): void {
  this._build();  // DOM move，第二次调用结构错乱
}

// ✅ 正确：_rendered 标记
private _rendered = false;
connectedCallback(): void {
  if (this._rendered) return;
  this._rendered = true;
  this._build();
}
```

### 4. CSS 类名不一致

```typescript
// ❌ 错误：HTML 中的 class 与 CSS 中的选择器不匹配
this.innerHTML = `<div class="rk-tab">...</div>`;  // 应为 rk-tabs__panel
```

### 5. 忘记在 index.ts 注册

新组件只在 bundle.ts import 不会出现在 COMPONENTS 注册表，CLI 工具无法发现。
