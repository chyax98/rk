/**
 * Core type definitions for the RenderKit DSL compiler.
 */
import type { Diagnostic, RenderKitBlock, SourceRange } from '@renderkit/shared';

// ── Remark AST node types (subset used by DSL) ──

export interface RemarkPosition {
  start: { line: number; column: number; offset?: number };
  end: { line: number; column: number; offset?: number };
}

export interface RemarkNode {
  type: string;
  name?: string;
  attributes?: Record<string, string | undefined>;
  children?: RemarkNode[];
  value?: string;
  depth?: number;
  lang?: string;
  position?: RemarkPosition;
}

// ── Compile context ──

export interface CompileContext {
  source: string;
  file: string;
  errors: Diagnostic[];
  warnings: Diagnostic[];
}

// ── Block attrs (all strings from remark-directive) ──

export type BlockAttrs = Record<string, string | undefined>;

// ── Compiled block ──

export type CompiledBlock = RenderKitBlock;

// ── Compiler signature ──

export type BlockCompiler = (
  node: RemarkNode,
  attrs: BlockAttrs,
  ctx: CompileContext,
) => CompiledBlock | null;

// ── Child block compile options ──

export interface ChildCompileOptions {
  index: number;
  disallow: Set<string>;
  errorCode: string;
  message: (name: string) => string;
  idFor: (parentAttrs: BlockAttrs, index: number) => string;
}

// ── Table parse result ──

export interface ParsedPipeTable {
  headers: string[];
  rows: string[][];
  align: string[];
}

// ── Chart types ──

export const CHART_TYPES = ['bar', 'line', 'pie', 'scatter', 'kpi'] as const;
export type ChartType = (typeof CHART_TYPES)[number];

export const CHART_TEMPLATES = ['default', 'minimal', 'report'] as const;
export type ChartTemplate = (typeof CHART_TEMPLATES)[number];

// ── Table profiles ──

export const TABLE_PROFILES = ['matrix', 'status', 'key-value', 'cards', 'compact'] as const;
export type TableProfile = (typeof TABLE_PROFILES)[number];

export const TABLE_RENDERERS = ['default', 'tanstack'] as const;
export type TableRenderer = (typeof TABLE_RENDERERS)[number];

// ── Code frame types ──

export const CODE_FRAMES = ['editor', 'terminal', 'none'] as const;
export type CodeFrame = (typeof CODE_FRAMES)[number];

export const CODE_RENDERERS = ['shiki', 'hljs'] as const;
export type CodeRenderer = (typeof CODE_RENDERERS)[number];

export const CODE_COPY_MODES = ['code', 'all'] as const;
export type CodeCopyMode = (typeof CODE_COPY_MODES)[number];

// ── Error codes (extensions) ──

export const DSL_ERROR_CODES = {
  RK_TABLE_TOO_MANY_COLUMNS: 'RK_TABLE_TOO_MANY_COLUMNS',
  RK_RENDERER_UNKNOWN: 'RK_RENDERER_UNKNOWN',
  RK_PROFILE_UNKNOWN: 'RK_PROFILE_UNKNOWN',
  RK_CHART_TYPE_REQUIRED: 'RK_CHART_TYPE_REQUIRED',
  RK_CHART_BODY_REQUIRED: 'RK_CHART_BODY_REQUIRED',
} as const;
