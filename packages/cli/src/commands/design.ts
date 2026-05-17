import { Command } from 'commander';
import { listDesignResources, listDesignResourcePriorities, getDesignResource, getDesignRecommendation, listRecipeSurfaces } from '@renderkit/shared';
import { output } from '../lib/output.ts';

export function registerDesign(parent: Command): void {
  const design = parent.command('design').description('inspect local design resource assets');

  design.command('resources').option('--json', 'json output').option('--priority <priority>', 'filter priority, e.g. P0/P1/P2').action((opts: { json?: boolean; priority?: string }) => {
    output({ ok: true, priorities: listDesignResourcePriorities(), resources: listDesignResources({ priority: opts.priority }) }, opts.json ?? false);
  });

  design.command('resource <id>').option('--json', 'json output').action((id: string, opts: { json?: boolean }) => {
    const resource = getDesignResource(id);
    if (!resource) { output({ ok: false, error: `Unknown design resource: ${id}`, resources: listDesignResources().map(r => r.id) }, opts.json ?? false); process.exit(1); }
    output({ ok: true, resource }, opts.json ?? false);
  });

  design.command('recommend').requiredOption('--surface <surface>', 'target surface').option('--json', 'json output').action((opts: { json?: boolean; surface: string }) => {
    const recommendation = getDesignRecommendation(opts.surface);
    if (!recommendation) { output({ ok: false, error: `Unknown surface: ${opts.surface}`, surfaces: listRecipeSurfaces() }, opts.json ?? false); process.exit(1); }
    output({ ok: true, recommendation }, opts.json ?? false);
  });
}
