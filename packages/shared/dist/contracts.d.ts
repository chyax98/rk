export type RKSchemaVersion = '1.0';
export declare const RK_SCHEMA_VERSION: RKSchemaVersion;
export declare const BLOCK_TYPES: readonly ["heading", "paragraph", "summary", "callout", "decision-card", "code", "diagram", "grid", "table", "image", "tabs", "stat", "checklist", "quote", "comparison", "timeline", "chart"];
export type BlockType = typeof BLOCK_TYPES[number];
export declare const THEME_NAMES: readonly ["paper-light", "editorial-kami", "dark-pro", "amber-terminal"];
export type ThemeName = typeof THEME_NAMES[number];
export declare const SURFACE_NAMES: readonly ["engineering-plan", "decision-brief", "review-report", "runbook", "data-report-lite", "proposal", "documentation"];
export type SurfaceName = typeof SURFACE_NAMES[number];
export declare const COMMENT_STATUSES: readonly ["open", "resolved", "orphaned"];
export type CommentStatus = typeof COMMENT_STATUSES[number];
export declare const DIAGRAM_ENGINES: readonly ["mermaid", "svg", "echarts", "echarts-bar", "echarts-line", "echarts-pie", "infographic", "plantuml", "d2"];
export type DiagramEngine = typeof DIAGRAM_ENGINES[number];
export declare const SERVER_RENDERED_DIAGRAM_ENGINES: readonly ["plantuml", "d2"];
export declare const BLOCK_WIDTHS: readonly ["full", "wide", "half", "third", "two-third"];
export type BlockWidth = typeof BLOCK_WIDTHS[number];
export declare const CALLOUT_TONES: readonly ["info", "warning", "danger", "success", "neutral"];
export type CalloutTone = typeof CALLOUT_TONES[number];
export declare const DEFAULT_THEME: ThemeName;
export declare const WIDE_REVIEW_SURFACES: readonly ["engineering-plan", "review-report", "data-report-lite"];
export declare const TABLE_PROFILES: readonly ["matrix", "status", "key-value", "cards", "compact"];
export type TableProfile = typeof TABLE_PROFILES[number];
export declare const TABLE_RENDERERS: readonly ["default", "tanstack"];
export type TableRenderer = typeof TABLE_RENDERERS[number];
export declare const CODE_FRAMES: readonly ["editor", "terminal", "none"];
export type CodeFrame = typeof CODE_FRAMES[number];
export declare const CODE_RENDERERS: readonly ["shiki", "hljs"];
export type CodeRenderer = typeof CODE_RENDERERS[number];
export declare const CODE_COPY_MODES: readonly ["code", "all"];
export type CodeCopyMode = typeof CODE_COPY_MODES[number];
export declare const CHART_TYPES: readonly ["bar", "line", "pie", "scatter", "kpi"];
export type ChartType = typeof CHART_TYPES[number];
export declare const CHART_TEMPLATES: readonly ["default", "minimal", "report"];
export type ChartTemplate = typeof CHART_TEMPLATES[number];
export declare const RENDERER_SCHEMA: {
    readonly table: {
        readonly profiles: readonly ["matrix", "status", "key-value", "cards", "compact"];
        readonly renderers: readonly ["default", "tanstack"];
        readonly defaultProfile: TableProfile;
        readonly defaultRenderer: TableRenderer;
        readonly maxColumns: 6;
    };
    readonly code: {
        readonly frames: readonly ["editor", "terminal", "none"];
        readonly renderers: readonly ["shiki", "hljs"];
        readonly defaultRenderer: CodeRenderer;
        readonly copyModes: readonly ["code", "all"];
    };
    readonly chart: {
        readonly types: readonly ["bar", "line", "pie", "scatter", "kpi"];
        readonly templates: readonly ["default", "minimal", "report"];
        readonly maxSeries: 5;
        readonly maxLabels: 12;
    };
};
export declare const BLOCK_ALIASES: Readonly<{
    sum: {
        name: string;
    };
    note: {
        name: string;
        attrs: {
            tone: string;
        };
    };
    warn: {
        name: string;
        attrs: {
            tone: string;
        };
    };
    alert: {
        name: string;
        attrs: {
            tone: string;
        };
    };
    ok: {
        name: string;
        attrs: {
            tone: string;
        };
    };
    dec: {
        name: string;
    };
    fig: {
        name: string;
    };
    src: {
        name: string;
    };
    metric: {
        name: string;
    };
    todo: {
        name: string;
    };
    compare: {
        name: string;
    };
    roadmap: {
        name: string;
    };
}>;
export declare const ERROR_CODES: Readonly<{
    RK_FRONTMATTER_INVALID: "RK_FRONTMATTER_INVALID";
    RK_PARSE_ERROR: "RK_PARSE_ERROR";
    RK_UNKNOWN_BLOCK_TYPE: "RK_UNKNOWN_BLOCK_TYPE";
    RK_BLOCK_ID_REQUIRED: "RK_BLOCK_ID_REQUIRED";
    RK_BLOCK_ID_INVALID: "RK_BLOCK_ID_INVALID";
    RK_TAB_PARENT_REQUIRED: "RK_TAB_PARENT_REQUIRED";
    RK_PROP_REQUIRED: "RK_PROP_REQUIRED";
    RK_UNSUPPORTED_DIAGRAM_ENGINE: "RK_UNSUPPORTED_DIAGRAM_ENGINE";
    RK_DIAGRAM_CODE_REQUIRED: "RK_DIAGRAM_CODE_REQUIRED";
    RK_CODE_BODY_REQUIRED: "RK_CODE_BODY_REQUIRED";
    RK_MODEL_CONTRACT_INVALID: "RK_MODEL_CONTRACT_INVALID";
    RK_ARTIFACT_NOT_FOUND: "RK_ARTIFACT_NOT_FOUND";
    RK_DUPLICATE_BLOCK_ID: "RK_DUPLICATE_BLOCK_ID";
    RK_GRID_CHILD_UNSUPPORTED: "RK_GRID_CHILD_UNSUPPORTED";
    RK_TABS_CHILD_UNSUPPORTED: "RK_TABS_CHILD_UNSUPPORTED";
    RK_TABS_BLOCK_UNSUPPORTED: "RK_TABS_BLOCK_UNSUPPORTED";
    RK_DECISION_YAML_INVALID: "RK_DECISION_YAML_INVALID";
    RK_TABLE_BODY_REQUIRED: "RK_TABLE_BODY_REQUIRED";
    RK_IMAGE_SRC_REQUIRED: "RK_IMAGE_SRC_REQUIRED";
    RK_STAT_VALUE_REQUIRED: "RK_STAT_VALUE_REQUIRED";
    RK_CHECKLIST_BODY_REQUIRED: "RK_CHECKLIST_BODY_REQUIRED";
    RK_QUOTE_BODY_REQUIRED: "RK_QUOTE_BODY_REQUIRED";
    RK_COMPARISON_BODY_REQUIRED: "RK_COMPARISON_BODY_REQUIRED";
    RK_TIMELINE_BODY_REQUIRED: "RK_TIMELINE_BODY_REQUIRED";
    RK_TABS_CHILD_REQUIRED: "RK_TABS_CHILD_REQUIRED";
    RK_TABLE_TOO_MANY_COLUMNS: "RK_TABLE_TOO_MANY_COLUMNS";
    RK_RENDERER_UNKNOWN: "RK_RENDERER_UNKNOWN";
    RK_PROFILE_UNKNOWN: "RK_PROFILE_UNKNOWN";
    RK_CHART_BODY_REQUIRED: "RK_CHART_BODY_REQUIRED";
}>;
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
export declare function isKnownBlockType(type: string): type is BlockType;
export declare function isKnownThemeName(theme: string): theme is ThemeName;
export declare function isKnownSurfaceName(surface: string): surface is SurfaceName;
export declare function isKnownCommentStatus(status: string): status is CommentStatus;
export declare function isKnownDiagramEngine(engine: string): engine is DiagramEngine;
export declare function normalizeBlockWidth(value: string | undefined): BlockWidth;
export declare function isWideReviewSurface(surface: string): boolean;
export declare function resolveBlockAlias(name: string, attrs?: Record<string, string>): {
    name: string;
    attrs: Record<string, string>;
};
export declare function validateRenderKitModel(model: unknown): ContractIssue[];
export declare function validateBlock(block: unknown, path?: string, issues?: ContractIssue[]): ContractIssue[];
export declare function validateTextQuoteSelector(selector: unknown): ContractIssue[];
//# sourceMappingURL=contracts.d.ts.map