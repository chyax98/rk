// ─── Component registry (for CLI / tooling) ──────────────────────

export interface ComponentDescriptor {
  tag: string;
  className: string;
  attributes: string[];
  childElements?: string[];
  description: string;
}

export const COMPONENTS: readonly ComponentDescriptor[] = [
  {
    tag: 'rk-callout',
    className: 'RkCallout',
    attributes: ['tone', 'title'],
    description:
      'Callout box with tone variant (info, warning, danger, success, tip, decision, note)',
  },
  {
    tag: 'rk-stat',
    className: 'RkStat',
    attributes: ['value', 'unit', 'label', 'delta', 'tone'],
    description: 'Stat / metric card with optional delta indicator',
  },
  {
    tag: 'rk-summary',
    className: 'RkSummary',
    attributes: ['title'],
    description: 'Summary block with accent border',
  },
  {
    tag: 'rk-code',
    className: 'RkCode',
    attributes: ['lang', 'title', 'frame', 'showlinenumbers', 'data-highlighted'],
    description: 'Code block with optional editor/terminal frame and syntax highlighting',
  },
  {
    tag: 'rk-table',
    className: 'RkTable',
    attributes: ['title', 'profile'],
    description: 'Table parsed from markdown pipe syntax; profile=status adds colored dots',
  },
  {
    tag: 'rk-chart',
    className: 'RkChart',
    attributes: ['type', 'title', 'caption', 'xfield', 'yfield'],
    description: 'Chart: type=kpi renders KPI grid; other types use echarts',
  },
  {
    tag: 'rk-diagram',
    className: 'RkDiagram',
    attributes: ['title', 'caption', 'engine'],
    description: 'Mermaid diagram renderer with loading state',
  },
  {
    tag: 'rk-decision',
    className: 'RkDecision',
    attributes: ['question', 'chosen', 'status'],
    childElements: ['rk-reason', 'rk-alternative'],
    description: 'Decision card reading rk-reason and rk-alternative child elements',
  },
  {
    tag: 'rk-checklist',
    className: 'RkChecklist',
    attributes: ['title'],
    childElements: ['rk-item'],
    description: 'Checklist reading rk-item child elements with checked/note attrs',
  },
  {
    tag: 'rk-comparison',
    className: 'RkComparison',
    attributes: ['title', 'variant'],
    description: 'Comparison: variant=proscons (two-col) or variant=matrix (table)',
  },
  {
    tag: 'rk-timeline',
    className: 'RkTimeline',
    attributes: ['title'],
    childElements: ['rk-step'],
    description: 'Timeline reading rk-step child elements with status/tags attrs',
  },
  // ── v2 additions (9 new components) ──
  {
    tag: 'rk-tabs',
    className: 'RkTabs',
    attributes: ['title'],
    childElements: ['rk-tab'],
    description: 'Tabbed content panel. Use rk-tab[label] children for each tab.',
  },
  {
    tag: 'rk-grid',
    className: 'RkGrid',
    attributes: ['cols', 'gap'],
    childElements: ['rk-col'],
    description: 'CSS grid layout. cols=2|3|4, gap=sm|md|lg. Use rk-col children.',
  },
  {
    tag: 'rk-image',
    className: 'RkImage',
    attributes: ['src', 'alt', 'caption', 'credit', 'width'],
    description: 'Image with caption and credit. width=full|wide|normal.',
  },
  {
    tag: 'rk-quote',
    className: 'RkQuote',
    attributes: ['attribution', 'source', 'source-url'],
    description: 'Blockquote with attribution and optional source citation link.',
  },
  {
    tag: 'rk-collapsible',
    className: 'RkCollapsible',
    attributes: ['summary', 'open'],
    description: 'Collapsible section using native details/summary. open attr for default expanded.',
  },
  {
    tag: 'rk-highlight',
    className: 'RkHighlight',
    attributes: ['label'],
    description: 'Key-point highlight box with bold left border. label defaults to "要点".',
  },
  {
    tag: 'rk-progress',
    className: 'RkProgress',
    attributes: ['label', 'value', 'max', 'tone'],
    description: 'Progress bar. tone=default|success|warning|danger.',
  },
  {
    tag: 'rk-steps',
    className: 'RkSteps',
    attributes: ['current'],
    childElements: ['rk-step'],
    description: 'Horizontal step indicator. current=1-based step number. rk-step children for labels.',
  },
  {
    tag: 'rk-metric',
    className: 'RkMetric',
    attributes: ['cols'],
    childElements: ['rk-metric-item'],
    description: 'Compact metric row. cols=2|3|4. rk-metric-item[label,value,delta,tone] children.',
  },
  {
    tag: 'rk-3d',
    className: 'RkThreeD',
    attributes: ['scene', 'height', 'color', 'caption'],
    description:
      'Interactive 3D scene (Three.js CDN). scene=cube|sphere|torus|orbit, height, color, caption.',
  },
] as const;
