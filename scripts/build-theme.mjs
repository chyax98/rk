#!/usr/bin/env node
// Merges design/tokens.css + design/themes.css → apps/web/public/rk/theme.css
// This makes WC themes self-contained (works outside Next.js app too)
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = readFileSync(join(root, 'packages/design/src/tokens.css'), 'utf8');
const themes = readFileSync(join(root, 'packages/design/src/themes.css'), 'utf8');
const out = `/* RenderKit theme — auto-generated, do not edit */\n/* Source: packages/design/src/tokens.css + themes.css */\n\n${tokens}\n\n${themes}\n`;
writeFileSync(join(root, 'apps/web/public/rk/theme.css'), out);
console.log('theme.css built:', out.length, 'bytes');
