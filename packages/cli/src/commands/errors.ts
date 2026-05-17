import { Command } from 'commander';
import { ERROR_CODES } from '@renderkit/shared';
import { output } from '../lib/output';

export function registerErrors(program: Command): void {
  program.command('errors').option('--json', 'json output').action((opts: { json?: boolean }) => {
    output({ ok: true, errors: ERROR_CODES }, opts.json ?? false);
  });
}
