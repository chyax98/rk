/**
 * Attribute type coercion utilities.
 * remark-directive provides all attributes as strings;
 * these helpers convert to the correct runtime types.
 */
/**
 * Coerce a string attribute to boolean.
 * "true", "1", "yes" → true; everything else → false.
 * undefined → fallback.
 */
export declare function coerceBool(val: string | undefined, fallback?: boolean): boolean;
/**
 * Coerce a string attribute to number.
 * Returns fallback if absent or NaN.
 */
export declare function coerceNumber(val: string | undefined, fallback?: number): number | undefined;
/**
 * Coerce a string attribute to one of the allowed enum values.
 * Returns fallback if absent or not in the allowed list.
 */
export declare function coerceEnum<T extends string>(val: string | undefined, allowed: readonly T[], fallback: T): T;
/**
 * Parse a highlight range string like "1,3-5,7" into an array of line numbers.
 * Returns empty array if invalid or absent.
 */
export declare function parseHighlightRanges(val: string | undefined): number[];
//# sourceMappingURL=attrs.d.ts.map