import type { ComponentType, ReactNode } from 'react';

export interface BlockFrameProps {
  block: {
    id: string;
    type: string;
    props?: Record<string, unknown>;
  };
  selected?: boolean;
  commentCount?: number;
  commentStatus?: string | null;
  reviewMode?: boolean;
  onSelect?: () => void;
  onComment?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onOpenMenu?: (e: React.MouseEvent) => void;
}

export interface RenderBlockProps {
  block: {
    id: string;
    type: string;
    props?: Record<string, unknown>;
    [k: string]: unknown;
  };
}

export type TableProfile = 'matrix' | 'status' | 'key-value' | 'cards' | 'compact';
export type TableRenderer = 'default' | 'tanstack';
export type CodeFrame = 'editor' | 'terminal' | 'none';
export type CodeRenderer = 'shiki' | 'hljs';
export type CopyMode = 'code' | 'all';
export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'kpi';
export type ChartTemplate = 'default' | 'minimal' | 'report';

export interface TableBlockProps {
  title?: string;
  caption?: string;
  columns: string[];
  rows: string[][];
  align?: string[];
  profile?: TableProfile;
  renderer?: TableRenderer;
  width?: string;
}

export interface CodeBlockProps {
  language?: string;
  title?: string;
  code: string;
  filename?: string;
  frame?: CodeFrame;
  showLineNumbers?: boolean;
  highlight?: string;
  diff?: boolean;
  copyMode?: CopyMode;
  renderer?: CodeRenderer;
}

export interface ChartBlockProps {
  chartType: ChartType;
  template?: ChartTemplate;
  title?: string;
  xField?: string;
  yField?: string;
  columns: string[];
  rows: string[][];
  caption?: string;
}

export type RenderKitBlockComponent<Props extends object = Record<string, unknown>> = ComponentType<Props>;
export type RenderKitRegistry = Record<string, RenderKitBlockComponent>;

export const registry: RenderKitRegistry;
export function createBlockDispatcher<P extends Record<string, unknown>>(
  variants: Record<string, ComponentType<P>>,
  resolveKey: (props: P) => string
): ComponentType<P>;

export const BlockFrame: ComponentType<BlockFrameProps>;
export const RenderBlock: ComponentType<RenderBlockProps>;
export const HeadingBlock: RenderKitBlockComponent;
export const ParagraphBlock: RenderKitBlockComponent;
export const SummaryBlock: RenderKitBlockComponent;
export const CalloutBlock: RenderKitBlockComponent;
export const DecisionBlock: RenderKitBlockComponent;
export const CodeBlock: RenderKitBlockComponent<CodeBlockProps>;
export const DiagramBlock: RenderKitBlockComponent;
export const MermaidDiagram: RenderKitBlockComponent;
export const GridBlock: RenderKitBlockComponent;
export const TableBlock: RenderKitBlockComponent<TableBlockProps>;
export const ImageBlock: RenderKitBlockComponent;
export const TabsBlock: RenderKitBlockComponent;
export const StatBlock: RenderKitBlockComponent;
export const ChecklistBlock: RenderKitBlockComponent;
export const QuoteBlock: RenderKitBlockComponent;
export const ComparisonBlock: RenderKitBlockComponent;
export const TimelineBlock: RenderKitBlockComponent;
export const EChartsBlock: RenderKitBlockComponent;
export const ChartBlock: RenderKitBlockComponent<ChartBlockProps>;

export default RenderBlock;
