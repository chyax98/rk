import type { BlockType, RenderKitBlock } from '@renderkit/shared/contracts';
import type { ComponentType } from 'react';
import { registry } from './registry';

export type { BlockType, RenderKitBlock } from '@renderkit/shared/contracts';
export { registry } from './registry';
export type RenderKitBlockComponent<Props extends object = Record<string, unknown>> =
  ComponentType<Props>;
export type RenderKitRegistry = Record<string, RenderKitBlockComponent>;
export interface RenderBlockProps {
  block: RenderKitBlock;
}
export interface BlockFrameProps {
  block: { id: string; type: string; props?: Record<string, unknown> };
  selected?: boolean;
  commentCount?: number;
  commentStatus?: string | null;
  reviewMode?: boolean;
  onSelect?: () => void;
  onComment?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onOpenMenu?: (e: React.MouseEvent) => void;
}

export { default as BlockFrame } from './BlockFrame';
export { default as CalloutBlock } from './CalloutBlock';
export { default as ChartBlock } from './ChartBlock';
export { default as ChecklistBlock } from './ChecklistBlock';
export { default as ComparisonBlock } from './ComparisonBlock';
export { default as CodeBlock } from './code/CodeBlock';
export { default as DecisionBlock } from './DecisionBlock';
export { default as DiagramBlock } from './DiagramBlock';
export { createBlockDispatcher } from './dispatch';
export { default as EChartsBlock } from './EChartsBlock';
export { default as GridBlock } from './GridBlock';
export { default as HeadingBlock } from './HeadingBlock';
export { default as ImageBlock } from './ImageBlock';
export { default as MermaidDiagram } from './MermaidDiagram';
export { default as ParagraphBlock } from './ParagraphBlock';
export { default as QuoteBlock } from './QuoteBlock';
export { default as RenderBlock } from './RenderBlock';
export { default as StatBlock } from './StatBlock';
export { default as SummaryBlock } from './SummaryBlock';
export { default as TabsBlock } from './TabsBlock';
export { default as TimelineBlock } from './TimelineBlock';
export { default as TableBlock } from './table/TableBlock';
