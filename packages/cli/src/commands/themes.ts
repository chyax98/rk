import { Command } from 'commander';
import { THEME_NAMES } from '@renderkit/shared';
import { output } from '../lib/output.ts';

export function registerThemes(program: Command): void {
  program.command('themes').option('--json', 'json output').action((opts: { json?: boolean }) => {
    output({ ok: true, themes: THEME_NAMES }, opts.json ?? false);
  });
}
