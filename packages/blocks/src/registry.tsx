import type { ComponentType } from 'react';
import CalloutBlock from './CalloutBlock';
import ChartBlock from './ChartBlock';
import ChecklistBlock from './ChecklistBlock';
import ComparisonBlock from './ComparisonBlock';
import CodeBlock from './code/CodeBlock';
import DecisionBlock from './DecisionBlock';
import DiagramBlock from './DiagramBlock';
import GridBlock from './GridBlock';
import HeadingBlock from './HeadingBlock';
import ImageBlock from './ImageBlock';
import ParagraphBlock from './ParagraphBlock';
import QuoteBlock from './QuoteBlock';
import StatBlock from './StatBlock';
import SummaryBlock from './SummaryBlock';
import TabsBlock from './TabsBlock';
import TimelineBlock from './TimelineBlock';
import TableBlock from './table/TableBlock';

/**
 * Block type → component registry.
 * Consumers may extend at runtime: import { registry } from '@renderkit/blocks'; registry['my-type'] = MyComp;
 */
export const registry: Record<string, ComponentType<any>> = {
  heading: HeadingBlock,
  paragraph: ParagraphBlock,
  summary: SummaryBlock,
  callout: CalloutBlock,
  'decision-card': DecisionBlock,
  code: CodeBlock,
  diagram: DiagramBlock,
  grid: GridBlock,
  table: TableBlock,
  image: ImageBlock,
  tabs: TabsBlock,
  stat: StatBlock,
  checklist: ChecklistBlock,
  quote: QuoteBlock,
  comparison: ComparisonBlock,
  timeline: TimelineBlock,
  chart: ChartBlock,
};
