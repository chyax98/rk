import { Command } from 'commander';
import { BLOCK_ALIASES } from '@renderkit/shared';
import { output } from '../lib/output';

export function registerAliases(program: Command): void {
  program.command('aliases').option('--json', 'json output').action((opts: { json?: boolean }) => {
    output({ ok: true, aliases: BLOCK_ALIASES }, opts.json ?? false);
  });
}
