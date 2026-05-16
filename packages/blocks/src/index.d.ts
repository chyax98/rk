import type { ComponentType, ReactNode } from 'react';
import type { RenderKitBlock, BlockType } from '@renderkit/shared/contracts';

export interface BlockFrameProps {
  id: string;
  type: BlockType;
  children: ReactNode;
  selected?: boolean;
  comments?: unknown[];
  onSelect?: (id: string) => void;
  onComment?: (id: string) => void;
  onCommand?: (command: string, blockId: string) => void;
  reviewMode?: boolean;
  width?: 'normal' | 'wide' | 'full' | 'half' | 'third' | string;
}

export interface RenderBlockProps {
  block: RenderKitBlock;
}

export type RenderKitBlockComponent<Props extends object = Record<string, unknown>> = ComponentType<Props>;
export type RenderKitRegistry = Partial<Record<BlockType, RenderKitBlockComponent>> & Record<string, RenderKitBlockComponent>;

export const registry: RenderKitRegistry;

export const BlockFrame: ComponentType<BlockFrameProps>;
export const RenderBlock: ComponentType<RenderBlockProps>;
export const HeadingBlock: RenderKitBlockComponent;
export const ParagraphBlock: RenderKitBlockComponent;
export const SummaryBlock: RenderKitBlockComponent;
export const CalloutBlock: RenderKitBlockComponent;
export const DecisionBlock: RenderKitBlockComponent;
export const CodeBlock: RenderKitBlockComponent;
export const DiagramBlock: RenderKitBlockComponent;
export const MermaidDiagram: RenderKitBlockComponent;
export const GridBlock: RenderKitBlockComponent;
export const TableBlock: RenderKitBlockComponent;
export const ImageBlock: RenderKitBlockComponent;
export const TabsBlock: RenderKitBlockComponent;
export const StatBlock: RenderKitBlockComponent;
export const ChecklistBlock: RenderKitBlockComponent;
export const QuoteBlock: RenderKitBlockComponent;
export const ComparisonBlock: RenderKitBlockComponent;
export const TimelineBlock: RenderKitBlockComponent;
export const EChartsBlock: RenderKitBlockComponent;

export default RenderBlock;
