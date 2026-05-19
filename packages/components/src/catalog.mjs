import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const elementsDir = path.join(here, 'elements');

const OVERRIDES = {
  'rk-3d': {
    attributes: ['scene', 'height', 'color', 'caption'],
    description:
      'Interactive 3D scene (Three.js CDN). scene=cube|sphere|torus|orbit, height, color, caption.',
  },
  'rk-callout': {
    attributes: ['tone', 'title'],
    description:
      'Callout box with tone variant (info, warning, danger, success, tip, decision, note)',
  },
  'rk-badge': {
    attributes: ['color', 'icon'],
    description: 'Inline status badge. color=blue|green|red|orange|purple|gray|accent, optional icon.',
  },
  'rk-badge-group': {
    description: 'Flex wrapper for multiple rk-badge items.',
  },
  'rk-card': {
    attributes: ['title', 'subtitle', 'variant', 'accent'],
    description: 'Generic content card. variant=default|outlined|elevated|filled, optional semantic accent.',
  },
  'rk-chart': {
    attributes: ['type', 'title', 'caption', 'xfield', 'yfield'],
    description: 'Chart: type=kpi renders KPI grid; other types use echarts',
  },
  'rk-checklist': {
    attributes: ['title'],
    description: 'Checklist reading rk-item child elements with checked/note attrs',
    childElements: ['rk-item'],
  },
  'rk-code': {
    attributes: ['lang', 'title', 'frame', 'showlinenumbers', 'data-highlighted'],
    description: 'Code block with optional editor/terminal frame and syntax highlighting',
  },
  'rk-datagrid': {
    attributes: ['title', 'height', 'theme', 'pagination', 'page-size'],
    description: 'Enterprise-style data grid powered by AG Grid. Expects JSON { columns, rows }.',
  },
  'rk-collapsible': {
    attributes: ['summary', 'open'],
    description: 'Collapsible section using native details/summary. open attr for default expanded.',
  },
  'rk-comparison': {
    attributes: ['title', 'variant'],
    description: 'Comparison: variant=proscons (two-col) or variant=matrix (table)',
  },
  'rk-decision': {
    attributes: ['question', 'chosen', 'status'],
    description: 'Decision card reading rk-reason and rk-alternative child elements',
    childElements: ['rk-reason', 'rk-alternative'],
  },
  'rk-diagram': {
    attributes: ['title', 'caption', 'engine'],
    description: 'Mermaid / D2 / Graphviz / PlantUML diagram renderer',
  },
  'rk-diff': {
    attributes: ['lang', 'title', 'from', 'to', 'compact'],
    description: 'Unified diff viewer for git-style patches with add/remove stats.',
  },
  'rk-field': {
    attributes: ['label', 'type', 'max', 'placeholder', 'options', 'required', 'name', 'value'],
    description: 'Form field primitive used inside rk-form. type=text|textarea|select|rating|checkbox|number.',
  },
  'rk-flow': {
    attributes: ['title', 'height', 'readonly'],
    description: 'Flow / DAG diagram powered by AntV X6. Expects JSON { nodes, edges }.',
  },
  'rk-form': {
    attributes: ['title', 'submit-label', 'description'],
    childElements: ['rk-field'],
    description: 'Structured input form composed from rk-field children.',
  },
  'rk-globe': {
    attributes: ['height', 'title', 'auto-rotate'],
    description: '3D globe visualization for latitude/longitude point datasets.',
  },
  'rk-graph': {
    attributes: ['title', 'height', 'layout'],
    description: '2D network / knowledge graph powered by Cytoscape. Expects JSON { nodes, edges }.',
  },
  'rk-graph3d': {
    attributes: ['title', 'height', 'dag'],
    description: '3D force-directed graph powered by 3d-force-graph. Expects JSON { nodes, links }.',
  },
  'rk-grid': {
    attributes: ['cols', 'gap'],
    description: 'CSS grid layout. cols=2|3|4, gap=sm|md|lg. Use rk-col children.',
    childElements: ['rk-col'],
  },
  'rk-highlight': {
    attributes: ['label'],
    description: 'Key-point highlight box with bold left border. label defaults to "要点".',
  },
  'rk-image': {
    attributes: ['src', 'alt', 'caption', 'credit', 'width'],
    description: 'Image with caption and credit. width=full|wide|normal.',
  },
  'rk-infographic': {
    attributes: ['title', 'height', 'theme'],
    description: 'Browser-rendered AntV infographic syntax to SVG.',
  },
  'rk-kanban': {
    childElements: ['rk-kanban-col', 'rk-kanban-card'],
    description: 'Kanban board container composed from rk-kanban-col children.',
  },
  'rk-kanban-card': {
    attributes: ['priority', 'tag', 'assignee', 'due'],
    description: 'Kanban card with optional priority, tag, assignee, and due metadata.',
  },
  'rk-kanban-col': {
    attributes: ['title', 'accent', 'done'],
    childElements: ['rk-kanban-card'],
    description: 'Column inside rk-kanban. title is required, accent/done tune state.',
  },
  'rk-map': {
    attributes: ['center', 'zoom', 'height', 'title', 'tiles'],
    description: 'Interactive Leaflet map with marker array JSON input.',
  },
  'rk-metric': {
    attributes: ['cols'],
    description: 'Compact metric row. cols=2|3|4. rk-metric-item[label,value,delta,tone] children.',
    childElements: ['rk-metric-item'],
  },
  'rk-model': {
    attributes: [
      'src',
      'poster',
      'title',
      'height',
      'ar',
      'auto-rotate',
      'camera-controls',
      'shadow-intensity',
      'exposure',
    ],
    description: '3D model viewer for GLTF/GLB assets using model-viewer.',
  },
  'rk-narrative': {
    attributes: ['title'],
    description: 'Inline narrative block with value highlights, badges, bars, and mini sparklines.',
  },
  'rk-plot': {
    attributes: ['title', 'caption', 'height'],
    description: 'Observable Plot wrapper for declarative statistical chart specs.',
  },
  'rk-plot3d': {
    attributes: ['title', 'height', 'caption'],
    description: 'Plotly.js 3D chart wrapper. Expects JSON with { data, layout?, config? }.',
  },
  'rk-progress': {
    attributes: ['label', 'value', 'max', 'tone'],
    description: 'Progress bar. tone=default|success|warning|danger.',
  },
  'rk-quote': {
    attributes: ['attribution', 'source', 'source-url'],
    description: 'Blockquote with attribution and optional source citation link.',
  },
  'rk-scroll-story': {
    attributes: ['offset'],
    childElements: ['rk-step'],
    description: 'Scroll-driven narrative sequence powered by Scrollama.',
  },
  'rk-section': {
    attributes: ['title', 'subtitle', 'level', 'divider'],
    description: 'Section wrapper with optional heading, subtitle, and divider.',
  },
  'rk-sketch': {
    attributes: ['width', 'height', 'roughness', 'title'],
    description: 'Hand-drawn SVG diagram renderer powered by Rough.js.',
  },
  'rk-stat': {
    attributes: ['value', 'unit', 'label', 'delta', 'tone'],
    description: 'Stat / metric card with optional delta indicator',
  },
  'rk-step': {
    attributes: ['offset'],
    description: 'Step item used inside rk-scroll-story and related step-based layouts.',
  },
  'rk-steps': {
    attributes: ['current'],
    description: 'Horizontal step indicator. current=1-based step number. rk-step children for labels.',
    childElements: ['rk-step'],
  },
  'rk-summary': {
    attributes: ['title'],
    description: 'Summary block with accent border',
  },
  'rk-table': {
    attributes: ['title', 'profile'],
    description: 'Table parsed from markdown pipe syntax; profile=status adds colored dots',
  },
  'rk-tabs': {
    attributes: ['title'],
    description: 'Tabbed content panel. Use rk-tab[label] children for each tab.',
    childElements: ['rk-tab'],
  },
  'rk-timeline': {
    attributes: ['title'],
    description: 'Timeline reading rk-step child elements with status/tags attrs',
    childElements: ['rk-step'],
  },
  'rk-zdog': {
    attributes: ['width', 'height', 'rotate', 'zoom', 'title'],
    description: 'Pseudo-3D illustration scene powered by Zdog.',
  },
};

function toTitleCase(tag) {
  return tag
    .split('-')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');
}

function extractClassBody(source, className) {
  const start = source.indexOf(`class ${className} `);
  if (start === -1) return '';
  const braceStart = source.indexOf('{', start);
  if (braceStart === -1) return '';

  let depth = 0;
  for (let i = braceStart; i < source.length; i += 1) {
    const char = source[i];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(braceStart + 1, i);
    }
  }
  return '';
}

function parseAttributes(source) {
  const match = source.match(/static\s+get\s+observedAttributes\(\)\s*\{\s*return\s*\[([\s\S]*?)\];?\s*\}/);
  if (!match) return [];
  return Array.from(match[1].matchAll(/'([^']+)'|"([^"]+)"/g), (item) => item[1] || item[2]);
}

function parseChildElements(source, selfTag) {
  const found = new Set();
  for (const match of source.matchAll(/querySelectorAll?\('([^']+)'\)/g)) {
    const selector = match[1];
    if (!selector.startsWith('rk-') || selector === selfTag) continue;
    found.add(selector);
  }
  return Array.from(found).sort();
}

function parseDefinitions(filename, source) {
  const defs = [];
  for (const match of source.matchAll(/customElements\.define\('([^']+)'\s*,\s*([A-Za-z0-9_]+)/g)) {
    const tag = match[1];
    const className = match[2];
    const classBody = extractClassBody(source, className);
    const override = OVERRIDES[tag] || {};
    const childElements = override.childElements || parseChildElements(classBody, tag);
    defs.push({
      tag,
      className,
      attributes: override.attributes || parseAttributes(classBody),
      childElements: childElements.length ? childElements : undefined,
      description: override.description || `Registered component from ${filename}.`,
      derived: !override.description,
    });
  }
  return defs;
}

export const COMPONENTS = fs
  .readdirSync(elementsDir)
  .filter((entry) => entry.endsWith('.ts'))
  .flatMap((entry) => {
    const source = fs.readFileSync(path.join(elementsDir, entry), 'utf8');
    return parseDefinitions(entry, source);
  })
  .sort((a, b) => a.tag.localeCompare(b.tag));

export const COMPONENTS_BY_TAG = Object.fromEntries(COMPONENTS.map((component) => [component.tag, component]));
