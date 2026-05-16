# 顶级设计资源清单 / Top Design Resources Manifest

状态：已在本地 clone 并完成分析  
日期：2026-05-17  
本地 clone 根目录：`research/design-assets/external-repos/`

> 这些仓库作为本地研究资产保留，不会 vendoring 进 RenderKit git 历史，因为它们体积大且包含嵌套 `.git`。下方 commit hash 固定了已检查的状态。

## 中文速览

| 优先级 | 仓库 | 核心用途 | 当前状态 |
|---|---|---|---|
| P0 | `md2html` | 阅读优先文档排版、打印、无障碍、组件目录 | 已分析，部分 CSS 已吸收到主线 |
| P0 | `html-anything` | 共享反 slop 设计指令、skill 目录约定 | 已分析，authoring skill 已吸收 |
| P1 | `fireworks-tech-graph` + `thesvg` | 图表语义形状/箭头词汇、图标来源 | 已输出 diagram visual language 规范 |
| P1 | `ui-ux-pro-max-skill` | 设计智能数据库、配色/排版参考 | 已分析，token source map 已建档 |
| P2 | `guizang-ppt-skill` | 演示/幻灯片视觉系统、锁定布局 | 已分析，待 future `surface: deck` |

---

## Original English Manifest

Status: cloned locally and analyzed  
Date: 2026-05-17  
Local clone root: `research/design-assets/external-repos/`

> These repositories are kept as local research assets. They are intentionally not vendored into the RenderKit git history because they contain large external repos and nested `.git` directories. Commit hashes below pin the inspected state.

## Cloned repositories

| Repo | Local path | Commit | Size | License / note | Primary value for RenderKit |
|---|---:|---:|---:|---|---|
| `glincker/thesvg` | `research/design-assets/external-repos/thesvg` | `955931d3` | 96 MB | MIT code; brand icons/trademarks per owner | 6,030+ brand/cloud SVG icon assets, variants, CDN/package patterns |
| `yizhiyanhua-ai/fireworks-tech-graph` | `research/design-assets/external-repos/fireworks-tech-graph` | `9e68925` | 6.8 MB | MIT | Diagram design system: shape vocabulary, arrow semantics, 7 styles, SVG layout rules |
| `haidang1810/md2html` | `research/design-assets/external-repos/md2html` | `82fa59c` | 1.7 MB | MIT | Deterministic beautiful document template, CSS tokens, component catalog, TOC/print/a11y patterns |
| `nexu-io/html-anything` | `research/design-assets/external-repos/html-anything` | `b9f2002` | 28 MB | Apache-2.0; some skills may have upstream notices | Skill registry, shared design directives, 75 example templates, export pipeline |
| `op7418/guizang-ppt-skill` | `research/design-assets/external-repos/guizang-ppt-skill` | `3d87acc` | 4.3 MB | MIT | Polished HTML deck visual systems, locked layouts, validation workflow |
| `nextlevelbuilder/ui-ux-pro-max-skill` | `research/design-assets/external-repos/ui-ux-pro-max-skill` | `b7e3af8` | 17 MB | MIT | Searchable UI/UX design intelligence DB, palettes, typography, UX rules |

## Clone/update commands

```bash
cd research/design-assets/external-repos
for repo in \
  https://github.com/glincker/thesvg \
  https://github.com/yizhiyanhua-ai/fireworks-tech-graph.git \
  https://github.com/haidang1810/md2html.git \
  https://github.com/nexu-io/html-anything.git \
  https://github.com/op7418/guizang-ppt-skill.git \
  https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git; do
  name=$(basename "$repo" .git)
  if [ -d "$name/.git" ]; then git -C "$name" fetch --all --tags --prune; else git clone "$repo" "$name"; fi
done
```

## Raw worker analysis artifacts

The initial parallel worker analysis was written to temporary files:

```text
/tmp/renderkit-design-analysis-svg-graph.md
/tmp/renderkit-design-analysis-md-html.md
/tmp/renderkit-design-analysis-skills.md
```

Durable synthesis is stored in:

```text
research/design-assets/renderkit-external-design-resources-analysis.md
docs/product/renderkit-1.0-design-resource-integration-plan.md
```
