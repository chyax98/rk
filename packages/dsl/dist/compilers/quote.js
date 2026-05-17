import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import { pos, excerpt, rawDirectiveBody, directiveBodyText, diag } from '../helpers.js';
export function compileQuote(node, attrs, source, errors, file) {
    const body = rawDirectiveBody(source, node) || directiveBodyText(node);
    if (!body)
        errors.push(diag('RK_QUOTE_BODY_REQUIRED', 'quote directive requires body text', file, pos(node)));
    return {
        id: attrs.id,
        type: 'quote',
        props: {
            quote: body,
            cite: attrs.cite || attrs.by || '',
            role: attrs.role || '',
            width: normalizeBlockWidth(attrs.width || attrs.span),
        },
        sourceRange: pos(node),
        sourceExcerpt: excerpt(source, node.position),
    };
}
//# sourceMappingURL=quote.js.map