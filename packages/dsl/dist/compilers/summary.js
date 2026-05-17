import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import { pos, excerpt, rawDirectiveBody, directiveBodyText } from '../helpers.js';
export function compileSummary(node, attrs, source) {
    return {
        id: attrs.id,
        type: 'summary',
        props: {
            title: attrs.title || '',
            width: normalizeBlockWidth(attrs.width || attrs.span),
            content: rawDirectiveBody(source, node) || directiveBodyText(node),
        },
        sourceRange: pos(node),
        sourceExcerpt: excerpt(source, node.position),
    };
}
//# sourceMappingURL=summary.js.map