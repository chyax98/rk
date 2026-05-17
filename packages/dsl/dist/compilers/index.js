import { compileCallout } from './callout.js';
import { compileChecklist } from './checklist.js';
import { compileCode } from './code.js';
import { compileComparison } from './comparison.js';
import { compileDecision } from './decision.js';
import { compileDiagram } from './diagram.js';
import { compileGrid } from './grid.js';
import { compileImage } from './image.js';
import { compileQuote } from './quote.js';
import { compileStat } from './stat.js';
import { compileSummary } from './summary.js';
import { compileTable } from './table.js';
import { compileTabs } from './tabs.js';
import { compileTimeline } from './timeline.js';
import { compileChart } from './chart.js';
export const BLOCK_COMPILERS = {
    'callout': (node, attrs, ctx) => compileCallout(node, attrs, ctx.source),
    'checklist': (node, attrs, ctx) => compileChecklist(node, attrs, ctx.source, ctx.errors, ctx.file),
    'code': (node, attrs, ctx) => compileCode(node, attrs, ctx.source, ctx.errors, ctx.file),
    'comparison': (node, attrs, ctx) => compileComparison(node, attrs, ctx.source, ctx.errors, ctx.file),
    'decision-card': (node, attrs, ctx) => compileDecision(node, attrs, ctx.source, ctx.errors, ctx.file),
    'diagram': (node, attrs, ctx) => compileDiagram(node, attrs, ctx.source, ctx.errors, ctx.file),
    'grid': (node, attrs, ctx) => compileGrid(node, attrs, ctx),
    'image': (node, attrs, ctx) => compileImage(node, attrs, ctx.source, ctx.errors, ctx.file),
    'quote': (node, attrs, ctx) => compileQuote(node, attrs, ctx.source, ctx.errors, ctx.file),
    'stat': (node, attrs, ctx) => compileStat(node, attrs, ctx.source, ctx.errors, ctx.file),
    'summary': (node, attrs, ctx) => compileSummary(node, attrs, ctx.source),
    'table': (node, attrs, ctx) => compileTable(node, attrs, ctx.source, ctx.errors, ctx.file),
    'tabs': (node, attrs, ctx) => compileTabs(node, attrs, ctx),
    'timeline': (node, attrs, ctx) => compileTimeline(node, attrs, ctx.source, ctx.errors, ctx.file),
    'chart': (node, attrs, ctx) => compileChart(node, attrs, ctx.source, ctx.errors, ctx.file),
};
export const KNOWN_BLOCK_TYPES = new Set([...Object.keys(BLOCK_COMPILERS), 'tab']);
export function compileBlock(node, attrs, ctx) {
    return BLOCK_COMPILERS[node.name]?.(node, attrs, ctx) ?? null;
}
//# sourceMappingURL=index.js.map