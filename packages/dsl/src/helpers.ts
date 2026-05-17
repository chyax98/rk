/**
 * Shared helper functions for all DSL compilers.
 * Pure functions with no side effects.
 */
import type { RemarkNode, RemarkPosition, ParsedPipeTable } from './types';

// ── Position / source helpers ──

export function pos(node: RemarkNode): import('@renderkit/shared').SourceRange {
  const p = node.position || ({} as Partial<RemarkPosition>);
  return {
    startLine: p.start?.line || 1,
    startColumn: p.start?.column || 1,
    endLine: p.end?.line || p.start?.line || 1,
    endColumn: p.end?.column || p.start?.column || 1,
    startOffset: p.start?.offset,
    endOffset: p.end?.offset,
  };
}

export function rangeFromOffsets(
  source: string,
  start: number,
  end: number,
): import('@renderkit/shared').SourceRange {
  const before = source.slice(0, start).split('\n');
  const body = source.slice(start, end).split('\n');
  return {
    startLine: before.length,
    startColumn: before.at(-1)!.length + 1,
    endLine: before.length + body.length - 1,
    endColumn: body.at(-1)!.length + 1,
    startOffset: start,
    endOffset: end,
  };
}

export function excerpt(source: string, position?: RemarkPosition): string {
  if (!position?.start || !position?.end) return '';
  if (typeof position.start.offset === 'number' && typeof position.end.offset === 'number')
    return source.slice(position.start.offset, position.end.offset);
  const lines = source.split('\n');
  return lines.slice(position.start.line - 1, position.end.line).join('\n');
}

export function rawDirectiveBody(source: string, node: RemarkNode): string {
  const raw = excerpt(source, node.position);
  const lines = raw.split('\n');
  if (lines.length <= 2) return '';
  return lines.slice(1, -1).join('\n').trim();
}

// ── Text extraction ──

export function plainText(node: RemarkNode | null | undefined): string {
  if (!node) return '';
  if (typeof node.value === 'string') return node.value;
  return (node.children || []).map(plainText).join('');
}

function listText(node: RemarkNode): string {
  return (node.children || []).map(item => '- ' + plainText(item)).join('\n');
}

export function directiveBodyText(node: RemarkNode): string {
  const parts: string[] = [];
  for (const child of node.children || []) {
    if (child.type === 'paragraph') parts.push(plainText(child));
    else if (child.type === 'code') parts.push(child.value || '');
    else if (child.type === 'list') parts.push(listText(child));
    else parts.push(plainText(child));
  }
  return parts.join('\n\n').trim();
}

// ── Markdown parsing ──

export function markdownBullets(body: string): string[] {
  return String(body || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.replace(/^[-*]\s+/, ''));
}

export function parsePipeTable(body: string): ParsedPipeTable {
  const lines = String(body || '').split('\n').map(l => l.trim()).filter(Boolean);
  const tableLines = lines.filter(l => l.includes('|'));
  if (tableLines.length < 2) return { headers: [], rows: [], align: [] };
  const header = splitTableRow(tableLines[0]);
  const sep = splitTableRow(tableLines[1]);
  if (!header.length || !sep.every(isSeparatorCell)) return { headers: [], rows: [], align: [] };
  const align = sep.map(cell => {
    const t = cell.trim();
    if (t.startsWith(':') && t.endsWith(':')) return 'center';
    if (t.endsWith(':')) return 'right';
    return 'left';
  });
  const rows = tableLines.slice(2).map(splitTableRow).filter(r => r.length).map(r => header.map((_, i) => r[i] || ''));
  return { headers: header, rows, align };
}

function splitTableRow(line: string): string[] {
  return String(line || '').replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
}

function isSeparatorCell(cell: string): boolean {
  return /^:?-{3,}:?$/.test(String(cell || '').trim());
}

export function parseTimelineItems(body: string): Array<{ status: string; label: string; body: string }> {
  return String(body || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const cleaned = line.replace(/^[-*]\s+/, '').trim();
      const m = cleaned.match(/^\[([^\]]+)\]\s*(.+)$/);
      const status = (m?.[1] || 'next').trim().toLowerCase();
      const rest = (m?.[2] || cleaned).trim();
      const split = rest.indexOf(':');
      return {
        status,
        label: split >= 0 ? rest.slice(0, split).trim() : rest,
        body: split >= 0 ? rest.slice(split + 1).trim() : '',
      };
    })
    .filter(item => item.label);
}

export function parseChecklistItems(body: string): Array<{ checked: boolean; text: string }> {
  return String(body || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const m = line.match(/^[-*]\s+\[(x|X| |-)\]\s+(.+)$/);
      if (m) return { checked: m[1].toLowerCase() === 'x', text: m[2].trim() };
      return { checked: false, text: line.replace(/^[-*]\s+/, '').trim() };
    })
    .filter(item => item.text);
}

export function stripFenceLikeBody(body: string): string {
  const text = String(body || '').trim();
  if (!text) return '';
  return text.replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/\n?```$/, '').trim();
}

export function findCode(node: RemarkNode): RemarkNode | null {
  const stack = [...(node.children || [])];
  while (stack.length) {
    const n = stack.shift()!;
    if (n.type === 'code') return n;
    if (n.children) stack.push(...n.children);
  }
  return null;
}

export function firstHeading(blocks: Array<{ type: string; props?: Record<string, unknown> }>): string | undefined {
  return blocks.find(b => b.type === 'heading')?.props?.text as string | undefined;
}

// ── Diagnostic factory ──

export function diag(
  code: string,
  message: string,
  file: string,
  range: import('@renderkit/shared').SourceRange | null = null,
): import('@renderkit/shared').Diagnostic {
  return { code, message, file, ...(range || {}) };
}

// ── Tree walking ──

export function collectDirectiveIds(tree: RemarkNode): Set<string> {
  const ids = new Set<string>();
  walkNodes(tree, node => {
    if ((node.type === 'containerDirective' || node.type === 'leafDirective') && node.attributes?.id)
      ids.add(String(node.attributes.id));
  });
  return ids;
}

export function walkNodes(node: RemarkNode | null, visit: (node: RemarkNode) => void): void {
  if (!node) return;
  visit(node);
  for (const child of node.children || []) walkNodes(child, visit);
}
