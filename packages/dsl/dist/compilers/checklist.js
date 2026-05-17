import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import { pos, excerpt, rawDirectiveBody, directiveBodyText, parseChecklistItems, diag } from '../helpers.js';
export function compileChecklist(node, attrs, source, errors, file) {
    const body = rawDirectiveBody(source, node) || directiveBodyText(node);
    const items = parseChecklistItems(body);
    if (!items.length)
        errors.push(diag('RK_CHECKLIST_BODY_REQUIRED', 'checklist directive requires list items', file, pos(node)));
    return {
        id: attrs.id,
        type: 'checklist',
        props: { title: attrs.title || '', items, width: normalizeBlockWidth(attrs.width || attrs.span) },
        sourceRange: pos(node),
        sourceExcerpt: excerpt(source, node.position),
    };
}
//# sourceMappingURL=checklist.js.map