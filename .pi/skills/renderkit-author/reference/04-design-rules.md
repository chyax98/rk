## 4. 设计规则（Anti-Slop）

来源：html-anything、md2html、open-design 最佳实践。

### ❗❗ HTML 语法硬性规则（最重要）

**禁止使用自闭合标签**（`<rk-field />`）写 Custom Elements。HTML5 解析器会把它当作开启标签，导致后续元素变成子元素。

```html
✗ 错误：
<rk-form title="...">
  <rk-field label="评分" type="rating" />
  <rk-field label="反馈" type="textarea" />
</rk-form>
<!-- 第二个 rk-field 被嵌套成第一个的子元素！ -->

✓ 正确：
<rk-form title="...">
  <rk-field label="评分" type="rating" required></rk-field>
  <rk-field label="反馈" type="textarea" placeholder="..."></rk-field>
</rk-form>
```

**所有容器元素必须用显式关闭标签**：`rk-form`、`rk-kanban`、`rk-grid`、`rk-tabs`、`rk-badge-group`、`rk-checklist`、`rk-metric`、`rk-card`、`rk-section`、`rk-diff`。

### 排版
- 正文宽度 **≤ 720px**（由系统自动控制，无需手动设置）
- 行高 **1.6–1.75**（中文用 1.75，英文用 1.6）
- 标题层级 **最多 3 层**（h1 → h2 → h3，不用 h4）
- 段落间距 > 行间距（`margin-bottom: 1.5em`）
- 不用纯黑纯白（交给主题 token 处理）

### 颜色
- **1 主色 + 2 中性色 + 至多 1 强调色**
- 让 `data-rk-theme` 管颜色，不要内联 `style="color: #xxx"` 覆盖主题
- 语义色用 `rk-callout type="warning"` 而不是手写橙色背景

### 字体
- 中文：`Noto Sans SC`（已通过 Google Fonts 自动加载）
- 英文：`Inter`（已通过 Google Fonts 自动加载）
- 代码：`JetBrains Mono`（已通过 Google Fonts 自动加载）
- 中英文之间加**半角空格**（盘古之白）：`API 接口` 而非 `API接口`

### 信息密度
- **不要 lorem ipsum**，用真实数据
- **不要 "Your text here"**，用真实内容
- 数字要有单位和上下文（`¥120万` 而非 `1200000`）
- 图表必须有 title，数据要有来源说明

### 结构
- 每个 `<h2>` 是一个 Section，用 `<section>` 包裹（可选但推荐）
- 关键信息用 `rk-callout`、`rk-summary`、`rk-metric` 突出
- 不要超过 3 层嵌套

---

