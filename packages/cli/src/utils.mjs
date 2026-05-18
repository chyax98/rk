/**
 * RenderKit CLI — shared utilities
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

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

export function formatFeedbackMarkdown(feedback, endpoint = getEndpoint()) {
  const comments = Array.isArray(feedback.comments) ? feedback.comments : [];
  if (comments.length === 0) {
    return `# RenderKit Feedback\n\nartifactId: ${feedback.artifactId}\n\n✅ 暂无待处理评论。\n`;
  }

  const lines = [
    '# RenderKit Feedback',
    '',
    `artifactId: ${feedback.artifactId}`,
    `revision: ${feedback.currentRevision}`,
    `url: ${endpoint}${feedback.url}`,
    '',
    `## 待处理 Threads（${comments.length} 条）`,
    '',
  ];

  for (const thread of comments) {
    lines.push(`### ${thread.id} · ${thread.anchor || '(全局)'}`);
    lines.push(`- **状态**: ${thread.status}`);
    lines.push(`- **等待方**: ${thread.waitingFor}`);
    lines.push(`- **作者**: ${thread.author}`);
    lines.push(`- **时间**: ${thread.createdAt}`);
    lines.push(`- **内容**: ${thread.text}`);
    if (thread.replies?.length) {
      lines.push(`- **回复数**: ${thread.replies.length}`);
      for (const reply of thread.replies) {
        lines.push(`  - ${reply.id} · ${reply.author} · ${reply.createdAt} · ${reply.text}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ── Paths ───────────────────────────────────────────────────────────────────

/** ~/.renderkit/data/renderkit.db */
export function getDefaultDbPath() {
  return path.join(os.homedir(), '.renderkit', 'data', 'renderkit.db');
}

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');
const componentCatalogPath = path.join(repoRoot, 'packages', 'components', 'src', 'catalog.mjs');

export async function inspectComponentInventory() {
  const { COMPONENTS } = await import(pathToFileURL(componentCatalogPath).href);
  const components = [...COMPONENTS];
  const derivedComponents = components.filter((component) => component.derived);

  return {
    components,
    documentedCount: components.length - derivedComponents.length,
    registeredCount: components.length,
    documentedTags: components.filter((component) => !component.derived).map((component) => component.tag),
    undocumentedTags: derivedComponents.map((component) => component.tag),
    staleDocumentedTags: [],
  };
}
