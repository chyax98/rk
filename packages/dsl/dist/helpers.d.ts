/**
 * Shared helper functions for all DSL compilers.
 * Pure functions with no side effects.
 */
import type { RemarkNode, RemarkPosition, ParsedPipeTable } from './types';
export declare function pos(node: RemarkNode): import('@renderkit/shared').SourceRange;
export declare function rangeFromOffsets(source: string, start: number, end: number): import('@renderkit/shared').SourceRange;
export declare function excerpt(source: string, position?: RemarkPosition): string;
export declare function rawDirectiveBody(source: string, node: RemarkNode): string;
export declare function plainText(node: RemarkNode | null | undefined): string;
export declare function directiveBodyText(node: RemarkNode): string;
export declare function markdownBullets(body: string): string[];
export declare function parsePipeTable(body: string): ParsedPipeTable;
export declare function parseTimelineItems(body: string): Array<{
    status: string;
    label: string;
    body: string;
}>;
export declare function parseChecklistItems(body: string): Array<{
    checked: boolean;
    text: string;
}>;
export declare function stripFenceLikeBody(body: string): string;
export declare function findCode(node: RemarkNode): RemarkNode | null;
export declare function firstHeading(blocks: Array<{
    type: string;
    props?: {
        text?: string;
    };
}>): string | undefined;
export declare function diag(code: string, message: string, file: string, range?: import('@renderkit/shared').SourceRange | null): import('@renderkit/shared').Diagnostic;
export declare function collectDirectiveIds(tree: RemarkNode): Set<string>;
export declare function walkNodes(node: RemarkNode | null, visit: (node: RemarkNode) => void): void;
//# sourceMappingURL=helpers.d.ts.map