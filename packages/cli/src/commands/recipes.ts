import { Command } from 'commander';
import { getRecipe, listRecipeSurfaces } from '@renderkit/shared';
import { output } from '../lib/output.ts';

export function registerRecipes(parent: Command): void {
  const recipes = parent.command('recipes').description('inspect Agent authoring recipes');
  recipes.command('list').option('--json', 'json output').action((opts: { json?: boolean }) => {
    const surfaces = listRecipeSurfaces().map(surface => ({ surface, ...getRecipe(surface) }));
    output({ ok: true, surfaces }, opts.json ?? false);
  });
  recipes.command('show <surface>').option('--json', 'json output').action((surface: string, opts: { json?: boolean }) => {
    const recipe = getRecipe(surface);
    if (!recipe) { output({ ok: false, error: `Unknown recipe surface: ${surface}`, surfaces: listRecipeSurfaces() }, opts.json ?? false); process.exit(1); }
    output({ ok: true, surface, recipe }, opts.json ?? false);
  });
}
