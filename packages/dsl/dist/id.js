import { plainText, rawDirectiveBody, directiveBodyText } from './helpers.js';
export function generatedBlockId(name, node, source, explicitIds, generatedIds) {
    const base = slugId(`auto-${name}-${autoIdSeed(node, source)}`);
    let id = base;
    let n = 2;
    while (explicitIds.has(id) || generatedIds.has(id))
        id = `${base}-${n++}`;
    generatedIds.add(id);
    return id;
}
function autoIdSeed(node, source) {
    const attrs = node.attributes || {};
    const attrSeed = attrs.title || attrs.label || attrs.q || attrs.question || attrs.chosen || attrs.source || '';
    const bodySeed = attrSeed || plainText(node) || rawDirectiveBody(source, node) || directiveBodyText(node) || 'block';
    return String(bodySeed).slice(0, 64);
}
export function slugId(value) {
    const slug = String(value || 'block')
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 72);
    return slug || 'auto-block';
}
export const ID_FORMAT = /^[a-zA-Z0-9_-]+$/;
//# sourceMappingURL=id.js.map