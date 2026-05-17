import fs from 'node:fs/promises';
import { parseRK } from '@renderkit/dsl';
import type { Command } from 'commander';
import { output } from '../lib/output.ts';

export function registerValidate(program: Command): void {
  program
    .command('validate <file>')
    .option('--json', 'json output')
    .action(async (file: string, opts: { json?: boolean }) => {
      const source = await fs.readFile(file, 'utf8');
      const result = parseRK(source, file);
      output(result, opts.json ?? false);
      process.exit(result.ok ? 0 : 1);
    });
}
