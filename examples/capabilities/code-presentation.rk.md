---
title: Code Presentation
version: 1
theme: paper-light
surface: engineering-plan
---

# Code Presentation

:::code{id="typescript-ex" language="tsx" filename="packages/blocks/src/code/CodeBlock.tsx" frame="editor" showLineNumbers="true" highlight="3,8-12"}
```tsx
import { CodeBlockProps, CodeRenderer } from './types';
import CodeShikiBlock from './CodeShikiBlock';
import CodeHljsBlock from './CodeHljsBlock';

const RENDERER_MAP: Record<CodeRenderer, React.ComponentType<CodeBlockProps>> = {
  'shiki': CodeShikiBlock,
  'hljs': CodeHljsBlock,
};

export default function CodeBlock(props: CodeBlockProps) {
  const renderer: CodeRenderer = (props.renderer as CodeRenderer) || 'shiki';
  const Component = RENDERER_MAP[renderer] || CodeShikiBlock;
  return <Component {...props} />;
}
```
:::

:::code{id="bash-ex" language="bash" frame="terminal" copyMode="code"}
```bash
$ pnpm install
$ pnpm dev
$ renderkit validate examples/plan.rk.md --json
```
:::

:::code{id="json-ex" language="json" diff="true"}
```json
{
-  "strict": false,
+  "strict": true,
   "allowJs": true
}
```
:::

:::code{id="long-line" language="typescript" frame="none"}
```typescript
// This is a very long line that should not break the layout but instead wrap or scroll gracefully within the code block container without causing horizontal overflow on the page itself
```
:::
