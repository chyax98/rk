# Progress

## Status
Wave 3 - A11y cleanup DONE

## Tasks
- CLI commands 拆分为 12 个独立 command 模块
- lib/lock.ts 修复 lock 路径格式
- CLI src/ 结构：commands/ + lib/
- Mermaid SVG a11y 清理
  - sanitizeSvg 移除 <style> 标签（防止 CSS 内容被 read-text 读到）
  - SVG 注入 <title> + <desc> + aria-labelledby
  - 所有 <text> 元素标记 aria-hidden="true"
  - DiagramBlock server-rendered SVG 同样处理
  - SourceFallback 文案中文化

## Files Changed
- packages/cli/src/commands/*.ts (12 个命令)
- packages/cli/src/index.ts (主入口)
- packages/cli/src/lib/http.ts
- packages/cli/src/lib/lock.ts
- packages/cli/src/lib/output.ts
- packages/cli/src/lib/open.ts (新增)
- packages/blocks/src/MermaidDiagram.tsx (重写)
- packages/blocks/src/DiagramBlock.tsx (重写)

## Notes
- bin/renderkit.mjs 保持不动，作为运行时入口
- src/ 为 TypeScript 参考实现
