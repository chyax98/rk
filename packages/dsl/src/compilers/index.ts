/**
 * Compiler barrel — maps block type names to their compile functions.
 */
import type { BlockCompiler, BlockAttrs, CompileContext } from '../types.ts';
import { compileCallout } from './callout.ts';
import { compileChecklist } from './checklist.ts';
import { compileCode } from './code.ts';
import { compileComparison } from './comparison.ts';
import { compileDecision } from './decision.ts';
import { compileDiagram } from './diagram.ts';
import { compileGrid } from './grid.ts';
import { compileImage } from './image.ts';
import { compileQuote } from './quote.ts';
import { compileStat } from './stat.ts';
import { compileSummary } from './summary.ts';
import { compileTable } from './table.ts';
import { compileTabs } from './tabs.ts';
import { compileTimeline } from './timeline.ts';
import { compileChart } from './chart.ts';

export const BLOCK_COMPILERS: Record<string, BlockCompiler> = {
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

export function compileBlock(
  node: import('../types').RemarkNode,
  attrs: BlockAttrs,
  ctx: CompileContext,
): import('../types').CompiledBlock | null {
  return BLOCK_COMPILERS[node.name!]?.(node, attrs, ctx) ?? null;
}
