import { normalizeBlockWidth, isKnownDiagramEngine } from '@renderkit/shared/contracts';
import { pos, excerpt, rawDirectiveBody, directiveBodyText, stripFenceLikeBody, findCode, diag } from '../helpers.js';
export function compileDiagram(node, attrs, source, errors, file) {
    const code = findCode(node);
    const body = rawDirectiveBody(source, node) || directiveBodyText(node);
    const engine = String(attrs.engine || code?.lang || 'mermaid').toLowerCase();
    if (!isKnownDiagramEngine(engine))
        errors.push(diag('RK_UNSUPPORTED_DIAGRAM_ENGINE', `Unsupported diagram engine: ${engine}`, file, pos(node)));
    const diagramCode = code?.value || stripFenceLikeBody(body);
    if (!diagramCode)
        errors.push(diag('RK_DIAGRAM_CODE_REQUIRED', 'diagram requires a fenced code block or inline diagram body', file, pos(node)));
    return {
        id: attrs.id,
        type: 'diagram',
        props: { engine, code: diagramCode, caption: attrs.caption || '', width: normalizeBlockWidth(attrs.width || attrs.span) },
        sourceRange: pos(node),
        sourceExcerpt: excerpt(source, node.position),
    };
}
//# sourceMappingURL=diagram.js.map