import { Command } from 'commander';
import { SURFACE_NAMES, getRecipe } from '@renderkit/shared';
import { output } from '../lib/output.ts';

export function registerSurfaces(program: Command): void {
  program.command('surfaces').option('--json', 'json output').action((opts: { json?: boolean }) => {
    output({ ok: true, surfaces: SURFACE_NAMES.map(surface => ({ surface, recipe: getRecipe(surface) || null })) }, opts.json ?? false);
  });
}
