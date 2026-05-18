## 7. 关键警告

### 自闭合标签（最常见的坑）

**永远不要**对 Custom Elements 使用自闭合语法。HTML5 规范只允许 `void elements`（如 `<br>`、`<img>`）自闭合。Custom Elements 必须有显式关闭标签：

```html
✗ <rk-field label="评分" type="rating" />
✗ <rk-metric-item value="42" />
✗ <rk-badge color="blue">TS</rk-badge />   ← 这更是灾难

✓ <rk-field label="评分" type="rating"></rk-field>
✓ <rk-metric-item value="42"></rk-metric-item>
✓ <rk-badge color="blue">TS</rk-badge>     ← 有文本内容时自然关闭
```

### 容器元素必须正确关闭

`rk-form`、`rk-kanban`、`rk-grid`、`rk-tabs`、`rk-badge-group`、`rk-checklist`、`rk-metric`、`rk-steps`、`rk-timeline`、`rk-card`、`rk-section` 都是容器，必须有对应的 `</rk-xxx>`。

### 图表引擎选择

- **Mermaid**: 通用流程图/序列图，服务端 SSR，失败回退客户端
- **Graphviz**: 依赖图/关系图，服务端 Kroki SSR
- **PlantUML**: UML 图，服务端 Kroki SSR
- **D2**: 架构图，服务端 spawn d2 binary（需 `rk doctor` 检测安装）

### CDN 懒加载

大部分可视化组件（rk-chart、rk-plot、rk-map、rk-globe、rk-graph、rk-flow、rk-datagrid、rk-plot3d、rk-graph3d、rk-sketch、rk-zdog、rk-infographic、rk-model）依赖外部 CDN 库。首次渲染时加载，之后缓存。**确保网络可达 `cdn.jsdelivr.net` 和 `ajax.googleapis.com`**。

---


## 8. 评论系统

文档是产品核心，评论是轻量附加功能。

### 交互方式
1. 悬停文档块 → 右侧出现浮动 `+` 按钮
2. 点击 `+` → 评论面板从右侧滑入（**固定浮层，不影响文档宽度**）
3. 输入评论文本 → `Cmd+Enter` 提交
4. 有评论的块显示角标数字
5. 点击评论卡片 → 文档滚动定位到对应块
6. 悬停评论卡片 → 显示编辑/删除按钮

### Agent 读取评论
```bash
rk feedback my-doc.html
# 返回 JSON，含所有 open 评论 + renderErrors + submissions
```

### 评论数据结构
每条评论包含：
- `id`: 评论 ID
- `anchor`: 对应文档块的锚点（`anc_0`, `anc_3` 等）
- `text`: 评论文本
- `status`: `open` | `resolved`
- `createdAt`: 创建时间

---

## 9. 版本历史

每次 `rk push` 创建新版本（revision），版本号自动递增。

```bash
rk push report.html    # revision 1
rk push report.html    # revision 2（修改后重新推送）
rk status report.html  # 查看当前版本号
```

版本数据存储在 SQLite 数据库中，支持历史版本回溯。

---

## 10. 服务器启动

```bash
# 启动本地 RenderKit 服务器
rk serve
# 或
pnpm dev

# 默认端口：3737
# 环境变量覆盖：RENDERKIT_ENDPOINT=http://custom:port
```

服务器提供：
- HTML 处理（Shiki 代码高亮 + 图表 SSR + anchor 注入）
- 评论 API
- Render Error API（客户端渲染失败自动上报）
- Artifact 存储（SQLite）

---


## 12. 常见错误与排障

### 错误 1：自闭合标签导致布局错乱

**症状**：第二个 `<rk-field>` 或 `<rk-metric-item>` 嵌套到了前一个里面。
**原因**：HTML5 规范不允许 Custom Elements 自闭合。
**修复**：所有 `<rk-*>` 都必须写 `</rk-xxx>` 关闭标签。

```html
✗ <rk-field label="评分" type="rating" />
✓ <rk-field label="评分" type="rating"></rk-field>
```

### 错误 2：图表 Y 轴数字显示不友好

**症状**：Y 轴显示 98000、150000 等大数字，轴标签重叠。
**解决**：rk-chart 内置 K/M 格式化，确保数据是纯数字（不要加千位逗号）：

```html
✗ { "users": "98,000" }  ← 字符串，不触发格式化
✓ { "users": 98000 }      ← 数字，自动显示 98K
```

### 错误 3：图表不显示

**可能原因**：
1. CDN 加载失败 — 检查网络连接（`cdn.jsdelivr.net`）
2. 语法错误 — 检查浏览器 Console
3. 自闭合标签 — 确认 `</rk-diagram>` 显式关闭

### 错误 4：主题不生效

**检查项**：
1. `<body data-rk-theme="paper-light">` 写在 `<body>` 标签上
2. `<link rel="stylesheet" href="/rk/theme.css">` 在 `<head>` 中
3. 主题名拼写正确（参考 §2 主题列表）
4. 不要在 body 上写 `style` 覆盖主题变量

### 错误 5：rk push 后页面空白

**可能原因**：
1. HTML 没有包含 `<script type="module" src="/rk/components.js">`
2. HTML 没有包含 `<link rel="stylesheet" href="/rk/components.css">`
3. 服务器未启动 — 先 `rk serve` 或 `pnpm dev`

### 错误 6：D2 图表显示错误

**可能原因**：
1. 本地未安装 d2 binary — 运行 `rk doctor` 检查
2. 安装命令：`curl -fsSL https://d2lang.com/install.sh | sh -s --`
3. 安装后重新 `rk push` 即可
