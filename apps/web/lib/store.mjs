import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { parseRK } from '@renderkit/dsl';

const root = path.join(os.homedir(), '.renderkit', 'data');
const artifactsDir = path.join(root, 'artifacts');
const indexPath = path.join(root, 'index.json');

export async function ensureStore() {
  await fs.mkdir(artifactsDir, { recursive: true });
  try { await fs.access(indexPath); } catch { await fs.writeFile(indexPath, JSON.stringify({ artifacts: [] }, null, 2)); }
}

export async function listArtifacts() {
  await ensureStore();
  const idx = JSON.parse(await fs.readFile(indexPath, 'utf8'));
  return idx.artifacts || [];
}

export async function createArtifact(source, title) {
  await ensureStore();
  const parsed = parseRK(source);
  if (!parsed.ok) return { ok: false, errors: parsed.errors, warnings: parsed.warnings };
  const id = 'art_' + crypto.randomBytes(5).toString('hex');
  const dir = path.join(artifactsDir, id);
  await fs.mkdir(dir, { recursive: true });
  const artifact = { id, title: title || parsed.model.title, currentRevision: 1, createdAt: now(), updatedAt: now() };
  await writeRevision(id, 1, source, parsed.model);
  await writeComments(id, []);
  const idx = JSON.parse(await fs.readFile(indexPath, 'utf8'));
  idx.artifacts = [artifact, ...(idx.artifacts || [])];
  await fs.writeFile(indexPath, JSON.stringify(idx, null, 2));
  return { ok: true, artifact, revision: 1, model: parsed.model, warnings: parsed.warnings };
}

export async function addRevision(id, source, resolvedCommentIds = []) {
  await ensureStore();
  const artifact = await getArtifactMeta(id);
  if (!artifact) return { ok: false, status: 404, errors: [{ code: 'RK_ARTIFACT_NOT_FOUND', message: `Artifact not found: ${id}` }] };
  const parsed = parseRK(source);
  if (!parsed.ok) return { ok: false, errors: parsed.errors, warnings: parsed.warnings };
  const current = await getRevision(id, artifact.currentRevision);
  const next = artifact.currentRevision + 1;
  const diff = diffBlocks(current.model, parsed.model);
  await writeRevision(id, next, source, parsed.model);
  const comments = await getComments(id);
  const newIds = new Set(flattenBlocks(parsed.model.blocks).map(b => b.id));
  for (const c of comments) {
    if (resolvedCommentIds.includes(c.id)) { c.status = 'resolved'; c.resolvedAtRevision = next; c.resolvedBy = 'agent'; c.resolvedAt = now(); }
    else if (c.status === 'open' && !newIds.has(c.blockId)) { c.status = 'orphaned'; }
  }
  await writeComments(id, comments);
  await updateArtifact(id, { currentRevision: next, title: parsed.model.title, updatedAt: now() });
  return { ok: true, revision: next, model: parsed.model, diff: { ...diff, orphanedComments: comments.filter(c => c.status === 'orphaned').map(c => c.id) }, resolved: resolvedCommentIds, warnings: parsed.warnings };
}

export async function getArtifactMeta(id) {
  await ensureStore();
  const idx = JSON.parse(await fs.readFile(indexPath, 'utf8'));
  return (idx.artifacts || []).find(a => a.id === id) || null;
}

export async function getArtifact(id, rev = null) {
  const meta = await getArtifactMeta(id);
  if (!meta) return null;
  const revision = await getRevision(id, rev || meta.currentRevision);
  const comments = await getComments(id);
  return { meta, revision, comments };
}

export async function getRevision(id, rev) {
  const p = path.join(artifactsDir, id, `rev-${rev}.json`);
  return JSON.parse(await fs.readFile(p, 'utf8'));
}

export async function getComments(id) {
  try { return JSON.parse(await fs.readFile(path.join(artifactsDir, id, 'comments.json'), 'utf8')); }
  catch { return []; }
}

export async function addComment(id, blockId, text, selector = null) {
  const artifact = await getArtifact(id);
  if (!artifact) return { ok: false, status: 404, error: 'not found' };
  const block = findBlockById(artifact.revision.model.blocks, blockId);
  if (!block) return { ok: false, status: 404, error: 'block not found' };
  const comments = artifact.comments;
  const c = { id: 'cmt_' + crypto.randomBytes(5).toString('hex'), artifactId: id, blockId, text, selector: normalizeSelector(selector), status: 'open', createdAtRevision: artifact.meta.currentRevision, blockSnapshot: block, createdAt: now() };
  comments.push(c);
  await writeComments(id, comments);
  return { ok: true, comment: c };
}

export async function getFeedback(id) {
  const artifact = await getArtifact(id);
  if (!artifact) return null;
  const blocks = artifact.revision.model.blocks;
  const comments = artifact.comments.filter(c => c.status === 'open' || c.status === 'orphaned');
  return {
    artifactId: id,
    currentRevision: artifact.meta.currentRevision,
    url: `/a/${id}`,
    openComments: comments.map(c => {
      const idx = blocks.findIndex(b => b.id === c.blockId);
      const block = idx >= 0 ? blocks[idx] : null;
      return {
        id: c.id,
        blockId: c.blockId,
        status: c.status,
        text: c.text,
        selector: c.selector || null,
        createdAtRevision: c.createdAtRevision,
        block: block || c.blockSnapshot,
        blockSnapshot: c.blockSnapshot,
        sourceRange: (block || c.blockSnapshot)?.sourceRange,
        sourceExcerpt: (block || c.blockSnapshot)?.sourceExcerpt,
        neighbors: { prev: idx > 0 ? [brief(blocks[idx - 1])] : [], next: idx >= 0 && idx < blocks.length - 1 ? [brief(blocks[idx + 1])] : [] }
      };
    })
  };
}

async function writeRevision(id, number, source, model) {
  const rev = { id: `rev_${number}`, artifactId: id, number, sourceText: source, sourceHash: sha(source), model, blockIds: flattenBlocks(model.blocks).map(b => b.id), createdAt: now() };
  await fs.writeFile(path.join(artifactsDir, id, `rev-${number}.json`), JSON.stringify(rev, null, 2));
}

async function writeComments(id, comments) {
  await fs.writeFile(path.join(artifactsDir, id, 'comments.json'), JSON.stringify(comments, null, 2));
}

async function updateArtifact(id, patch) {
  const idx = JSON.parse(await fs.readFile(indexPath, 'utf8'));
  idx.artifacts = (idx.artifacts || []).map(a => a.id === id ? { ...a, ...patch } : a);
  await fs.writeFile(indexPath, JSON.stringify(idx, null, 2));
}

function diffBlocks(a, b) {
  const am = new Map(flattenBlocks(a.blocks).map(x => [x.id, x]));
  const bm = new Map(flattenBlocks(b.blocks).map(x => [x.id, x]));
  const addedBlocks = [...bm.keys()].filter(k => !am.has(k));
  const removedBlocks = [...am.keys()].filter(k => !bm.has(k));
  const modifiedBlocks = [...bm.keys()].filter(k => am.has(k) && sha(JSON.stringify(am.get(k).props)) !== sha(JSON.stringify(bm.get(k).props)));
  return { addedBlocks, removedBlocks, modifiedBlocks };
}
function flattenBlocks(blocks) {
  const out = [];
  for (const block of blocks || []) {
    out.push(block);
    if (Array.isArray(block.props?.children)) out.push(...flattenBlocks(block.props.children));
  }
  return out;
}

function findBlockById(blocks, id) {
  for (const block of blocks || []) {
    if (block.id === id) return block;
    const child = findBlockById(block.props?.children || [], id);
    if (child) return child;
  }
  return null;
}

function normalizeSelector(selector) {
  if (!selector || typeof selector !== 'object') return null;
  const exact = String(selector.exact || '').trim().slice(0, 500);
  if (!exact) return null;
  return {
    type: selector.type || 'TextQuoteSelector',
    exact,
    prefix: String(selector.prefix || '').slice(-80),
    suffix: String(selector.suffix || '').slice(0, 80)
  };
}

function brief(b) { return b ? { id: b.id, type: b.type } : null; }
function sha(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
function now() { return new Date().toISOString(); }
