import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import { pos, excerpt, rawDirectiveBody, directiveBodyText, parseTimelineItems, diag } from '../helpers.js';
export function compileTimeline(node, attrs, source, errors, file) {
    const body = rawDirectiveBody(source, node) || directiveBodyText(node);
    const items = parseTimelineItems(body);
    if (!items.length)
        errors.push(diag('RK_TIMELINE_BODY_REQUIRED', 'timeline directive requires list items', file, pos(node)));
    return {
        id: attrs.id,
        type: 'timeline',
        props: { title: attrs.title || '', items, width: normalizeBlockWidth(attrs.width || attrs.span || 'wide') },
        sourceRange: pos(node),
        sourceExcerpt: excerpt(source, node.position),
    };
}
//# sourceMappingURL=timeline.js.map