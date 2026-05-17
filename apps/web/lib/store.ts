import crypto from 'node:crypto';
import { parseRK } from '@renderkit/dsl';
import { COMMENT_STATUSES, validateTextQuoteSelector } from '@renderkit/shared/contracts';
import { getDb } from './db';

const COMMENT_OPEN = COMMENT_STATUSES[0];
const COMMENT_RESOLVED = COMMENT_STATUSES[1];
const COMMENT_ORPHANED = COMMENT_STATUSES[2];
const HUMAN_EDITABLE_COMMENT_STATUSES = new Set([COMMENT_OPEN, COMMENT_RESOLVED]);

/* ── helpers ────────────────────────────────────────────── */

function sha(s: string) { return crypto.createHash('sha256').update(s).digest('hex'); }
function now() { return new Date().toISOString(); }

function flattenBlocks(blocks: any[]): any[] {
  const out: any[] = [];
  for (const block of blocks || []) {
    out.push(block);
    if (Array.isArray(block.props?.children)) out.push(...flattenBlocks(block.props.children));
    if (Array.isArray(block.props?.tabs)) {
      for (const tab of block.props.tabs) {
        if (Array.isArray(tab.blocks)) out.push(...flattenBlocks(tab.blocks));
      }
    }
  }
  return out;
}

function findBlockById(blocks: any[], id: string): any | null {
  for (const block of blocks || []) {
    if (block.id === id) return block;
    const child = findBlockById(block.props?.children || [], id);
    if (child) return child;
    if (Array.isArray(block.props?.tabs)) {
      for (const tab of block.props.tabs) {
        const found = findBlockById(tab.blocks || [], id);
        if (found) return found;
      }
    }
  }
  return null;
}

function normalizeSelector(selector: any): any | null {
  if (!selector || typeof selector !== 'object') return null;
  const selectorIssues = validateTextQuoteSelector({ ...selector, type: selector.type || 'TextQuoteSelector' });
  if (selectorIssues.length > 0 && selectorIssues.some(issue => issue.path === '$.exact')) return null;
  const exact = String(selector.exact || '').trim().slice(0, 500);
  if (!exact) return null;
  return {
    type: selector.type || 'TextQuoteSelector',
    exact,
    prefix: String(selector.prefix || '').slice(-80),
    suffix: String(selector.suffix || '').slice(0, 80)
  };
}

function brief(b: any) { return b ? { id: b.id, type: b.type } : null; }

function diffBlocks(a: any, b: any) {
  const am = new Map(flattenBlocks(a.blocks).map((x: any) => [x.id, x]));
  const bm = new Map(flattenBlocks(b.blocks).map((x: any) => [x.id, x]));
  const addedBlocks = [...bm.keys()].filter(k => !am.has(k));
  const removedBlocks = [...am.keys()].filter(k => !bm.has(k));
  const modifiedBlocks = [...bm.keys()].filter(k => am.has(k) && sha(JSON.stringify(am.get(k).props)) !== sha(JSON.stringify(bm.get(k).props)));
  return { addedBlocks, removedBlocks, modifiedBlocks };
}

function rowToArtifact(r: any) {
  return {
    id: r.id,
    title: r.title,
    currentRevision: r.current_revision,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function rowToRevision(r: any) {
  return {
    id: r.id,
    artifactId: r.artifact_id,
    number: r.number,
    sourceText: r.source_text,
    sourceHash: r.source_hash,
    model: JSON.parse(r.model),
    blockIds: JSON.parse(r.block_ids),
    createdAt: r.created_at,
  };
}

function rowToComment(r: any) {
  const c: any = {
    id: r.id,
    artifactId: r.artifact_id,
    blockId: r.block_id,
    text: r.text,
    selector: r.selector ? JSON.parse(r.selector) : null,
    status: r.status,
    createdAtRevision: r.created_at_revision,
    blockSnapshot: r.block_snapshot ? JSON.parse(r.block_snapshot) : null,
    createdAt: r.created_at,
  };
  if (r.resolved_at_revision != null) c.resolvedAtRevision = r.resolved_at_revision;
  if (r.resolved_by != null) c.resolvedBy = r.resolved_by;
  if (r.resolved_at != null) c.resolvedAt = r.resolved_at;
  if (r.reopened_at != null) c.reopenedAt = r.reopened_at;
  return c;
}

/* ── public API (signatures preserved) ──────────────────── */

export async function ensureStore() {
  getDb();
}

export async function listArtifacts() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM artifacts ORDER BY created_at DESC').all();
  return rows.map(rowToArtifact);
}

export async function createArtifact(source: string, title?: string) {
  const db = getDb();
  const parsed = parseRK(source);
  if (!parsed.ok) return { ok: false, errors: parsed.errors, warnings: parsed.warnings };

  const id = 'art_' + crypto.randomBytes(5).toString('hex');
  const artifact = { id, title: title || parsed.model.title, currentRevision: 1, createdAt: now(), updatedAt: now() };

  const insertArt = db.prepare(`
    INSERT INTO artifacts (id, title, current_revision, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertRev = db.prepare(`
    INSERT INTO revisions (id, artifact_id, number, source_text, source_hash, model, block_ids, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const flatIds = flattenBlocks(parsed.model.blocks).map((b: any) => b.id);
  const revId = `${id}_rev_1`;

  const txn = db.transaction(() => {
    insertArt.run(id, artifact.title, 1, artifact.createdAt, artifact.updatedAt);
    insertRev.run(revId, id, 1, source, sha(source), JSON.stringify(parsed.model), JSON.stringify(flatIds), artifact.createdAt);
  });
  txn();

  return { ok: true, artifact, revision: 1, model: parsed.model, warnings: parsed.warnings };
}

export async function addRevision(id: string, source: string, resolvedCommentIds: string[] = []) {
  const db = getDb();
  const artRow = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(id);
  if (!artRow) return { ok: false, status: 404, errors: [{ code: 'RK_ARTIFACT_NOT_FOUND', message: `Artifact not found: ${id}` }] };

  const parsed = parseRK(source);
  if (!parsed.ok) return { ok: false, errors: parsed.errors, warnings: parsed.warnings };

  const currentRev = db.prepare('SELECT * FROM revisions WHERE artifact_id = ? AND number = ?').get(id, artRow.current_revision);
  const currentModel = JSON.parse(currentRev.model);
  const next = artRow.current_revision + 1;
  const diff = diffBlocks(currentModel, parsed.model);

  const flatIds = flattenBlocks(parsed.model.blocks).map((b: any) => b.id);
  const newIds = new Set(flatIds);

  const commentRows = db.prepare('SELECT * FROM comments WHERE artifact_id = ?').all(id);
  const updateCmt = db.prepare(`UPDATE comments SET status = ?, resolved_at_revision = ?, resolved_by = ?, resolved_at = ? WHERE id = ?`);
  const orphanCmt = db.prepare(`UPDATE comments SET status = ? WHERE id = ?`);

  let orphanedIds: string[] = [];

  const txn = db.transaction(() => {
    db.prepare(`
      INSERT INTO revisions (id, artifact_id, number, source_text, source_hash, model, block_ids, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(`${id}_rev_${next}`, id, next, source, sha(source), JSON.stringify(parsed.model), JSON.stringify(flatIds), now());

    orphanedIds = [];
    for (const c of commentRows) {
      if (resolvedCommentIds.includes(c.id)) {
        updateCmt.run(COMMENT_RESOLVED, next, 'agent', now(), c.id);
      } else if (c.status === COMMENT_OPEN && !newIds.has(c.block_id)) {
        orphanCmt.run(COMMENT_ORPHANED, c.id);
        orphanedIds.push(c.id);
      }
    }

    db.prepare(`UPDATE artifacts SET current_revision = ?, title = ?, updated_at = ? WHERE id = ?`)
      .run(next, parsed.model.title, now(), id);
  });
  txn();

  return {
    ok: true,
    revision: next,
    model: parsed.model,
    diff: { ...diff, orphanedComments: orphanedIds },
    resolved: resolvedCommentIds,
    warnings: parsed.warnings,
  };
}

export async function getArtifactMeta(id: string) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(id);
  return row ? rowToArtifact(row) : null;
}

export async function getArtifact(id: string, rev: number | null = null) {
  const meta = await getArtifactMeta(id);
  if (!meta) return null;
  const revision = await getRevision(id, rev || meta.currentRevision);
  const comments = await getComments(id);
  return { meta, revision, comments };
}

export async function getRevision(id: string, rev: number) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM revisions WHERE artifact_id = ? AND number = ?').get(id, rev);
  return row ? rowToRevision(row) : null;
}

export async function getComments(id: string) {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM comments WHERE artifact_id = ?').all(id);
  return rows.map(rowToComment);
}

export async function addComment(id: string, blockId: string, text: string, selector: any = null) {
  const artifact = await getArtifact(id);
  if (!artifact) return { ok: false, status: 404, error: 'not found' };
  const block = findBlockById(artifact.revision.model.blocks, blockId);
  if (!block) return { ok: false, status: 404, error: 'block not found' };

  const db = getDb();
  const c = {
    id: 'cmt_' + crypto.randomBytes(5).toString('hex'),
    artifactId: id,
    blockId,
    text,
    selector: normalizeSelector(selector),
    status: COMMENT_OPEN,
    createdAtRevision: artifact.meta.currentRevision,
    blockSnapshot: block,
    createdAt: now(),
  };

  db.prepare(`
    INSERT INTO comments (id, artifact_id, block_id, text, selector, status, created_at_revision, block_snapshot, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(c.id, id, blockId, text, c.selector ? JSON.stringify(c.selector) : null, COMMENT_OPEN, c.createdAtRevision, JSON.stringify(block), c.createdAt);

  return { ok: true, comment: c };
}

export async function updateCommentStatus(id: string, commentId: string, status: string) {
  if (!HUMAN_EDITABLE_COMMENT_STATUSES.has(status)) return { ok: false, status: 400, error: 'invalid status' };
  const artifact = await getArtifact(id);
  if (!artifact) return { ok: false, status: 404, error: 'not found' };

  const db = getDb();
  const row = db.prepare('SELECT * FROM comments WHERE id = ? AND artifact_id = ?').get(commentId, id);
  if (!row) return { ok: false, status: 404, error: 'comment not found' };

  if (status === COMMENT_RESOLVED) {
    db.prepare(`UPDATE comments SET status = ?, resolved_at_revision = ?, resolved_by = 'human', resolved_at = ?, reopened_at = NULL WHERE id = ?`)
      .run(COMMENT_RESOLVED, artifact.meta.currentRevision, now(), commentId);
  } else {
    db.prepare(`UPDATE comments SET status = ?, resolved_at_revision = NULL, resolved_by = NULL, resolved_at = NULL, reopened_at = ? WHERE id = ?`)
      .run(COMMENT_OPEN, now(), commentId);
  }

  const updated = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId);
  return { ok: true, comment: rowToComment(updated) };
}

export async function deleteArtifact(id: string) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(id);
  if (!row) return false;
  db.prepare('DELETE FROM comments WHERE artifact_id = ?').run(id);
  db.prepare('DELETE FROM revisions WHERE artifact_id = ?').run(id);
  db.prepare('DELETE FROM artifacts WHERE id = ?').run(id);
  return true;
}

export async function getFeedback(id: string) {
  const artifact = await getArtifact(id);
  if (!artifact) return null;
  const blocks = flattenBlocks(artifact.revision.model.blocks);
  const comments = artifact.comments.filter((c: any) => c.status === COMMENT_OPEN || c.status === COMMENT_ORPHANED);
  return {
    artifactId: id,
    currentRevision: artifact.meta.currentRevision,
    url: `/a/${id}`,
    openComments: comments.map((c: any) => {
      const idx = blocks.findIndex((b: any) => b.id === c.blockId);
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
