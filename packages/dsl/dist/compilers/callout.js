import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import { pos, excerpt, rawDirectiveBody, directiveBodyText } from '../helpers.js';
export function compileCallout(node, attrs, source) {
    return {
        id: attrs.id,
        type: 'callout',
        props: {
            tone: attrs.tone || 'info',
            title: attrs.title || '',
            width: normalizeBlockWidth(attrs.width || attrs.span),
            content: rawDirectiveBody(source, node) || directiveBodyText(node),
        },
        sourceRange: pos(node),
        sourceExcerpt: excerpt(source, node.position),
    };
}
//# sourceMappingURL=callout.js.map