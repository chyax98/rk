import HeadingBlock from './HeadingBlock';
import ParagraphBlock from './ParagraphBlock';
import SummaryBlock from './SummaryBlock';
import CalloutBlock from './CalloutBlock';
import DecisionBlock from './DecisionBlock';
import CodeBlock from './CodeBlock';
import DiagramBlock from './DiagramBlock';
import GridBlock from './GridBlock';
import TableBlock from './TableBlock';
import ImageBlock from './ImageBlock';
import TabsBlock from './TabsBlock';
import StatBlock from './StatBlock';
import ChecklistBlock from './ChecklistBlock';
import QuoteBlock from './QuoteBlock';
import ComparisonBlock from './ComparisonBlock';
import TimelineBlock from './TimelineBlock';

/**
 * Block type → component registry.
 * Consumers may extend at runtime: import { registry } from '@renderkit/blocks'; registry['my-type'] = MyComp;
 */
export const registry = {
  'heading': HeadingBlock,
  'paragraph': ParagraphBlock,
  'summary': SummaryBlock,
  'callout': CalloutBlock,
  'decision-card': DecisionBlock,
  'code': CodeBlock,
  'diagram': DiagramBlock,
  'grid': GridBlock,
  'table': TableBlock,
  'image': ImageBlock,
  'tabs': TabsBlock,
  'stat': StatBlock,
  'checklist': ChecklistBlock,
  'quote': QuoteBlock,
  'comparison': ComparisonBlock,
  'timeline': TimelineBlock,
};
