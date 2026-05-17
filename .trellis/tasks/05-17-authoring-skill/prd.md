# Agent Authoring Skill — RenderKit Complete Guide

## 目标

给 AI Agent 写一份完整的 RenderKit 使用手册，作为 skill 注入 Agent 上下文。Agent 读完这个 skill 就能：
1. 知道用哪个主题（`data-rk-theme="xxx"`）
2. 知道每个 WC 怎么写（带可复制的示例）
3. 知道 anti-slop 设计规则
4. 知道 push → feedback → iterate 完整循环

## 产出文件

1. `.pi/skills/renderkit-author/SKILL.md` — 主 skill 文件（Agent 读）
2. `docs/authoring-guide.md` — 完整参考文档（人读）
3. `examples/capabilities/` — 更新所有示例，确保每个都是高质量 HTML

## Skill 内容结构

```
SKILL.md
├── 1. 快速开始（10 行能用起来）
├── 2. 主题系统（8 套主题，各适用场景）
├── 3. 完整 WC 参考（21 个组件，每个有最小示例）
├── 4. 设计规则（anti-slop，排版，颜色）
├── 5. CLI 工作流（push / feedback / open）
└── 6. 最佳实践（结构、密度、可读性）
```

## Anti-slop 规则（从参考 repo 提炼）

来源：`html-anything` shared.ts、`md2html` 排版规范、`open-design` DESIGN.md：
- 正文宽度 ≤ 720px
- 行高 1.6-1.75
- 不用纯黑纯白，用 #0a0a0a / #fafafa
- 中英文之间空格（盘古之白）
- 段落间距 > 行间距
- 最多 3 层标题层级

## 依赖

- 05-17-design-system（先有完整主题清单）
- 05-17-diagram-kroki（先有完整 WC 能力）
- 05-17-cli-rewrite（先有可用 CLI）

## Status: planning（等 P0/P1 完成后再实现）
