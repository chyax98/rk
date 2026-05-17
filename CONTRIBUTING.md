# Contributing to RenderKit

## 开发环境

```bash
# 前置：Node 24+, pnpm 9+
node --version   # >= 24.0.0
pnpm --version   # >= 9.0.0

pnpm install
pnpm dev         # 启动 Next.js dev server（端口 3737）
```

## 添加新 Web Component

1. 在 `packages/components/src/elements/` 新建 `rk-mycomponent.ts`
2. 实现 `class RkMyComponent extends HTMLElement`，遵循以下模式：

```ts
class RkMyComponent extends HTMLElement {
  private _rendered = false;

  static get observedAttributes() {
    return ['title', 'tone'];
  }

  connectedCallback(): void {
    if (this._rendered) return;
    this._rendered = true;
    this._render();
  }

  attributeChangedCallback(): void {
    if (this._rendered) this._render();
  }

  _render(): void {
    const title = this.getAttribute('title') || '';
    this.innerHTML = `<div class="rk-mycomponent">${title}</div>`;
  }
}

customElements.define('rk-mycomponent', RkMyComponent);
export { RkMyComponent };
```

3. 在 `packages/components/src/elements/index.ts` 加 `export * from './rk-mycomponent.ts'`
4. 在 `packages/components/src/css/components.css` 加 BEM 样式（class 前缀 `.rk-mycomponent`）
5. 在 `packages/components/src/bundle.ts` 加 import
6. 重新 build：`cd packages/components && pnpm build`
7. 验证：在 showcase HTML 中使用新组件，`renderkit push showcase.html --open`

## 修改 CSS Theme

主题变量在 `packages/components/src/css/theme.css`：

```css
:root {
  --rk-bg: #FAFAF7;         /* 页面背景 */
  --rk-fg: #1F2937;         /* 正文颜色 */
  --rk-accent: #D97757;     /* 主强调色（橙） */
  --rk-border: #E5E7EB;     /* 边框 */
  /* ... */
}
```

组件样式在 `packages/components/src/css/components.css`，使用 BEM 命名（`.rk-callout__title`）。

## 文件结构约定

- 所有 import 路径必须带 `.ts` / `.tsx` 扩展名（Node strip-types 要求）
- `packages/` 内部相对 import：`from './helpers.ts'`（有扩展名）
- 跨包 import：`from '@renderkit/shared/contracts'`（package exports 解析）

## CSS 约定

- 所有样式变量通过 `--rk-*` CSS custom properties
- 组件 class 前缀 `.rk-`
- 不引入 Tailwind / antd / material-ui

## Git 约定

```
feat:     新功能
fix:      bug 修复
refactor: 重构（无功能变化）
docs:     文档更新
chore:    构建/工具链变化
```
