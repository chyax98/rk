import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import { pos, excerpt, rawDirectiveBody, directiveBodyText, diag } from '../helpers.js';
export function compileStat(node, attrs, source, errors, file) {
    const body = rawDirectiveBody(source, node) || directiveBodyText(node);
    const value = attrs.value || attrs.metric || '';
    if (!value)
        errors.push(diag('RK_STAT_VALUE_REQUIRED', 'stat directive requires value', file, pos(node)));
    return {
        id: attrs.id,
        type: 'stat',
        props: {
            label: attrs.label || attrs.title || '',
            value,
            delta: attrs.delta || '',
            tone: attrs.tone || 'neutral',
            caption: attrs.caption || body,
            width: normalizeBlockWidth(attrs.width || attrs.span),
        },
        sourceRange: pos(node),
        sourceExcerpt: excerpt(source, node.position),
    };
}
//# sourceMappingURL=stat.js.map