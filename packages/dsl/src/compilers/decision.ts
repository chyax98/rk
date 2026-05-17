import yaml from 'js-yaml';
import { normalizeBlockWidth } from '@renderkit/shared/contracts';
import type { RemarkNode, BlockAttrs, CompileContext, CompiledBlock } from '../types';
import { pos, excerpt, rawDirectiveBody, directiveBodyText, markdownBullets, diag } from '../helpers';

export function compileDecision(
  node: RemarkNode,
  attrs: BlockAttrs,
  source: string,
  errors: CompileContext['errors'],
  file: string,
): CompiledBlock {
  const body = rawDirectiveBody(source, node) || directiveBodyText(node);
  let data: Record<string, unknown> = {};
  if (attrs.q || attrs.question || attrs.chosen) {
    data = {
      question: attrs.q || attrs.question || '',
      chosen: attrs.chosen || '',
      status: attrs.status || 'draft',
      rationale: markdownBullets(body),
      alternatives: [],
    };
  } else {
    try { data = (yaml.load(body) || {}) as Record<string, unknown>; }
    catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(diag('RK_DECISION_YAML_INVALID', msg, file, pos(node)));
    }
  }

  for (const k of ['question', 'chosen']) {
    if (!data[k]) errors.push(diag('RK_PROP_REQUIRED', `decision-card requires ${k}`, file, pos(node)));
  }
  return {
    id: attrs.id!,
    type: 'decision-card',
    props: {
      question: (data.question as string) || '',
      chosen: (data.chosen as string) || '',
      width: normalizeBlockWidth(attrs.width || attrs.span),
      status: ((data.status as string) || attrs.status || 'draft'),
      rationale: (data.rationale as string[]) || [],
      alternatives: (data.alternatives as unknown[]) || [],
    },
    sourceRange: pos(node),
    sourceExcerpt: excerpt(source, node.position),
  };
}
