# 注册表规范

## ComponentDescriptor 接口

定义在 `packages/components/src/index.ts`：

```typescript
export interface ComponentDescriptor {
  tag: string;           // 自定义元素标签，如 'rk-callout'
  className: string;     // 类名，如 'RkCallout'
  attributes: string[];  // observedAttributes 列表
  childElements?: string[];  // 可选：子元素标签列表
  description: string;   // 一句话描述
}
```

`COMPONENTS` 数组是 `readonly`，使用 `as const` 断言：

```typescript
export const COMPONENTS: readonly ComponentDescriptor[] = [
  { tag: 'rk-callout', className: 'RkCallout', attributes: ['tone', 'title'], ... },
  // ...
] as const;
```

## 注册机制

### 1. bundle.ts — 运行时注册

`src/bundle.ts` import 所有 21 个组件文件，触发 `customElements.define()`：

```typescript
import './elements/rk-callout.ts';
import './elements/rk-stat.ts';
// ... 21 个 import
```

**顺序无关**，因为每个文件末尾自行调用 `customElements.define()`。

### 2. index.ts — 工具注册表

`src/index.ts` 导出 `ComponentDescriptor[]`，供 CLI / tooling 使用（不触发 define）。

## 添加新组件流程

1. **创建组件文件** `src/elements/rk-{name}.ts`
   - class `Rk{Name} extends HTMLElement`
   - 实现 `_raw` / `observedAttributes` / `connectedCallback` / `attributeChangedCallback` / `_render` / `_escape`
   - 文件末尾 `customElements.define('rk-{name}', Rk{Name})`
   - 文件末尾 `export { Rk{Name} }`

2. **注册到 bundle.ts**
   ```typescript
   import './elements/rk-{name}.ts';
   ```

3. **注册到 index.ts**
   ```typescript
   {
     tag: 'rk-{name}',
     className: 'Rk{Name}',
     attributes: [...],
     childElements?: [...],  // 仅在组件使用子元素时
     description: '...',
   }
   ```

4. **编写 CSS**（在 `@renderkit/design` 的 `components.css` 中）
   ```css
   .rk-{name} { ... }
   .rk-{name}--{variant} { ... }
   .rk-{name}__{part} { ... }
   ```

5. **更新主题 token**（如需新语义变量）
   - 在 `theme.css` 的 `:root` 中添加新 token
   - 在所有主题中提供对应值

## childElements 声明规则

仅在组件的 `_render()` 里通过 `querySelectorAll` 读取特定子标签时声明：

| 组件 | childElements | 说明 |
|---|---|---|
| `rk-decision` | `rk-reason`, `rk-alternative` | 决策理由和备选方案 |
| `rk-checklist` | `rk-item` | 检查项 |
| `rk-tabs` | `rk-tab` | 标签页 |
| `rk-grid` | `rk-col` | 网格列 |
| `rk-steps` | `rk-step` | 步骤 |
| `rk-metric` | `rk-metric-item` | 指标卡片 |
| `rk-timeline` | `rk-step` | 时间线节点 |

注意：子元素标签不需要在 `customElements.define()` 中注册，它们是纯数据容器（`querySelectorAll` 读取属性和文本）。
