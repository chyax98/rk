/**
 * Block ID generation utilities.
 */
import type { RemarkNode } from './types';
export declare function generatedBlockId(name: string, node: RemarkNode, source: string, explicitIds: Set<string>, generatedIds: Set<string>): string;
export declare function slugId(value: string | undefined): string;
export declare const ID_FORMAT: RegExp;
//# sourceMappingURL=id.d.ts.map