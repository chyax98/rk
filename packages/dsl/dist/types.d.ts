/**
 * Core type definitions for the RenderKit DSL compiler.
 */
import type { RenderKitBlock, Diagnostic } from '@renderkit/shared';
export interface RemarkPosition {
    start: {
        line: number;
        column: number;
        offset?: number;
    };
    end: {
        line: number;
        column: number;
        offset?: number;
    };
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
export interface CompileContext {
    source: string;
    file: string;
    errors: Diagnostic[];
    warnings: Diagnostic[];
}
export type BlockAttrs = Record<string, string | undefined>;
export type CompiledBlock = RenderKitBlock;
export type BlockCompiler = (node: RemarkNode, attrs: BlockAttrs, ctx: CompileContext) => CompiledBlock | null;
export interface ChildCompileOptions {
    index: number;
    disallow: Set<string>;
    errorCode: string;
    message: (name: string) => string;
    idFor: (parentAttrs: BlockAttrs, index: number) => string;
}
export interface ParsedPipeTable {
    headers: string[];
    rows: string[][];
    align: string[];
}
export declare const CHART_TYPES: readonly ["bar", "line", "pie", "scatter", "kpi"];
export type ChartType = (typeof CHART_TYPES)[number];
export declare const CHART_TEMPLATES: readonly ["default", "minimal", "report"];
export type ChartTemplate = (typeof CHART_TEMPLATES)[number];
export declare const TABLE_PROFILES: readonly ["matrix", "status", "key-value", "cards", "compact"];
export type TableProfile = (typeof TABLE_PROFILES)[number];
export declare const TABLE_RENDERERS: readonly ["default", "tanstack"];
export type TableRenderer = (typeof TABLE_RENDERERS)[number];
export declare const CODE_FRAMES: readonly ["editor", "terminal", "none"];
export type CodeFrame = (typeof CODE_FRAMES)[number];
export declare const CODE_RENDERERS: readonly ["shiki", "hljs"];
export type CodeRenderer = (typeof CODE_RENDERERS)[number];
export declare const CODE_COPY_MODES: readonly ["code", "all"];
export type CodeCopyMode = (typeof CODE_COPY_MODES)[number];
export declare const DSL_ERROR_CODES: {
    readonly RK_TABLE_TOO_MANY_COLUMNS: "RK_TABLE_TOO_MANY_COLUMNS";
    readonly RK_RENDERER_UNKNOWN: "RK_RENDERER_UNKNOWN";
    readonly RK_PROFILE_UNKNOWN: "RK_PROFILE_UNKNOWN";
    readonly RK_CHART_TYPE_REQUIRED: "RK_CHART_TYPE_REQUIRED";
    readonly RK_CHART_BODY_REQUIRED: "RK_CHART_BODY_REQUIRED";
};
//# sourceMappingURL=types.d.ts.map