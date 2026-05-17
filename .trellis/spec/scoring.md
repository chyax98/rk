# RenderKit 质量评分标准

> 更新时间：2026-05-18

## 评分维度（各 20 分，总分 100）

### 1. 渲染质量（20 分）

| 项目 | 分值 | 当前状态 |
|---|---|---|
| 24 个 WC 全部渲染正确 | 8 | ✅ 已验证 |
| 4 种图表引擎工作（Mermaid/D2/Graphviz/PlantUML）| 4 | ✅ 已验证 |
| ECharts JSON 多系列 + K/M 格式化 | 4 | ✅ 已验证 |
| 无 hydration 错误 | 4 | ✅ 已修复（html-processor 剥离完整 HTML 包装） |

**当前：17/20**（D2 未在真实浏览器验证 -1，部分主题 Mermaid 颜色不完美 -1，rk-3d 依赖 CDN 离线不可用 -1）

### 2. 设计系统（20 分）

| 项目 | 分值 | 当前状态 |
|---|---|---|
| 8 套主题完整覆盖所有 token | 8 | ✅ |
| Token 系统（spacing/typography/color/radius）| 4 | ✅ |
| Mermaid 主题感知（`--rk-*` token 映射）| 4 | ❌ 未集成 beautiful-mermaid |
| 打印 CSS | 2 | ⚠️ 基础 |
| 无障碍（skip-link、aria、focus ring）| 2 | ⚠️ skip-link 存在但 WC 内无 aria |

**当前：16/20**

### 3. CLI 成熟度（20 分）

| 项目 | 分值 | 当前状态 |
|---|---|---|
| push/feedback/open/status/serve 全部工作 | 10 | ✅ |
| 错误处理和用户友好提示 | 5 | ⚠️ 基础错误消息 |
| rk feedback 包含表单提交数据（submissions）| 5 | ❌ rk-form 提交只 console.log |

**当前：18/20**

### 4. 测试覆盖（20 分）

| 项目 | 分值 | 当前状态 |
|---|---|---|
| WC 单元测试（至少 24 个 HTML fixture）| 8 | ❌ 0 个测试 |
| html-processor 单元测试 | 4 | ❌ 0 个测试 |
| CLI 集成测试（push→feedback 循环）| 4 | ⚠️ verify-smoke.ts 存在但引用旧文件 |
| 视觉回归测试 HTML 文件 | 4 | ⚠️ 8 个示例 HTML |

**当前：8/20**

### 5. 生产就绪（20 分）

| 项目 | 分值 | 当前状态 |
|---|---|---|
| 无 JS console error | 5 | ⚠️ viz-standalone.js 可能加载失败 |
| 性能（首屏 <100ms TTFB）| 5 | ✅ SQLite 足够快 |
| 无障碍合规 | 5 | ❌ WC 内无 aria 属性 |
| 文档完整（SKILL.md + decisions.md + design-system.md）| 5 | ✅ |

**当前：12/20**

---

## 总分

| 维度 | 分数 |
|---|---|
| 渲染质量 | 17/20 |
| 设计系统 | 16/20 |
| CLI 成熟度 | 18/20 |
| 测试覆盖 | 8/20 |
| 生产就绪 | 12/20 |
| **总计** | **71/100** |

## 目标：99/100

### 待完成项（+28 分）

1. **beautiful-mermaid 集成**（+4 设计系统）：移植 CSS 变量推导到 rk-diagram
2. **rk-form 服务端提交 API**（+5 CLI）：POST /api/artifacts/:id/submissions
3. **WC 单元测试套件**（+8 测试）：24 个 HTML fixture + 自动化验证
4. **html-processor 单元测试**（+4 测试）：body 提取、anchor 注入、Kroki SSR
5. **WC aria 属性**（+3 生产）：role、aria-label、aria-live
6. **打印 CSS 完善**（+1 设计）：md2html 打印样式参考
7. **D2 真实浏览器验证**（+1 渲染）
8. **viz-standalone.js 错误处理**（+2 生产）：fallback 提示
