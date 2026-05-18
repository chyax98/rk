#!/usr/bin/env node
/**
 * Build-time smoke check for @renderkit/cli.
 *
 * The CLI ships as plain ESM under bin/, so "build" doesn't bundle —
 * it just verifies the entrypoint parses, all commander commands
 * register without crashing, and `--help` runs.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const bin = path.resolve(here, '..', 'bin', 'renderkit.mjs');

const res = spawnSync('node', [bin, '--help'], { encoding: 'utf8' });
if (res.status !== 0) {
  console.error('cli: --help failed');
  console.error(res.stderr || res.stdout);
  process.exit(1);
}

const expected = ['push', 'feedback', 'reply', 'address', 'resolve', 'reopen', 'validate', 'doctor'];
const missing = expected.filter((cmd) => !res.stdout.includes(`  ${cmd} `));
if (missing.length) {
  console.error(`cli: missing commands in --help: ${missing.join(', ')}`);
  process.exit(1);
}

console.log(`cli: ok (${expected.length} commands registered, endpoint default: ${process.env.RENDERKIT_ENDPOINT || 'http://localhost:3737'})`);
