// ─── Schema version ───
export type RKSchemaVersion = '1.0';
export const RK_SCHEMA_VERSION: RKSchemaVersion = '1.0';

// ─── Block types ───
export const BLOCK_TYPES = Object.freeze([
  'heading',
  'paragraph',
  'summary',
  'callout',
  'decision-card',
  'code',
  'diagram',
  'grid',
  'table',
  'image',
  'tabs',
  'stat',
  'checklist',
  'quote',
  'comparison',
  'timeline',
  'chart',
] as const);
export type BlockType = (typeof BLOCK_TYPES)[number];

// ─── Themes ───
export const THEME_NAMES = Object.freeze([
  'paper-light',
  'editorial-kami',
  'dark-pro',
  'amber-terminal',
] as const);
export type ThemeName = (typeof THEME_NAMES)[number];

// ─── Surfaces ───
export const SURFACE_NAMES = Object.freeze([
  'engineering-plan',
  'decision-brief',
  'review-report',
  'runbook',
  'data-report-lite',
  'proposal',
  'documentation',
] as const);
export type SurfaceName = (typeof SURFACE_NAMES)[number];

// ─── Comment statuses ───
export const COMMENT_STATUSES = Object.freeze(['open', 'resolved', 'orphaned'] as const);
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

// ─── Diagram engines ───
export const DIAGRAM_ENGINES = Object.freeze([
  'mermaid',
  'svg',
  'echarts',
  'echarts-bar',
  'echarts-line',
  'echarts-pie',
  'infographic',
  'plantuml',
  'd2',
] as const);
export type DiagramEngine = (typeof DIAGRAM_ENGINES)[number];

export const SERVER_RENDERED_DIAGRAM_ENGINES = Object.freeze(['plantuml', 'd2'] as const);

// ─── Block widths ───
export const BLOCK_WIDTHS = Object.freeze(['full', 'wide', 'half', 'third', 'two-third'] as const);
export type BlockWidth = (typeof BLOCK_WIDTHS)[number];

// ─── Callout tones ───
export const CALLOUT_TONES = Object.freeze([
  'info',
  'warning',
  'danger',
  'success',
  'neutral',
] as const);
export type CalloutTone = (typeof CALLOUT_TONES)[number];

// ─── Defaults ───
export const DEFAULT_THEME: ThemeName = 'paper-light';
export const WIDE_REVIEW_SURFACES = Object.freeze([
  'engineering-plan',
  'review-report',
  'data-report-lite',
] as const);

// ─── Table profiles & renderers (renderer schema) ───
export const TABLE_PROFILES = Object.freeze([
  'matrix',
  'status',
  'key-value',
  'cards',
  'compact',
] as const);
export type TableProfile = (typeof TABLE_PROFILES)[number];

export const TABLE_RENDERERS = Object.freeze(['default', 'tanstack'] as const);
export type TableRenderer = (typeof TABLE_RENDERERS)[number];

// ─── Code frames & renderers (renderer schema) ───
export const CODE_FRAMES = Object.freeze(['editor', 'terminal', 'none'] as const);
export type CodeFrame = (typeof CODE_FRAMES)[number];

export const CODE_RENDERERS = Object.freeze(['shiki', 'hljs'] as const);
export type CodeRenderer = (typeof CODE_RENDERERS)[number];

export const CODE_COPY_MODES = Object.freeze(['code', 'all'] as const);
export type CodeCopyMode = (typeof CODE_COPY_MODES)[number];

// ─── Chart types & templates (renderer schema) ───
export const CHART_TYPES = Object.freeze(['bar', 'line', 'pie', 'scatter', 'kpi'] as const);
export type ChartType = (typeof CHART_TYPES)[number];

export const CHART_TEMPLATES = Object.freeze(['default', 'minimal', 'report'] as const);
export type ChartTemplate = (typeof CHART_TEMPLATES)[number];

// ─── Renderer schema ───
export const RENDERER_SCHEMA = {
  table: {
    profiles: TABLE_PROFILES,
    renderers: TABLE_RENDERERS,
    defaultProfile: 'matrix' as TableProfile,
    defaultRenderer: 'default' as TableRenderer,
    maxColumns: 6,
  },
  code: {
    frames: CODE_FRAMES,
    renderers: CODE_RENDERERS,
    defaultRenderer: 'shiki' as CodeRenderer,
    copyModes: CODE_COPY_MODES,
  },
  chart: {
    types: CHART_TYPES,
    templates: CHART_TEMPLATES,
    maxSeries: 5,
    maxLabels: 12,
  },
} as const;

// ─── Block aliases ───
export const BLOCK_ALIASES = Object.freeze({
  sum: { name: 'summary' },
  note: { name: 'callout', attrs: { tone: 'info' } },
  warn: { name: 'callout', attrs: { tone: 'warning' } },
  alert: { name: 'callout', attrs: { tone: 'danger' } },
  ok: { name: 'callout', attrs: { tone: 'success' } },
  dec: { name: 'decision-card' },
  fig: { name: 'diagram' },
  src: { name: 'code' },
  metric: { name: 'stat' },
  todo: { name: 'checklist' },
  compare: { name: 'comparison' },
  roadmap: { name: 'timeline' },
});

// ─── Error codes ───
export const ERROR_CODES = Object.freeze({
  RK_FRONTMATTER_INVALID: 'RK_FRONTMATTER_INVALID',
  RK_PARSE_ERROR: 'RK_PARSE_ERROR',
  RK_UNKNOWN_BLOCK_TYPE: 'RK_UNKNOWN_BLOCK_TYPE',
  RK_BLOCK_ID_REQUIRED: 'RK_BLOCK_ID_REQUIRED',
  RK_BLOCK_ID_INVALID: 'RK_BLOCK_ID_INVALID',
  RK_TAB_PARENT_REQUIRED: 'RK_TAB_PARENT_REQUIRED',
  RK_PROP_REQUIRED: 'RK_PROP_REQUIRED',
  RK_UNSUPPORTED_DIAGRAM_ENGINE: 'RK_UNSUPPORTED_DIAGRAM_ENGINE',
  RK_DIAGRAM_CODE_REQUIRED: 'RK_DIAGRAM_CODE_REQUIRED',
  RK_CODE_BODY_REQUIRED: 'RK_CODE_BODY_REQUIRED',
  RK_MODEL_CONTRACT_INVALID: 'RK_MODEL_CONTRACT_INVALID',
  RK_ARTIFACT_NOT_FOUND: 'RK_ARTIFACT_NOT_FOUND',
  RK_DUPLICATE_BLOCK_ID: 'RK_DUPLICATE_BLOCK_ID',
  RK_GRID_CHILD_UNSUPPORTED: 'RK_GRID_CHILD_UNSUPPORTED',
  RK_TABS_CHILD_UNSUPPORTED: 'RK_TABS_CHILD_UNSUPPORTED',
  RK_TABS_BLOCK_UNSUPPORTED: 'RK_TABS_BLOCK_UNSUPPORTED',
  RK_DECISION_YAML_INVALID: 'RK_DECISION_YAML_INVALID',
  RK_TABLE_BODY_REQUIRED: 'RK_TABLE_BODY_REQUIRED',
  RK_IMAGE_SRC_REQUIRED: 'RK_IMAGE_SRC_REQUIRED',
  RK_STAT_VALUE_REQUIRED: 'RK_STAT_VALUE_REQUIRED',
  RK_CHECKLIST_BODY_REQUIRED: 'RK_CHECKLIST_BODY_REQUIRED',
  RK_QUOTE_BODY_REQUIRED: 'RK_QUOTE_BODY_REQUIRED',
  RK_COMPARISON_BODY_REQUIRED: 'RK_COMPARISON_BODY_REQUIRED',
  RK_TIMELINE_BODY_REQUIRED: 'RK_TIMELINE_BODY_REQUIRED',
  RK_TABS_CHILD_REQUIRED: 'RK_TABS_CHILD_REQUIRED',
  RK_TABLE_TOO_MANY_COLUMNS: 'RK_TABLE_TOO_MANY_COLUMNS',
  RK_RENDERER_UNKNOWN: 'RK_RENDERER_UNKNOWN',
  RK_PROFILE_UNKNOWN: 'RK_PROFILE_UNKNOWN',
  RK_CHART_BODY_REQUIRED: 'RK_CHART_BODY_REQUIRED',
});

// ─── Type definitions (from former .d.ts) ───
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
  currentRevision: number;
  createdAt: string;
  updatedAt: string;
}

export interface ArtifactRevision {
  id: string;
  artifactId: string;
  number: number;
  sourceText: string;
  sourceHash: string;
  model: RenderKitModel;
  blockIds: string[];
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
  blockSnapshot?: RenderKitBlock | null;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  reopenedAt?: string;
}

export interface FeedbackItem {
  id: string;
  blockId: string;
  text: string;
  selector: TextQuoteSelector | null;
  status: Extract<CommentStatus, 'open' | 'orphaned'>;
  createdAtRevision: number;
  block: RenderKitBlock | null;
  blockSnapshot: RenderKitBlock | null;
  sourceRange?: SourceRange;
  sourceExcerpt?: string;
  neighbors: {
    prev: Array<Pick<RenderKitBlock, 'id' | 'type'>>;
    next: Array<Pick<RenderKitBlock, 'id' | 'type'>>;
  };
}

export interface FeedbackPayload {
  artifactId: string;
  currentRevision: number;
  url: string;
  openComments: FeedbackItem[];
}

export interface ArtifactBundle {
  meta: ArtifactMeta;
  revision: ArtifactRevision;
  comments: ArtifactComment[];
}

export interface ContractIssue {
  path: string;
  message: string;
}

export interface Recipe {
  label: string;
  description: string;
  recommendedTheme: ThemeName;
  recommendedBlocks: BlockType[];
  structure: string[];
  antiPatterns: string[];
}

export interface DesignRecommendation {
  surface: SurfaceName;
  theme: ThemeName;
  blocks: BlockType[];
  structure: string[];
  antiPatterns: string[];
  recipe: Recipe;
  designResources: Array<{
    id: string;
    priority: string;
    primaryValue: string;
    integrationStatus: string;
    recommendedUse: readonly string[];
    risks: readonly string[];
  }>;
  suggestedFrontmatter: {
    title: string;
    theme: ThemeName;
    surface: SurfaceName;
  };
  suggestedBlockOrder: Array<{
    blockType: BlockType;
    alias?: string;
    purpose: string;
  }>;
  authoringRules: string[];
  validation: string[];
}

// ─── Internal sets (non-exported) ───
const BLOCK_TYPE_SET = new Set<string>(BLOCK_TYPES);
const THEME_SET = new Set<string>(THEME_NAMES);
const SURFACE_SET = new Set<string>(SURFACE_NAMES);
const COMMENT_STATUS_SET = new Set<string>(COMMENT_STATUSES);
const DIAGRAM_ENGINE_SET = new Set<string>(DIAGRAM_ENGINES);
const BLOCK_WIDTH_SET = new Set<string>(BLOCK_WIDTHS);
const WIDE_REVIEW_SURFACE_SET = new Set<string>(WIDE_REVIEW_SURFACES);

// ─── Runtime validators ───
export function isKnownBlockType(type: string): type is BlockType {
  return BLOCK_TYPE_SET.has(type);
}
export function isKnownThemeName(theme: string): theme is ThemeName {
  return THEME_SET.has(theme);
}
export function isKnownSurfaceName(surface: string): surface is SurfaceName {
  return SURFACE_SET.has(surface);
}
export function isKnownCommentStatus(status: string): status is CommentStatus {
  return COMMENT_STATUS_SET.has(status);
}
export function isKnownDiagramEngine(engine: string): engine is DiagramEngine {
  return DIAGRAM_ENGINE_SET.has(engine);
}
export function normalizeBlockWidth(value: string | undefined): BlockWidth {
  if (!value) return 'full';
  const v = String(value).trim().toLowerCase();
  return BLOCK_WIDTH_SET.has(v) ? (v as BlockWidth) : 'full';
}
export function isWideReviewSurface(surface: string): boolean {
  return WIDE_REVIEW_SURFACE_SET.has(surface);
}
export function resolveBlockAlias(
  name: string,
  attrs: Record<string, string> = {},
): { name: string; attrs: Record<string, string> } {
  const alias = (BLOCK_ALIASES as Record<string, { name: string; attrs?: Record<string, string> }>)[
    name
  ];
  if (!alias) return { name, attrs };
  return { name: alias.name, attrs: { ...(alias.attrs || {}), ...attrs } };
}

// ─── Model validation ───
export function validateRenderKitModel(model: unknown): ContractIssue[] {
  const issues: ContractIssue[] = [];
  if (!isObject(model)) return [{ path: '$', message: 'model must be an object' }];
  const m = model as Record<string, unknown>;
  if (m.rk !== RK_SCHEMA_VERSION) issues.push(issue('$.rk', `expected ${RK_SCHEMA_VERSION}`));
  if (!nonEmptyString(m.title)) issues.push(issue('$.title', 'title must be a non-empty string'));
  if (typeof m.theme !== 'string' || !isKnownThemeName(m.theme))
    issues.push(issue('$.theme', `unknown theme ${JSON.stringify(m.theme)}`));
  if (m.surface != null && typeof m.surface !== 'string')
    issues.push(issue('$.surface', 'surface must be a string when present'));
  if (!Array.isArray(m.blocks)) issues.push(issue('$.blocks', 'blocks must be an array'));
  else
    (m.blocks as unknown[]).forEach((block, index) =>
      validateBlock(block, `$.blocks[${index}]`, issues),
    );
  return issues;
}

export function validateBlock(
  block: unknown,
  path = '$',
  issues: ContractIssue[] = [],
): ContractIssue[] {
  if (!isObject(block)) {
    issues.push(issue(path, 'block must be an object'));
    return issues;
  }
  const b = block as Record<string, unknown>;
  if (!nonEmptyString(b.id))
    issues.push(issue(`${path}.id`, 'block id must be a non-empty string'));
  if (typeof b.type !== 'string' || !isKnownBlockType(b.type))
    issues.push(issue(`${path}.type`, `unknown block type ${JSON.stringify(b.type)}`));
  if (!isObject(b.props)) issues.push(issue(`${path}.props`, 'props must be an object'));
  if (!isSourceRange(b.sourceRange))
    issues.push(issue(`${path}.sourceRange`, 'sourceRange must include startLine/endLine numbers'));
  if (typeof b.sourceExcerpt !== 'string')
    issues.push(issue(`${path}.sourceExcerpt`, 'sourceExcerpt must be a string'));

  const children = (b.props as Record<string, unknown>)?.children;
  if (children !== undefined) {
    if (!Array.isArray(children))
      issues.push(issue(`${path}.props.children`, 'children must be an array'));
    else
      (children as unknown[]).forEach((child, index) =>
        validateBlock(child, `${path}.props.children[${index}]`, issues),
      );
  }

  const tabs = (b.props as Record<string, unknown>)?.tabs;
  if (tabs !== undefined) {
    if (!Array.isArray(tabs)) issues.push(issue(`${path}.props.tabs`, 'tabs must be an array'));
    else
      (tabs as Record<string, unknown>[]).forEach((tab, tabIndex) => {
        const tabPath = `${path}.props.tabs[${tabIndex}]`;
        const t = tab as Record<string, unknown>;
        if (!isObject(tab)) issues.push(issue(tabPath, 'tab must be an object'));
        if (!nonEmptyString(t.label))
          issues.push(issue(`${tabPath}.label`, 'tab label must be a non-empty string'));
        if (!Array.isArray(t.blocks))
          issues.push(issue(`${tabPath}.blocks`, 'tab blocks must be an array'));
        else
          (t.blocks as unknown[]).forEach((child, blockIndex) =>
            validateBlock(child, `${tabPath}.blocks[${blockIndex}]`, issues),
          );
      });
  }

  return issues;
}

export function validateTextQuoteSelector(selector: unknown): ContractIssue[] {
  const issues: ContractIssue[] = [];
  if (selector == null) return issues;
  if (!isObject(selector)) return [issue('$', 'selector must be an object')];
  const s = selector as Record<string, unknown>;
  if (s.type !== 'TextQuoteSelector')
    issues.push(issue('$.type', 'selector type must be TextQuoteSelector'));
  if (!nonEmptyString(s.exact))
    issues.push(issue('$.exact', 'selector exact must be a non-empty string'));
  for (const field of ['prefix', 'suffix'] as const) {
    if (s[field] != null && typeof s[field] !== 'string')
      issues.push(issue(`$.${field}`, `${field} must be a string when present`));
  }
  return issues;
}

// ─── Internal helpers ───
function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
function isSourceRange(value: unknown): value is SourceRange {
  if (!isObject(value)) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.startLine === 'number' &&
    Number.isFinite(obj.startLine) &&
    typeof obj.endLine === 'number' &&
    Number.isFinite(obj.endLine)
  );
}
function issue(path: string, message: string): ContractIssue {
  return { path, message };
}
