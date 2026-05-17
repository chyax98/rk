export type CodeFrame = 'editor' | 'terminal' | 'none';
export type CodeRenderer = 'shiki' | 'hljs';
export type CopyMode = 'code' | 'all';

export interface CodeBlockProps {
  language?: string;
  title?: string;
  code: string;
  filename?: string;
  frame?: CodeFrame;
  showLineNumbers?: boolean;
  highlight?: string; // '1,3-5'
  diff?: boolean;
  copyMode?: CopyMode;
  renderer?: CodeRenderer;
}
