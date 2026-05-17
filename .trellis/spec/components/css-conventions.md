# CSS 规范与 Design 包关系

## 样式分层

```
@renderkit/design（主题 + token）
  ↓ 提供 CSS 变量
@renderkit/components（组件样式）
  ↓ 消费 CSS 变量
最终 HTML（通过 <link> 或 <style> 加载）
```

组件包不定义颜色/间距等值，只消费 `--rk-*` token。

## CSS 文件位置

| 文件 | 职责 |
|---|---|
| `src/css/theme.css` | 定义所有 CSS 变量（`:root` 下） |
| `src/css/components.css` | 21 个组件的 BEM 样式，消费变量 |

**注意**：这两个文件目前在 `@renderkit/components` 包内。token 的语义定义和主题切换职责最终应迁移到 `@renderkit/design`（见 design-system 任务）。

## BEM 命名

```
.rk-{component}                    # 根容器
.rk-{component}--{variant}         # 变体修饰符
.rk-{component}__{part}            # 内部部件
.is-{state}                        # 状态类（非 BEM 前缀）
```

示例（来自 components.css）：
```css
.rk-callout { ... }                    /* 根 */
.rk-callout--warning { ... }           /* tone 变体 */
.rk-callout__icon { ... }              /* 图标部件 */
.rk-callout__body { ... }              /* 主体部件 */
.rk-callout__title { ... }             /* 标题部件 */
.rk-callout__content { ... }           /* 内容部件 */

.rk-tabs__btn.is-active { ... }        /* 状态切换 */
.rk-checklist__item.is-checked { ... } /* 状态切换 */
```

## Token 消费规范

### 必须使用的 token

| 场景 | token | 示例 |
|---|---|---|
| 背景 | `var(--rk-bg)` / `var(--rk-surface)` / `var(--rk-tone-*-bg)` | `.rk-callout { background: var(--rk-tone-info-bg) }` |
| 文字 | `var(--rk-text)` / `var(--rk-text-secondary)` / `var(--rk-muted)` | `.rk-callout__content { color: var(--rk-text-secondary) }` |
| 边框 | `var(--rk-border)` / `var(--rk-border-subtle)` / `var(--rk-tone-*-border)` | `.rk-callout { border: var(--rk-border-width) solid var(--rk-border-subtle) }` |
| 间距 | `var(--rk-space-*)` | `.rk-callout { padding: var(--rk-space-4) var(--rk-space-5) }` |
| 圆角 | `var(--rk-radius-*)` | `.rk-callout { border-radius: var(--rk-radius-lg) }` |
| 字体 | `var(--rk-text-*)` + `var(--rk-weight-*)` + `var(--rk-lh-*)` | `.rk-callout__title { font-size: var(--rk-text-base) }` |
| 阴影 | `var(--rk-shadow-*)` | `.rk-stat { box-shadow: var(--rk-shadow) }` |

### Tone 系统

Callout / Progress / Stat 等组件使用 tone 变体，通过 `--rk-tone-*` token 实现：

```css
/* 默认 (info) */
.rk-callout {
  border-left-color: var(--rk-tone-info-border);
  background: var(--rk-tone-info-bg);
}
/* warning 变体 */
.rk-callout--warning {
  border-left-color: var(--rk-tone-warning-border);
  background: var(--rk-tone-warning-bg);
}
```

当前 tone：`info` / `warning` / `danger` / `success` / `neutral` / `tip` / `decision` / `note`

### 状态色系统

Decision 组件使用状态色：

```css
.rk-decision__status--proposed { background: var(--rk-status-proposed-bg); color: var(--rk-status-proposed-text); }
.rk-decision__status--approved { background: var(--rk-status-approved-bg); color: var(--rk-status-approved-text); }
```

## 禁止模式

1. **硬编码颜色**：`color: #1a1a1a` → 必须用 `var(--rk-text)`
2. **硬编码间距**：`padding: 16px` → 必须用 `var(--rk-space-4)`
3. **硬编码字号**：`font-size: 14px` → 必须用 `var(--rk-text-sm)`
4. **`!important`**：除打印样式外禁止使用
5. **嵌套超过 3 层的 BEM**：`.rk-a__b__c` 可以，`.rk-a__b__c__d` 不行

## 内联样式例外

组件 TS 中的极少量内联样式仅限于动态计算值（如 `width:${pct}%`），颜色/间距等一律走 CSS class。

```typescript
// ✅ 允许：动态百分比值
`<div class="rk-progress__fill" style="width:${pct}%"></div>`

// ❌ 禁止：内联颜色
`<div style="color:#999">fallback text</div>`  // 应该用 class
```

目前 `rk-code` 中有一处 `style="color:var(--rk-muted)"` 和 `rk-3d` 中的 canvas 内联样式，这些在 token 迁移时可接受。
