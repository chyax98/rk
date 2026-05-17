import { Command } from 'commander';
import fs from 'node:fs/promises';
import { parseRK } from '@renderkit/dsl';
import { output } from '../lib/output.ts';
import { getEndpoint } from '../lib/http.ts';
import { readLock, writeLock } from '../lib/lock.ts';
import { openUrl } from '../lib/open.ts';

export function registerPush(program: Command): void {
  program
    .command('push <file>')
    .option('--open', 'open browser')
    .option('--json', 'json output')
    .option('--resolve <ids>', 'comma separated comment ids')
    .action(async (file: string, opts: { open?: boolean; json?: boolean; resolve?: string }) => {
      const source = await fs.readFile(file, 'utf8');
      const validation = parseRK(source, file);
      if (!validation.ok) { output(validation, opts.json ?? false); process.exit(1); }

      const endpoint = getEndpoint();
      const lock = await readLock(file);
      const resolvedCommentIds = opts.resolve ? opts.resolve.split(',').map(s => s.trim()).filter(Boolean) : [];
      const url = lock?.artifactId ? `${endpoint}/api/artifacts/${lock.artifactId}/revisions` : `${endpoint}/api/artifacts`;
      const body = lock?.artifactId ? { source, resolvedCommentIds } : { source, title: validation.model.title };

      let res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      let json = await res.json();
      if ((!res.ok || !json.ok) && lock?.artifactId && JSON.stringify(json).includes('RK_ARTIFACT_NOT_FOUND')) {
        res = await fetch(`${endpoint}/api/artifacts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ source, title: validation.model.title }) });
        json = await res.json();
      }
      if (!res.ok || !json.ok) { output(json, opts.json ?? false); process.exit(1); }

      const artifactId = json.artifactId as string;
      await writeLock(file, { artifactId, url: json.url, lastRevision: json.revision, endpoint, sourceFile: file });

      const result = { ok: true, artifactId, revision: json.revision, url: json.url, diff: json.diff, resolved: json.resolved || [] };
      output(result, opts.json ?? false);

      if (opts.open && json.url) {
        try { openUrl(json.url); } catch (_e) { /* browser open failure is non-fatal */ }
      }
    });
}
