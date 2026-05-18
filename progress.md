# Progress

## Status
Done — 5 example showcase documents pushed

## Tasks
- [x] `rk validate` CLI command (D2 syntax check, JSON validation, diagram empty check)
- [x] Pre-push validation warnings in `rk push` (non-blocking)
- [x] Skip ECharts SSR (too heavy, client-side works fine)
- [x] 5 showcase documents created and pushed

## Example Artifacts

| Document | Theme | URL |
|----------|-------|-----|
| Q2 数据分析报告 | linear-app | http://localhost:3737/a/art_2447500a68 |
| 系统架构文档 | dark-pro | http://localhost:3737/a/art_431aabc8bd |
| 项目状态看板 | notion-clean | http://localhost:3737/a/art_07fd89272e |
| 全球市场报告 | ibm-enterprise | http://localhost:3737/a/art_3ef97b1205 |
| 产品发布公告 | glassmorphism | http://localhost:3737/a/art_e564e3a6de |

## Component Coverage
35/44 components used across the 5 documents.

## Known Issues
- Mermaid SSR via Kroki fails on Chinese characters — client CDN fallback works fine
