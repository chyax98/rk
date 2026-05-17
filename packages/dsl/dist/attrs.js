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
export function coerceBool(val, fallback = false) {
    if (val === undefined || val === null)
        return fallback;
    return val === 'true' || val === '1' || val === 'yes';
}
/**
 * Coerce a string attribute to number.
 * Returns fallback if absent or NaN.
 */
export function coerceNumber(val, fallback) {
    if (!val)
        return fallback;
    const n = Number(val);
    return isNaN(n) ? fallback : n;
}
/**
 * Coerce a string attribute to one of the allowed enum values.
 * Returns fallback if absent or not in the allowed list.
 */
export function coerceEnum(val, allowed, fallback) {
    if (!val)
        return fallback;
    return allowed.includes(val) ? val : fallback;
}
/**
 * Parse a highlight range string like "1,3-5,7" into an array of line numbers.
 * Returns empty array if invalid or absent.
 */
export function parseHighlightRanges(val) {
    if (!val)
        return [];
    const lines = [];
    for (const part of val.split(',')) {
        const trimmed = part.trim();
        const dashMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
        if (dashMatch) {
            const start = parseInt(dashMatch[1], 10);
            const end = parseInt(dashMatch[2], 10);
            for (let i = start; i <= end; i++)
                lines.push(i);
        }
        else {
            const n = parseInt(trimmed, 10);
            if (!isNaN(n) && n > 0)
                lines.push(n);
        }
    }
    return [...new Set(lines)].sort((a, b) => a - b);
}
//# sourceMappingURL=attrs.js.map