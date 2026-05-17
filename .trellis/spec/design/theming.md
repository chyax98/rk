# 主题系统

## 语义 Token 清单

每套主题必须覆盖以下全部语义 token。`themes.css` 中每个 `[data-rk-theme="xxx"]` 块大约 120 个变量。

### 背景

| Token | 用途 |
|---|---|
| `--rk-bg` | 页面主背景色 |
| `--rk-bg-grad` | 页面渐变（`none` 或 gradient） |
| `--rk-surface` | 卡片/浮层背景（允许半透明） |
| `--rk-surface-solid` | 卡片/浮层不透明背景 |
| `--rk-surface-raised` | 提升层背景（略浅/深于 surface） |
| `--rk-surface-sunken` | 下沉层背景 |

### 文字

| Token | 用途 |
|---|---|
| `--rk-text` | 主文字色 |
| `--rk-text-secondary` | 次要文字 |
| `--rk-text-tertiary` | 辅助文字 |
| `--rk-muted` | 弱化文字（label/hint） |

### 强调

| Token | 用途 |
|---|---|
| `--rk-accent` | 主强调色 |
| `--rk-accent-hover` | 强调色 hover |
| `--rk-accent-muted` | 强调色低不透明度背景 |
| `--rk-accent-subtle` | 强调色极低不透明度背景 |

### 边框

| Token | 用途 |
|---|---|
| `--rk-border` | 默认边框色 |
| `--rk-border-hover` | hover 边框色 |
| `--rk-border-subtle` | 弱化边框 |

### 语气色（Tone）

| Token | 用途 |
|---|---|
| `--rk-tone-info-bg` | 信息背景 |
| `--rk-tone-info-border` | 信息边框 |
| `--rk-tone-warning-bg` | 警告背景 |
| `--rk-tone-warning-border` | 警告边框 |
| `--rk-tone-danger-bg` | 危险背景 |
| `--rk-tone-danger-border` | 危险边框 |
| `--rk-tone-success-bg` | 成功背景 |
| `--rk-tone-success-border` | 成功边框 |
| `--rk-tone-neutral-bg` | 中性背景 |
| `--rk-tone-neutral-border` | 中性边框 |

### 状态色

| Token | 用途 |
|---|---|
| `--rk-status-draft` | 草稿状态色 |
| `--rk-status-proposed` | 提议状态色 |
| `--rk-status-approved` | 已批准状态色 |
| `--rk-status-blocked` | 阻塞状态色 |
| `--rk-status-resolved` | 已解决状态色 |
| `--rk-status-orphaned` | 孤立状态色 |
| `--rk-status-*-bg` | 状态背景色（draft/proposed/approved/blocked/resolved/orphaned/open） |
| `--rk-status-*-text` | 状态文字色 |

### 标签/徽章

| Token | 用途 |
|---|---|
| `--rk-pill-bg` / `--rk-pill-text` | Pill 背景/文字 |
| `--rk-badge-bg` / `--rk-badge-text` | Badge 背景/文字 |
| `--rk-chip-bg` / `--rk-chip-text` / `--rk-chip-border` | Chip 背景/文字/边框 |

### 交互

| Token | 用途 |
|---|---|
| `--rk-focus-ring` | focus ring 颜色 |
| `--rk-selection-bg` | 文字选中背景 |

### 代码

| Token | 用途 |
|---|---|
| `--rk-code-bg` | 代码块背景 |
| `--rk-code-text` | 代码块文字 |
| `--rk-code-border` | 代码块边框 |

### 阴影

| Token | 用途 |
|---|---|
| `--rk-shadow` | 主题默认阴影（引用 tokens.css 中的 `--rk-shadow-*`） |

### App Chrome

| Token | 用途 |
|---|---|
| `--rk-topbar-bg` / `--rk-topbar-border` | 顶栏 |
| `--rk-rail-bg` / `--rk-rail-border` | 右侧栏 |
| `--rk-sidebar-bg` / `--rk-sidebar-border` | 左侧栏 |
| `--rk-overlay-bg` | 遮罩层 |

### 按钮

| Token | 用途 |
|---|---|
| `--rk-btn-primary` / `--rk-btn-primary-text` / `--rk-btn-primary-hover` | 主按钮 |
| `--rk-btn-secondary-bg` / `--rk-btn-secondary-text` / `--rk-btn-secondary-border` | 次按钮 |
| `--rk-btn-ghost-text` / `--rk-btn-ghost-hover` | 幽灵按钮 |

### 菜单

| Token | 用途 |
|---|---|
| `--rk-menu-bg` / `--rk-menu-border` | 菜单背景/边框 |
| `--rk-menu-item-hover` / `--rk-menu-item-active` | 菜单项交互 |
| `--rk-menu-separator` | 分隔线 |

### Inspector

| Token | 用途 |
|---|---|
| `--rk-inspector-bg` / `--rk-inspector-border` | 面板背景/边框 |
| `--rk-inspector-section-bg` | 区块背景 |

### Source

| Token | 用途 |
|---|---|
| `--rk-source-bg` | 源码容器背景 |
| `--rk-source-line-highlight` | 高亮行背景 |
| `--rk-source-line-number` | 行号文字色 |

### 滚动条

| Token | 用途 |
|---|---|
| `--rk-scrollbar-thumb` | 滚动条滑块 |
| `--rk-scrollbar-track` | 滚动条轨道 |

## 已有主题

| 主题 | `data-rk-theme` | `color-scheme` | 审美 |
|---|---|---|---|
| `paper-light` | `"paper-light"` | `light` | 温暖纸质，默认主题 |
| `dark-pro` | `"dark-pro"` | `dark` | 深色专业 |
| `amber-terminal` | `"amber-terminal"` | `dark` | 复古终端，琥珀色 |
| `editorial-kami` | `"editorial-kami"` | `light` | 日式编辑，serif-forward |

`paper-light` 也是 `:root` 默认值（不带 data 属性时生效）。

## 如何添加新主题

1. 在 `themes.css` 末尾添加 `[data-rk-theme="your-theme"]` 块
2. 设置 `color-scheme: light` 或 `dark`
3. 复制 `paper-light` 或 `dark-pro` 的完整 token 集作为起点
4. 逐个调整颜色值，确保：
   - `--rk-text` 与 `--rk-bg` 的对比度 ≥ 4.5:1（WCAG AA）
   - `--rk-accent` 足够醒目但不是大面积使用
   - `--rk-code-bg` 与 `--rk-code-text` 对比度足够
5. 如需覆盖字体栈，在主题块内重新定义 `--rk-font-sans` / `--rk-font-mono`（参考 `editorial-kami`）
6. 在 `:root` 选择器链中注册为备选（如果需要 `@media (prefers-color-scheme)` 自动匹配）

### 主题质量检查

- [ ] 所有语义 token 已定义（参考上方完整清单）
- [ ] `color-scheme` 声明正确
- [ ] 主文字/背景对比度 ≥ 4.5:1
- [ ] 代码块可读
- [ ] 按钮、菜单、card 在该主题下视觉正常
- [ ] 表格交替行、状态 badge 可辨认
- [ ] Scrollbar 与主题色调协调
