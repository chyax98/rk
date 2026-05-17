import { Command } from 'commander';
import { output } from '../lib/output';
import { getEndpoint } from '../lib/http';
import { readLock } from '../lib/lock';

export function registerStatus(program: Command): void {
  program.command('status <target>').option('--json', 'json output').action(async (target: string, opts: { json?: boolean }) => {
    const endpoint = getEndpoint();
    const id = target.endsWith('.md') || target.endsWith('.rk') ? (await readLock(target))?.artifactId : target;
    if (!id) { output({ ok: false, error: 'No artifact lock found' }, opts.json ?? false); process.exit(1); }
    const res = await fetch(`${endpoint}/api/artifacts/${id}`);
    const json = await res.json();
    output(json, opts.json ?? false);
    process.exit(res.ok ? 0 : 1);
  });
}
