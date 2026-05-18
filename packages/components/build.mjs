/**
 * Build Web Components bundle using esbuild.
 *
 * Usage:
 *   node packages/components/build.mjs          # one-shot build
 *   node packages/components/build.mjs --watch   # watch mode
 */
import { context } from 'esbuild';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../..');
const srcDir = resolve(__dirname, 'src');
const outDir = resolve(root, 'apps/web/public/rk');

const isWatch = process.argv.includes('--watch');

const ctx = await context({
  entryPoints: [resolve(srcDir, 'bundle.ts')],
  bundle: true,
  format: 'iife',
  target: ['es2022'],
  outfile: resolve(outDir, 'components.js'),
  minify: false,
  external: [],
  logLevel: isWatch ? 'info' : 'warning',
});

if (isWatch) {
  await ctx.watch();
  console.log('👀 Watching WC source for changes...');
  // Keep process alive
  await new Promise(() => {});
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log('✅ WC bundle built →', resolve(outDir, 'components.js'));
}
