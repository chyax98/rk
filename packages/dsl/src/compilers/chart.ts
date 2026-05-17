import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import { validateChartType, validateChartTemplate } from '../renderer-validation.ts';
import type { RemarkNode, BlockAttrs, CompileContext, CompiledBlock } from '../types.ts';
import { pos, excerpt, rawDirectiveBody, directiveBodyText, plainText, diag } from '../helpers.ts';

/**
 * Chart block compiler.
 * Parses a markdown table body into columns/rows for ECharts recipe rendering.
 * Agent writes:
 *   :::chart{id="kpi" type="bar" template="report" title="Monthly Active" xField="Month" yField="Users"}
 *   | Month | Users |
 *   |---|---|
 *   | Jan | 1200 |
 *   :::
 */
export function compileChart(
  node: RemarkNode,
  attrs: BlockAttrs,
  source: string,
  errors: CompileContext['errors'],
  file: string,
): CompiledBlock {
  const columns: string[] = [];
  const rows: string[][] = [];

  // Extract table from remark AST children
  for (const child of node.children || []) {
    if (child.type === 'table') {
      const [head, ...bodyRows] = child.children || [];
      if (head) {
        for (const cell of head.children || []) {
          columns.push(plainText(cell));
        }
      }
      for (const row of bodyRows) {
        const cells: string[] = [];
        for (const cell of row.children || []) {
          cells.push(plainText(cell));
        }
        rows.push(cells);
      }
    }
  }

  // Fallback: try parsing pipe table from raw body
  if (columns.length === 0) {
    const body = rawDirectiveBody(source, node) || directiveBodyText(node);
    const parsed = parseBodyAsPipeTable(body);
    if (parsed.headers.length > 0) {
      columns.push(...parsed.headers);
      rows.push(...parsed.rows);
    }
  }

  if (columns.length === 0 && rows.length === 0) {
    errors.push(diag('RK_CHART_BODY_REQUIRED', 'chart directive requires a markdown table body', file, pos(node)));
  }

  const chartType = validateChartType(attrs.type);
  const template = validateChartTemplate(attrs.template);

  return {
    id: attrs.id!,
    type: 'chart' as const,
    props: {
      chartType,
      template,
      title: attrs.title || '',
      xField: attrs.xField || '',
      yField: attrs.yField || '',
      columns,
      rows,
      caption: attrs.caption || '',
      width: normalizeBlockWidth(attrs.width || attrs.span || 'wide'),
    },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position),
  };
}

function parseBodyAsPipeTable(body: string | undefined) {
  const lines = String(body || '').split('\n').map(l => l.trim()).filter(Boolean);
  const tableLines = lines.filter(l => l.includes('|'));
  if (tableLines.length < 2) return { headers: [], rows: [] };
  const header = splitRow(tableLines[0]);
  const sep = splitRow(tableLines[1]);
  if (!header.length || !sep.every(c => /^:?-{3,}:?$/.test(c.trim()))) return { headers: [], rows: [] };
  const rows = tableLines.slice(2).map(splitRow).filter(r => r.length).map(r => header.map((_, i) => r[i] || ''));
  return { headers: header, rows };
}

function splitRow(line: string): string[] {
  return String(line || '').replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
}
