# Token 规范

## 命名规范

```
--rk-{category}-{size/variant}
```

- 前缀固定 `--rk-`
- category 是一级分类（space / radius / text / weight / lh / tracking / type / shadow / z / icon / density）
- size 是数字或语义词（xs / sm / md / lg / xl / full）

## Token 分类

### Spacing（间距）

```css
--rk-space-0: 0;     /* 0 */
--rk-space-1: 4px;   /* 4px */
--rk-space-2: 8px;   /* 8px */
--rk-space-3: 12px;
--rk-space-4: 16px;
--rk-space-5: 20px;
--rk-space-6: 24px;
--rk-space-8: 32px;
--rk-space-10: 40px;
--rk-space-12: 48px;
--rk-space-16: 64px;
--rk-space-20: 80px;
```

4px 基准网格。数字 = 基准倍数 / 4（`--rk-space-4` = 16px）。

**规则**：
- 所有 padding / margin / gap 用 `--rk-space-*`，禁止硬编码 `px` 值
- 例外：`1px` 边框可用 `1px` 直接写（或 `var(--rk-border-width)`）

### Radius（圆角）

```css
--rk-radius-xs: 4px;
--rk-radius-sm: 6px;
--rk-radius-md: 10px;
--rk-radius-lg: 14px;
--rk-radius-xl: 20px;
--rk-radius-full: 9999px;   /* 胶囊形 */
```

**规则**：
- 按钮、输入框：`--rk-radius-md`
- 卡片、容器：`--rk-radius-lg`
- 标签、pill：`--rk-radius-full`

### Typography（排版）

#### 字体栈

```css
--rk-font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--rk-font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
--rk-font-serif: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
```

主题可覆盖字体栈（如 `editorial-kami` 将 `--rk-font-sans` 指向 serif）。

#### 字号

```css
--rk-text-xs: 11px;
--rk-text-sm: 13px;
--rk-text-base: 15px;   /* 正文基准 */
--rk-text-md: 17px;
--rk-text-lg: 20px;
--rk-text-xl: 26px;
--rk-text-2xl: 32px;
--rk-text-3xl: 40px;
--rk-text-4xl: 52px;
```

#### 字重

```css
--rk-weight-normal: 400;
--rk-weight-medium: 500;
--rk-weight-semibold: 600;
--rk-weight-bold: 700;
--rk-weight-extrabold: 800;
```

#### 行高

```css
--rk-lh-tight: 1.25;    /* 标题 */
--rk-lh-snug: 1.4;      /* 小标题 */
--rk-lh-normal: 1.6;    /* 正文 */
--rk-lh-relaxed: 1.75;  /* 长文 */
```

遗留别名 `--rk-lh: var(--rk-lh-normal)` 仍存在，新代码用 `--rk-lh-normal`。

#### 字间距

```css
--rk-tracking-tight: -0.01em;   /* 大标题 */
--rk-tracking-normal: 0;
--rk-tracking-wide: 0.02em;     /* 标签/uppercase */
--rk-tracking-mono: 0.04em;     /* 代码 */
```

#### 排版预设（Typography Presets）

组合 font-weight / size / line-height / font-family 的 shorthand：

```css
--rk-type-display: 800 52px / 1.25 var(--rk-font-sans);
--rk-type-h1: 700 40px / 1.25 var(--rk-font-sans);
--rk-type-h2: 700 32px / 1.4 var(--rk-font-sans);
--rk-type-h3: 600 26px / 1.4 var(--rk-font-sans);
--rk-type-h4: 600 20px / 1.6 var(--rk-font-sans);
--rk-type-body: 400 15px / 1.6 var(--rk-font-sans);
--rk-type-body-sm: 400 13px / 1.6 var(--rk-font-sans);
--rk-type-caption: 500 11px / 1.4 var(--rk-font-sans);
--rk-type-mono: 400 13px / 1.75 var(--rk-font-mono);
--rk-type-label: 600 11px / 1.25 var(--rk-font-sans);
```

**规则**：组件内排版优先用 `font: var(--rk-type-*)` shorthand，不要拆开写 `font-size` + `font-weight` + `line-height`。

### Shadow（阴影/层级）

```css
--rk-shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.06);
--rk-shadow-sm: ...;
--rk-shadow-md: ...;
--rk-shadow-lg: ...;
--rk-shadow-xl: ...;
--rk-shadow-inset: inset 0 1px 4px rgba(0, 0, 0, 0.08);
```

### Motion（动效）

```css
--rk-ease: 150ms ease;           /* 通用 */
--rk-ease-in: 120ms ease-in;
--rk-ease-out: 180ms ease-out;
--rk-ease-bounce: 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
--rk-duration-fast: 80ms;
--rk-duration-normal: 150ms;
--rk-duration-slow: 300ms;
```

### Z-index（层级）

```css
--rk-z-base: 0;
--rk-z-raised: 10;
--rk-z-sticky: 100;
--rk-z-overlay: 200;
--rk-z-dropdown: 300;
--rk-z-modal: 400;
--rk-z-toast: 500;
```

### 其他

```css
/* Icon 尺寸 */
--rk-icon-sm: 14px;
--rk-icon-md: 18px;
--rk-icon-lg: 24px;

/* 无障碍 */
--rk-focus-ring-width: 2px;
--rk-focus-ring-offset: 2px;
--rk-touch-target-min: 44px;

/* 边框 */
--rk-border-width: 1px;
--rk-border-width-strong: 2px;

/* 透明度 */
--rk-opacity-disabled: 0.4;
--rk-opacity-muted: 0.6;
--rk-opacity-hover: 0.85;

/* 密度乘数 */
--rk-density-compact: 0.7;
--rk-density-normal: 1;
--rk-density-comfortable: 1.3;

/* 打印 */
--rk-print-text: #1a1a1a;
--rk-print-border: #999;
--rk-print-link-color: #0000ee;
```

## 添加新 Token 的规则

1. 基础 token（不随主题变化的值）放在 `tokens.css` 的 `:root` 中
2. 语义 token（随主题变化的值）放在 `themes.css` 的 `[data-rk-theme="xxx"]` 中
3. 遵循 `--rk-{category}-{variant}` 命名
4. 不要在 `blocks.css` / `chrome.css` / `surfaces.css` 中定义新变量
