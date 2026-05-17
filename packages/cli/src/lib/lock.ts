import fs from 'node:fs/promises';
import path from 'node:path';

export interface LockData {
  artifactId: string;
  url: string;
  lastRevision: number;
  endpoint: string;
  sourceFile?: string;
}

export async function readLock(file: string): Promise<LockData | null> {
  const p = path.join(path.dirname(file), '.' + path.basename(file) + '.lock.json');
  try { return JSON.parse(await fs.readFile(p, 'utf8')); } catch { return null; }
}

export async function writeLock(file: string, data: LockData): Promise<void> {
  const p = path.join(path.dirname(file), '.' + path.basename(file) + '.lock.json');
  await fs.writeFile(p, JSON.stringify(data, null, 2));
}
