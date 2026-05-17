import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import { pos, excerpt, rawDirectiveBody, directiveBodyText, parsePipeTable, diag } from '../helpers.js';
export function compileComparison(node, attrs, source, errors, file) {
    const body = rawDirectiveBody(source, node) || directiveBodyText(node);
    const parsed = parsePipeTable(body);
    if (parsed.headers.length < 2 || !parsed.rows.length) {
        errors.push(diag('RK_COMPARISON_BODY_REQUIRED', 'comparison directive requires a Markdown table with at least two columns and one row', file, pos(node)));
    }
    return {
        id: attrs.id,
        type: 'comparison',
        props: {
            title: attrs.title || '',
            caption: attrs.caption || '',
            columns: parsed.headers,
            rows: parsed.rows,
            width: normalizeBlockWidth(attrs.width || attrs.span || 'wide'),
        },
        sourceRange: pos(node),
        sourceExcerpt: excerpt(source, node.position),
    };
}
//# sourceMappingURL=comparison.js.map