import type { Diagnostic } from '@renderkit/shared';
export { parseRK };
/**
 * Parse a RenderKit .rk.md source string into a validated model.
 */
declare function parseRK(source: string, file?: string): {
    ok: boolean;
    model: any;
    errors: Diagnostic[];
    warnings: Diagnostic[];
};
//# sourceMappingURL=index.d.ts.map