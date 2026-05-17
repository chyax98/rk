import { Command } from 'commander';
import { BLOCK_TYPES } from '@renderkit/shared';
import { output } from '../lib/output';

export function registerBlocks(program: Command): void {
  program.command('blocks').option('--json', 'json output').action((opts: { json?: boolean }) => {
    output({ ok: true, blocks: BLOCK_TYPES }, opts.json ?? false);
  });
}
