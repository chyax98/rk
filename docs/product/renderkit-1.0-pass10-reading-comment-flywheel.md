# RenderKit 1.0 第 10 轮飞轮：阅读可访问性与轻量评论体验

状态：已实现并验证  
日期：2026-05-17

## 目标

本轮继续落实用户要求：主体展示必须是文档阅读界面，不要让评论、元信息、调试细节压过正文；细节应该留给服务端、CLI 和 Agent 处理，页面只承载阅读与评论。

本轮整合了两个 `kimi-for-coding` worker 的方向：

1. 参考 `md2html` 的阅读、打印、可访问性经验。
2. 优化评论筛选、侧边标记和 selector re-anchor。

## 主要改动

### 1. 阅读与可访问性

改动文件：

```text
apps/web/app/layout.jsx
apps/web/app/style.css
packages/design/src/tokens.css
packages/design/src/blocks.css
```

新增能力：

- `跳到正文` skip link，键盘 Tab 可聚焦。
- `main#rk-main` 作为正文锚点。
- 全局 `:focus-visible` 焦点样式。
- 最小触控目标 token：`--rk-touch-target-min: 44px`。
- 打印样式增强：隐藏浮动工具、drawer、菜单、评论操作、copy 按钮；压缩表格；代码块适配打印；标题避免孤立分页。
- `prefers-reduced-motion`：用户要求减少动效时关闭动画/过渡。
- `prefers-contrast: more`：高对比偏好下加粗边框和可见焦点。
- block 文本增加更稳的换行策略。

注意：worker 曾建议把页面 `lang` 改成 `en`，但这是中文区项目，所以主线保留 `zh-CN`。

### 2. 评论筛选

改动文件：

```text
apps/web/app/a/[id]/ArtifactView.jsx
apps/web/app/style.css
```

新增筛选：

```text
待处理 open
已失效 orphaned
已解决 resolved
全部 all
```

默认筛选是 `open`，符合“阅读优先、不要让评论过重”的原则。

### 3. 轻量侧边标记

改动文件：

```text
packages/blocks/src/BlockFrame.jsx
apps/web/app/style.css
```

`BlockFrame` 新增：

```text
data-rk-comment-status="open|resolved|orphaned"
```

Review mode 下有评论的 block 会显示轻量左侧 rail：

- open：accent 色；
- resolved：muted 灰色；
- orphaned：warning 色。

Reading mode 仍保持之前的轻量 dot，不显示沉重评论面板。

### 4. selector re-anchor 改进

改动文件：

```text
apps/web/app/a/[id]/ArtifactView.jsx
```

改进点：

- 选中文本时用真实 DOM Range 提取 prefix/suffix，而不是只用 `innerText.indexOf()` 匹配第一个出现位置。
- 高亮恢复时会收集所有 exact text 候选，再用 prefix/suffix overlap 评分选最佳位置。
- 这让重复短语场景下的评论高亮更稳定。

### 5. Agent 元信息默认折叠

`BlockInspector` 中 source range / source excerpt / props 仍保留，但放入折叠的 `Agent metadata`，不再默认占据评论面板主要位置。

这符合用户要求：

> 页面只需要承载阅读、评论；细节都在服务端和 CLI 交互，让 Agent 去处理。

## 验证

### 自动验证

```bash
pnpm verify
# Results: 212 passed, 0 failed

pnpm verify:smoke
# Results: 24 passed, 0 failed

pnpm verify:sqlite
# Results: 102 passed, 0 failed
```

### 浏览器验证（pw）

测试 artifact：

```text
art_4239ba918e
http://localhost:3737/a/art_4239ba918e
```

验证命令覆盖：

```bash
pw errors -s rk-cmt-ux
pw get -s rk-cmt-ux --selector '.rk-floating-tools' --fact text
pw click -s rk-cmt-ux --selector '.rk-floating-tools button[title="Toggle review mode"]'
pw get -s rk-cmt-ux --selector '.rk-comment-filters button' --fact count
pw get -s rk-cmt-ux --selector '.rk-comment-card[data-status="resolved"]' --fact count
pw get -s rk-cmt-ux --selector '.rk-comment-card[data-status="open"]' --fact count
pw press -s rk-cmt-ux Tab
pw get -s rk-cmt-ux --selector '.rk-skip-link' --fact text
```

观察结果：

```text
pw errors = 0 visible errors
reading toolbar = Review☰💬⎘
.rk-comment-filters button count = 4
.rk-comment-card[data-status="resolved"] count = 1
.rk-comment-card[data-status="open"] count = 1
.rk-block[data-rk-comment-status="open"] count = 1
.rk-skip-link text = 跳到正文
```

截图证据：

```text
.pw-evidence/comment-filters-flywheel-review.png
.pw-evidence/reading-a11y-skiplink-flywheel.png
```

## 取舍说明

- 没有把评论做成大型协作系统；当前仍是本地 Agent-to-UI review surface。
- 没有让 Web UI 编辑正文；所有编辑仍由 Agent 修改 `.rk.md` 并 push revision。
- 没有引入新依赖；本轮主要是 UI/UX 和 CSS 改进。
- 没有把所有 worker 建议照单全收，例如 `lang="en"` 被拒绝，因为项目中文优先。

## 后续

1. 增加自动 Playwright spec，减少手工 `pw` 命令依赖。
2. 对 selection comment 的 re-anchor 做更多编辑后回归测试。
3. 把外部设计资源继续中文化总结，尤其是 `ui-ux-pro-max` 与 `md2html`。
4. TypeScript contracts 放在 1.0 后期架构收口阶段。
