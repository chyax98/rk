#!/usr/bin/env node
// Entry point — source in src/cli.ts
// Node 24 supports --experimental-strip-types for direct .ts import
import('../src/cli.ts').catch(e => { console.error(e); process.exit(1); });
