#!/usr/bin/env node
// Entry point — source in src/index.ts
// Node 24 supports --experimental-strip-types for direct .ts import
import('../src/index.ts').catch(e => { console.error(e); process.exit(1); });
