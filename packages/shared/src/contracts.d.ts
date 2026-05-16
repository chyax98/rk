export type RKSchemaVersion = '1.0';

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'summary'
  | 'callout'
  | 'decision-card'
  | 'code'
  | 'diagram'
  | 'subdocument'
  | 'grid'
  | 'table'
  | 'image'
  | 'tabs'
  | 'stat'
  | 'checklist'
  | 'quote'
  | 'comparison'
  | 'timeline';

export type ThemeName = 'paper-light' | 'editorial-kami' | 'dark-pro' | 'amber-terminal';
export type SurfaceName = 'engineering-plan' | 'decision-brief' | 'review-report' | 'runbook' | 'data-report-lite';
export type CommentStatus = 'open' | 'resolved' | 'orphaned';
export type DiagramEngine = 'mermaid' | 'svg' | 'echarts' | 'echarts-bar' | 'echarts-line' | 'echarts-pie' | 'infographic' | 'plantuml' | 'd2';
export type BlockWidth = 'full' | 'wide' | 'half' | 'third' | 'two-third';
export type CalloutTone = 'info' | 'warning' | 'danger' | 'success' | 'neutral';

export interface SourceRange {
  startLine: number;
  startColumn?: number;
  endLine: number;
  endColumn?: number;
  startOffset?: number;
  endOffset?: number;
}

export interface Diagnostic {
  code: string;
  message: string;
  file?: string;
  range?: SourceRange;
}

export interface RenderKitBlock<TProps extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  type: BlockType;
  props: TProps;
  sourceRange: SourceRange;
  sourceExcerpt: string;
}

export interface RenderKitModel {
  rk: RKSchemaVersion;
  title: string;
  template?: string;
  theme: ThemeName;
  /** Unknown surfaces may be preserved with a warning for Agent experimentation. */
  surface?: SurfaceName | (string & {});
  blocks: RenderKitBlock[];
}

export interface ParseResult {
  ok: boolean;
  model: RenderKitModel | null;
  errors: Diagnostic[];
  warnings: Diagnostic[];
}

export interface ArtifactMeta {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  latestRevision: number;
}

export interface ArtifactRevision {
  artifactId: string;
  revision: number;
  source: string;
  model: RenderKitModel;
  createdAt: string;
}

export interface TextQuoteSelector {
  type: 'TextQuoteSelector';
  exact: string;
  prefix?: string;
  suffix?: string;
}

export interface ArtifactComment {
  id: string;
  artifactId: string;
  blockId: string;
  text: string;
  selector: TextQuoteSelector | null;
  status: CommentStatus;
  createdAtRevision: number;
  resolvedAtRevision?: number;
  blockSnapshot?: RenderKitBlock;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface FeedbackItem {
  id: string;
  blockId: string;
  text: string;
  selector: TextQuoteSelector | null;
  status: Extract<CommentStatus, 'open' | 'orphaned'>;
  createdAtRevision: number;
  sourceRange?: SourceRange;
  sourceExcerpt?: string;
}

export interface FeedbackPayload {
  ok: boolean;
  artifactId: string;
  revision: number;
  comments: FeedbackItem[];
}

export interface ContractIssue {
  path: string;
  message: string;
}

export const RK_SCHEMA_VERSION: RKSchemaVersion;
export const BLOCK_TYPES: readonly BlockType[];
export const THEME_NAMES: readonly ThemeName[];
export const SURFACE_NAMES: readonly SurfaceName[];
export const COMMENT_STATUSES: readonly CommentStatus[];
export const DIAGRAM_ENGINES: readonly DiagramEngine[];
export const SERVER_RENDERED_DIAGRAM_ENGINES: readonly Extract<DiagramEngine, 'plantuml' | 'd2'>[];
export const BLOCK_WIDTHS: readonly BlockWidth[];
export const CALLOUT_TONES: readonly CalloutTone[];
export const DEFAULT_THEME: ThemeName;
export const WIDE_REVIEW_SURFACES: readonly Extract<SurfaceName, 'engineering-plan' | 'review-report' | 'data-report-lite'>[];
export const BLOCK_ALIASES: Readonly<Record<string, { name: BlockType; attrs?: Record<string, string> }>>;
export const ERROR_CODES: Readonly<Record<string, string>>;

export function isKnownBlockType(type: unknown): type is BlockType;
export function isKnownThemeName(theme: unknown): theme is ThemeName;
export function isKnownSurfaceName(surface: unknown): surface is SurfaceName;
export function isKnownCommentStatus(status: unknown): status is CommentStatus;
export function isKnownDiagramEngine(engine: unknown): engine is DiagramEngine;
export function normalizeBlockWidth(value: unknown): BlockWidth;
export function isWideReviewSurface(surface: unknown): surface is Extract<SurfaceName, 'engineering-plan' | 'review-report' | 'data-report-lite'>;
export function resolveBlockAlias(name: string, attrs?: Record<string, string>): { name: BlockType | string; attrs: Record<string, string> };
export function validateRenderKitModel(model: unknown): ContractIssue[];
export function validateBlock(block: unknown, path?: string, issues?: ContractIssue[]): ContractIssue[];
export function validateTextQuoteSelector(selector: unknown): ContractIssue[];
