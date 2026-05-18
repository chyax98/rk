/**
 * RenderKit CLI — shared utilities
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// ── Endpoint ────────────────────────────────────────────────────────────────

export function getEndpoint() {
  return process.env.RENDERKIT_ENDPOINT || 'http://localhost:3737';
}

// ── Lock file helpers ───────────────────────────────────────────────────────

/** .rk-lock/<basename>.json  (basename = filename without extension) */
export function getLockPath(file) {
  const dir = path.dirname(file);
  const base = path.basename(file, path.extname(file));
  return path.join(dir, '.rk-lock', `${base}.json`);
}

export async function readLock(file) {
  try {
    const raw = await fs.readFile(getLockPath(file), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function writeLock(file, data) {
  const lockPath = getLockPath(file);
  await fs.mkdir(path.dirname(lockPath), { recursive: true });
  await fs.writeFile(
    lockPath,
    JSON.stringify({ ...data, lockedAt: new Date().toISOString() }, null, 2),
  );
}

// ── Output helpers ──────────────────────────────────────────────────────────

export function output(data, json = true) {
  if (json) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    // Human-readable fallback
    if (data.ok === false) {
      console.error('Error:', data.error || JSON.stringify(data));
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

// ── Paths ───────────────────────────────────────────────────────────────────

/** ~/.renderkit/data/renderkit.db */
export function getDefaultDbPath() {
  return path.join(os.homedir(), '.renderkit', 'data', 'renderkit.db');
}
