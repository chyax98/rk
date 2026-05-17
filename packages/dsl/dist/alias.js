/**
 * Alias resolution — delegates to shared contracts.
 */
import { resolveBlockAlias } from '@renderkit/shared/contracts';
export function resolveDirective(name, attrs) {
    return resolveBlockAlias(name, attrs);
}
//# sourceMappingURL=alias.js.map