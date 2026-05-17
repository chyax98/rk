import type { Command } from 'commander';
import { getEndpoint } from '../lib/http.ts';
import { readLock } from '../lib/lock.ts';
import { output } from '../lib/output.ts';

export function registerStatus(program: Command): void {
  program
    .command('status <target>')
    .option('--json', 'json output')
    .action(async (target: string, opts: { json?: boolean }) => {
      const endpoint = getEndpoint();
      const id =
        target.endsWith('.md') || target.endsWith('.rk')
          ? (await readLock(target))?.artifactId
          : target;
      if (!id) {
        output({ ok: false, error: 'No artifact lock found' }, opts.json ?? false);
        process.exit(1);
      }
      const res = await fetch(`${endpoint}/api/artifacts/${id}`);
      const json = await res.json();
      output(json, opts.json ?? false);
      process.exit(res.ok ? 0 : 1);
    });
}
