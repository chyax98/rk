import type { ComponentType } from 'react';
import CodeHljsBlock from './CodeHljsBlock';
import CodeShikiBlock from './CodeShikiBlock';
import type { CodeBlockProps, CodeRenderer } from './types';

const RENDERER_MAP: Record<CodeRenderer, ComponentType<CodeBlockProps>> = {
  shiki: CodeShikiBlock,
  hljs: CodeHljsBlock,
};

export default function CodeBlock(props: CodeBlockProps) {
  const renderer: CodeRenderer = (props.renderer as CodeRenderer) || 'shiki';
  const Component = RENDERER_MAP[renderer] || CodeShikiBlock;
  return <Component {...props} />;
}
