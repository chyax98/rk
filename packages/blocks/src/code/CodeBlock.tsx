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
