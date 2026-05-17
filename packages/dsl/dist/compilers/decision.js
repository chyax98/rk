import yaml from 'js-yaml';
import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import { pos, excerpt, rawDirectiveBody, directiveBodyText, markdownBullets, diag } from '../helpers.js';
export function compileDecision(node, attrs, source, errors, file) {
    const body = rawDirectiveBody(source, node) || directiveBodyText(node);
    let data = {};
    if (attrs.q || attrs.question || attrs.chosen) {
        data = {
            question: attrs.q || attrs.question || '',
            chosen: attrs.chosen || '',
            status: attrs.status || 'draft',
            rationale: markdownBullets(body),
            alternatives: [],
        };
    }
    else {
        try {
            data = (yaml.load(body) || {});
        }
        catch (e) {
            errors.push(diag('RK_DECISION_YAML_INVALID', e.message, file, pos(node)));
        }
    }
    for (const k of ['question', 'chosen']) {
        if (!data[k])
            errors.push(diag('RK_PROP_REQUIRED', `decision-card requires ${k}`, file, pos(node)));
    }
    return {
        id: attrs.id,
        type: 'decision-card',
        props: {
            question: data.question || '',
            chosen: data.chosen || '',
            width: normalizeBlockWidth(attrs.width || attrs.span),
            status: (data.status || attrs.status || 'draft'),
            rationale: data.rationale || [],
            alternatives: data.alternatives || [],
        },
        sourceRange: pos(node),
        sourceExcerpt: excerpt(source, node.position),
    };
}
//# sourceMappingURL=decision.js.map