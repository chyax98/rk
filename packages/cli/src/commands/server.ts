import { Command } from 'commander';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { output } from '../lib/output';
import { getEndpoint } from '../lib/http';

function repoRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
}

export function registerServer(parent: Command): void {
  const server = parent.command('server').description('manage local RenderKit server');

  server.command('start').option('--port <port>', 'port', '3737').action(async (opts: { port: string }) => {
    const root = repoRoot();
    const child = spawn('pnpm', ['--filter', '@renderkit/web', 'dev', '--', '-p', String(opts.port)], { cwd: root, stdio: 'inherit' });
    child.on('exit', code => process.exit(code ?? 0));
  });

  server.command('status').option('--json', 'json output').action(async (opts: { json?: boolean }) => {
    const endpoint = getEndpoint();
    try {
      const res = await fetch(`${endpoint}/api/health`);
      const json = await res.json();
      output({ ok: res.ok, endpoint, ...json }, opts.json ?? false);
      process.exit(res.ok ? 0 : 1);
    } catch (e: any) {
      output({ ok: false, endpoint, error: String(e.message || e) }, opts.json ?? false);
      process.exit(2);
    }
  });
}
