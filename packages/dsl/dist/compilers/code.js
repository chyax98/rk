import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import { coerceBool, parseHighlightRanges } from '../attrs.js';
import { validateCodeRenderer, validateCodeFrame, validateCodeCopyMode } from '../renderer-validation.js';
import { pos, excerpt, findCode, diag } from '../helpers.js';
export function compileCode(node, attrs, source, errors, file) {
    const code = findCode(node);
    if (!code || !code.value) {
        errors.push(diag('RK_CODE_BODY_REQUIRED', 'code directive requires a fenced code block', file, pos(node)));
    }
    // Extended attrs for Shiki/Expressive Code style rendering
    const renderer = validateCodeRenderer(attrs.renderer);
    const frame = validateCodeFrame(attrs.frame);
    const showLineNumbers = coerceBool(attrs.showLineNumbers);
    const highlight = parseHighlightRanges(attrs.highlight);
    const diff = coerceBool(attrs.diff);
    const copyMode = validateCodeCopyMode(attrs.copyMode);
    return {
        id: attrs.id,
        type: 'code',
        props: {
            language: attrs.language || code?.lang || '',
            title: attrs.title || '',
            code: code?.value || '',
            width: normalizeBlockWidth(attrs.width || attrs.span),
            // Extended props
            filename: attrs.filename || '',
            renderer,
            frame,
            showLineNumbers,
            highlight,
            diff,
            copyMode,
        },
        sourceRange: pos(node),
        sourceExcerpt: excerpt(source, node.position),
    };
}
//# sourceMappingURL=code.js.map