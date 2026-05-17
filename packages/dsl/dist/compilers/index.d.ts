/**
 * Compiler barrel — maps block type names to their compile functions.
 */
import type { BlockCompiler, BlockAttrs, CompileContext } from '../types';
export declare const BLOCK_COMPILERS: Record<string, BlockCompiler>;
export declare const KNOWN_BLOCK_TYPES: Set<string>;
export declare function compileBlock(node: import('../types').RemarkNode, attrs: BlockAttrs, ctx: CompileContext): import('../types').CompiledBlock | null;
//# sourceMappingURL=index.d.ts.map