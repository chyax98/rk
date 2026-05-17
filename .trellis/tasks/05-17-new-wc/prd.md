# New WC Expansion — rk-kanban, rk-form, rk-mermaid-beautiful

## 目标

扩展 Web Component 生态，加入 3 个高价值新组件。

## 新组件

### rk-kanban（看板）

```html
<rk-kanban>
  <rk-kanban-col title="待办">
    <rk-kanban-card>修复登录 bug</rk-kanban-card>
    <rk-kanban-card priority="high">重写 CLI</rk-kanban-card>
  </rk-kanban-col>
  <rk-kanban-col title="进行中">
    <rk-kanban-card>设计系统扩展</rk-kanban-card>
  </rk-kanban-col>
  <rk-kanban-col title="完成" done>
    <rk-kanban-card>建立 worktree</rk-kanban-card>
  </rk-kanban-col>
</rk-kanban>
```

适用：项目状态展示、任务追踪。不需要拖拽，静态展示即可。

### rk-form（结构化表单）

```html
<rk-form title="设计方案评审" submit-label="提交意见">
  <rk-field label="整体评分" type="rating" max="5" required />
  <rk-field label="主要问题" type="textarea" placeholder="描述你的问题..." />
  <rk-field label="优先级" type="select" options="高,中,低" />
</rk-form>
```

适用：Agent 生成结构化反馈表单，人填写后输出给 Agent。

### rk-badge-group（标签组）

```html
<rk-badge-group>
  <rk-badge color="blue">TypeScript</rk-badge>
  <rk-badge color="green">Next.js</rk-badge>
  <rk-badge color="orange">实验性</rk-badge>
</rk-badge-group>
```

适用：技术栈、状态标签。

## 实现要求

- Light DOM（无 shadow DOM）
- 消费 `--rk-*` token（不硬编码颜色）
- 加入 `packages/components/src/bundle.ts` 注册
- 加入 `examples/capabilities/new-components.html` 示例

## 依赖

- 05-17-design-system（token 要先稳定）

## Status: planning
