import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import { pos, excerpt, rawDirectiveBody, directiveBodyText, diag } from '../helpers.js';
export function compileImage(node, attrs, source, errors, file) {
    if (!attrs.src)
        errors.push(diag('RK_IMAGE_SRC_REQUIRED', 'image directive requires src', file, pos(node)));
    const body = rawDirectiveBody(source, node) || directiveBodyText(node);
    return {
        id: attrs.id,
        type: 'image',
        props: {
            src: attrs.src || '',
            alt: attrs.alt || attrs.title || '',
            title: attrs.title || '',
            caption: attrs.caption || body,
            aspect: attrs.aspect || '',
            width: normalizeBlockWidth(attrs.width || attrs.span || 'wide'),
        },
        sourceRange: pos(node),
        sourceExcerpt: excerpt(source, node.position),
    };
}
//# sourceMappingURL=image.js.map