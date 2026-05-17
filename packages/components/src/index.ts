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
] as const;
