export * from './contracts';
export * from './design-assets';
export declare const RK_VERSION = "1.0";
export declare const DEFAULT_PORT = 3737;
export declare const DEFAULT_ENDPOINT = "http://localhost:3737";
/**
 * Recipe registry — recommended blocks, theme, and anti-patterns per surface.
 * Agents should consult this when authoring artifacts for a known surface.
 */
export declare const RECIPES: Record<import('./contracts.js').SurfaceName, import('./contracts.js').Recipe>;
/**
 * Get a recipe by surface name. Returns null if unknown.
 */
export declare function getRecipe(surface: string): import('./contracts.js').Recipe | null;
/**
 * List all available recipe surface keys.
 */
export declare function listRecipeSurfaces(): string[];
export declare function getDesignRecommendation(surface?: string): import('./contracts').DesignRecommendation | null;
//# sourceMappingURL=index.d.ts.map