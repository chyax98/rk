import HeadingBlock from './HeadingBlock.jsx';
import ParagraphBlock from './ParagraphBlock.jsx';
import SummaryBlock from './SummaryBlock.jsx';
import CalloutBlock from './CalloutBlock.jsx';
import DecisionBlock from './DecisionBlock.jsx';
import CodeBlock from './CodeBlock.jsx';
import DiagramBlock from './DiagramBlock.jsx';
import GridBlock from './GridBlock.jsx';
import TableBlock from './TableBlock.jsx';
import ImageBlock from './ImageBlock.jsx';
import TabsBlock from './TabsBlock.jsx';
import StatBlock from './StatBlock.jsx';
import ChecklistBlock from './ChecklistBlock.jsx';
import QuoteBlock from './QuoteBlock.jsx';
import ComparisonBlock from './ComparisonBlock.jsx';
import TimelineBlock from './TimelineBlock.jsx';

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
