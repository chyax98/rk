#!/usr/bin/env node
/**
 * Static lifecycle checks for RenderKit Web Components.
 *
 * This gate intentionally checks only rules we are ready to enforce.
 * Add new checks when the codebase has been migrated to the stricter contract.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const elementsDir = join(root, 'packages/components/src/elements');

const findings = [];

for (const file of readdirSync(elementsDir).filter((f) => f.endsWith('.ts')).sort()) {
  const path = join(elementsDir, file);
  const text = readFileSync(path, 'utf8');
  const lines = text.split('\n');

  lines.forEach((line, idx) => {
    if (!line.includes('attributeChangedCallback(): void {')) return;
    const lookahead = lines.slice(idx + 1, idx + 5).join('\n');
    if (!lookahead.includes('isConnected')) {
      findings.push({
        file: `packages/components/src/elements/${file}`,
        line: idx + 1,
        rule: 'attributeChangedCallback must guard !this.isConnected before rendering',
      });
    }
  });
}

if (findings.length) {
  console.error('WC lifecycle check failed:');
  for (const f of findings) {
    console.error(`- ${f.file}:${f.line} ${f.rule}`);
  }
  process.exit(1);
}

console.log('WC lifecycle check passed.');
