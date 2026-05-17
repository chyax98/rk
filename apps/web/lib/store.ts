import crypto from 'node:crypto';
import { parseRK } from '@renderkit/dsl';
import { COMMENT_STATUSES, validateTextQuoteSelector } from '@renderkit/shared/contracts';
import { diffAnchors } from './anchor-diff.ts';
import { getDb } from './db.ts';
import { type ProcessedAnchor, processHTML } from './html-processor.ts';

const COMMENT_OPEN = COMMENT_STATUSES[0];
const COMMENT_RESOLVED = COMMENT_STATUSES[1];
const COMMENT_ORPHANED = COMMENT_STATUSES[2];
const HUMAN_EDITABLE_COMMENT_STATUSES = new Set([COMMENT_OPEN, COMMENT_RESOLVED]);

/* ── DB row shapes (SQLite returns loosely-typed rows) ───── */

interface DbArtifact {
  id: string;
  title: string;
  current_revision: number;
  created_at: string;
  updated_at: string;
}

interface DbRevision {
  id: string;
  artifact_id: string;
  number: number;
  source_text: string;
  source_hash: string;
  model: string; // JSON string
  block_ids: string; // JSON string
  created_at: string;
}

interface DbComment {
  id: string;
  artifact_id: string;
  block_id: string;
  text: string;
  selector: string | null;
  status: string;
  created_at_revision: number;
  block_snapshot: string | null;
  resolved_at_revision: number | null;
  resolved_by: string | null;
  resolved_at: string | null;
  reopened_at: string | null;
  created_at: string;
}

/* ── runtime models ──────────────────────────────────────── */

export interface ParsedModel {
  title: string;
  surface: string;
  theme: string;
  blocks: unknown[];
}

export interface ParsedRK {
  ok: boolean;
  model: ParsedModel;
  errors?: Array<{ code: string; message: string }>;
  warnings?: Array<{ code: string; message: string }>;
}

export interface ArtifactMeta {
  id: string;
  title: string;
  currentRevision: number;
  format: string;
  createdAt: string;
  updatedAt: string;
}

export interface Revision {
  id: string;
  artifactId: string;
  number: number;
  sourceText: string;
  sourceHash: string;
  model: ParsedModel;
  blockIds: string[];
  createdAt: string;
}

export interface TextQuoteSelector {
  type: 'TextQuoteSelector';
  exact: string;
  prefix: string;
  suffix: string;
}

export interface Comment {
  id: string;
  artifactId: string;
  blockId: string;
  text: string;
  selector: TextQuoteSelector | null;
  status: string;
  createdAtRevision: number;
  blockSnapshot: unknown | null;
  createdAt: string;
  resolvedAtRevision?: number;
  resolvedBy?: string;
  resolvedAt?: string;
  reopenedAt?: string;
}

export interface BlockDiff {
  addedBlocks: string[];
  removedBlocks: string[];
  modifiedBlocks: string[];
  orphanedComments: string[];
}

interface RkBlock {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  sourceRange?: { startLine: number; endLine: number };
  sourceExcerpt?: string;
}

/* ── helpers ────────────────────────────────────────────── */

function sha(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}
function now(): string {
  return new Date().toISOString();
}

function flattenBlocks(blocks: unknown[]): RkBlock[] {
  const out: RkBlock[] = [];
  for (const b of blocks || []) {
    const block = b as RkBlock;
    out.push(block);
    if (Array.isArray(block.props?.children)) out.push(...flattenBlocks(block.props.children));
    if (Array.isArray(block.props?.tabs)) {
      for (const tab of block.props.tabs as Array<{ blocks: unknown[] }>) {
        if (Array.isArray(tab.blocks)) out.push(...flattenBlocks(tab.blocks));
      }
    }
  }
  return out;
}

function findBlockById(blocks: unknown[], id: string): RkBlock | null {
  for (const b of blocks || []) {
    const block = b as RkBlock;
    if (block.id === id) return block;
    const child = findBlockById((block.props?.children || []) as unknown[], id);
    if (child) return child;
    if (Array.isArray(block.props?.tabs)) {
      for (const tab of block.props.tabs as Array<{ blocks: unknown[] }>) {
        const found = findBlockById(tab.blocks || [], id);
        if (found) return found;
      }
    }
  }
  return null;
}

function normalizeSelector(selector: unknown): TextQuoteSelector | null {
  if (!selector || typeof selector !== 'object') return null;
  const s = selector as Record<string, unknown>;
  const selectorIssues = validateTextQuoteSelector({
    ...s,
    type: (s.type as string) || 'TextQuoteSelector',
  });
  if (selectorIssues.length > 0 && selectorIssues.some((issue) => issue.path === '$.exact'))
    return null;
  const exact = String(s.exact || '')
    .trim()
    .slice(0, 500);
  if (!exact) return null;
  return {
    type: ((s.type as string) || 'TextQuoteSelector') as 'TextQuoteSelector',
    exact,
    prefix: String(s.prefix || '').slice(-80),
    suffix: String(s.suffix || '').slice(0, 80),
  };
}

function brief(b: RkBlock | null): { id: string; type: string } | null {
  return b ? { id: b.id, type: b.type } : null;
}

function diffBlocks(
  a: ParsedModel,
  b: ParsedModel,
): { addedBlocks: string[]; removedBlocks: string[]; modifiedBlocks: string[] } {
  const am = new Map(flattenBlocks(a.blocks).map((x) => [x.id, x]));
  const bm = new Map(flattenBlocks(b.blocks).map((x) => [x.id, x]));
  const addedBlocks = [...bm.keys()].filter((k) => !am.has(k));
  const removedBlocks = [...am.keys()].filter((k) => !bm.has(k));
  const modifiedBlocks = [...bm.keys()].filter(
    (k) =>
      am.has(k) && sha(JSON.stringify(am.get(k)!.props)) !== sha(JSON.stringify(bm.get(k)!.props)),
  );
  return { addedBlocks, removedBlocks, modifiedBlocks };
}

/* ── row mappers ────────────────────────────────────────── */

function rowToArtifact(r: DbArtifact): ArtifactMeta {
  return {
    id: r.id,
    title: r.title,
    currentRevision: r.current_revision,
    format: (r as any).format || 'rkmd',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function rowToRevision(r: DbRevision): Revision {
  return {
    id: r.id,
    artifactId: r.artifact_id,
    number: r.number,
    sourceText: r.source_text,
    sourceHash: r.source_hash,
    model: JSON.parse(r.model) as ParsedModel,
    blockIds: JSON.parse(r.block_ids) as string[],
    createdAt: r.created_at,
  };
}

function rowToComment(r: DbComment): Comment {
  const c: Comment = {
    id: r.id,
    artifactId: r.artifact_id,
    blockId: r.block_id,
    text: r.text,
    selector: r.selector ? (JSON.parse(r.selector) as TextQuoteSelector) : null,
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

/* ── public API ─────────────────────────────────────────── */

export async function ensureStore(): Promise<void> {
  getDb();
}

export async function listArtifacts(): Promise<ArtifactMeta[]> {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM artifacts ORDER BY created_at DESC').all() as DbArtifact[];
  return rows.map(rowToArtifact);
}

export async function createArtifact(source: string, title?: string) {
  const db = getDb();
  const parsed = parseRK(source) as ParsedRK;
  if (!parsed.ok) return { ok: false as const, errors: parsed.errors, warnings: parsed.warnings };

  const id = 'art_' + crypto.randomBytes(5).toString('hex');
  const artifact: ArtifactMeta = {
    id,
    title: title || parsed.model.title,
    currentRevision: 1,
    format: 'rkmd',
    createdAt: now(),
    updatedAt: now(),
  };

  const insertArt = db.prepare(`
    INSERT INTO artifacts (id, title, current_revision, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertRev = db.prepare(`
    INSERT INTO revisions (id, artifact_id, number, source_text, source_hash, model, block_ids, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const flatIds = flattenBlocks(parsed.model.blocks).map((b) => b.id);
  const revId = `${id}_rev_1`;

  const txn = db.transaction(() => {
    insertArt.run(id, artifact.title, 1, artifact.createdAt, artifact.updatedAt);
    insertRev.run(
      revId,
      id,
      1,
      source,
      sha(source),
      JSON.stringify(parsed.model),
      JSON.stringify(flatIds),
      artifact.createdAt,
    );
  });
  txn();

  return {
    ok: true as const,
    artifact,
    revision: 1,
    model: parsed.model,
    warnings: parsed.warnings,
  };
}

export async function addRevision(id: string, source: string, resolvedCommentIds: string[] = []) {
  const db = getDb();
  const artRow = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(id) as
    | DbArtifact
    | undefined;
  if (!artRow)
    return {
      ok: false as const,
      status: 404,
      errors: [{ code: 'RK_ARTIFACT_NOT_FOUND', message: `Artifact not found: ${id}` }],
    };

  const parsed = parseRK(source) as ParsedRK;
  if (!parsed.ok) return { ok: false as const, errors: parsed.errors, warnings: parsed.warnings };

  const currentRev = db
    .prepare('SELECT * FROM revisions WHERE artifact_id = ? AND number = ?')
    .get(id, artRow.current_revision) as DbRevision;
  const currentModel = JSON.parse(currentRev.model) as ParsedModel;
  const next = artRow.current_revision + 1;
  const diff = diffBlocks(currentModel, parsed.model);

  const flatIds = flattenBlocks(parsed.model.blocks).map((b) => b.id);
  const newIds = new Set(flatIds);

  const commentRows = db
    .prepare('SELECT * FROM comments WHERE artifact_id = ?')
    .all(id) as DbComment[];
  const updateCmt = db.prepare(
    `UPDATE comments SET status = ?, resolved_at_revision = ?, resolved_by = ?, resolved_at = ? WHERE id = ?`,
  );
  const orphanCmt = db.prepare(`UPDATE comments SET status = ? WHERE id = ?`);

  let orphanedIds: string[] = [];

  const txn = db.transaction(() => {
    db.prepare(`
      INSERT INTO revisions (id, artifact_id, number, source_text, source_hash, model, block_ids, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `${id}_rev_${next}`,
      id,
      next,
      source,
      sha(source),
      JSON.stringify(parsed.model),
      JSON.stringify(flatIds),
      now(),
    );

    orphanedIds = [];
    for (const c of commentRows) {
      if (resolvedCommentIds.includes(c.id)) {
        updateCmt.run(COMMENT_RESOLVED, next, 'agent', now(), c.id);
      } else if (c.status === COMMENT_OPEN && !newIds.has(c.block_id)) {
        orphanCmt.run(COMMENT_ORPHANED, c.id);
        orphanedIds.push(c.id);
      }
    }

    db.prepare(
      `UPDATE artifacts SET current_revision = ?, title = ?, updated_at = ? WHERE id = ?`,
    ).run(next, parsed.model.title, now(), id);
  });
  txn();

  return {
    ok: true as const,
    revision: next,
    model: parsed.model,
    diff: { ...diff, orphanedComments: orphanedIds },
    resolved: resolvedCommentIds,
    warnings: parsed.warnings,
  };
}

export async function getArtifactMeta(id: string): Promise<ArtifactMeta | null> {
  const db = getDb();
  const row = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(id) as DbArtifact | undefined;
  return row ? rowToArtifact(row) : null;
}

export async function getArtifact(id: string, rev: number | null = null) {
  const meta = await getArtifactMeta(id);
  if (!meta) return null;
  const revision = await getRevision(id, rev || meta.currentRevision);
  const comments = await getComments(id);
  return { meta, revision, comments };
}

export async function getRevision(id: string, rev: number): Promise<Revision | null> {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM revisions WHERE artifact_id = ? AND number = ?')
    .get(id, rev) as DbRevision | undefined;
  return row ? rowToRevision(row) : null;
}

export async function getComments(id: string): Promise<Comment[]> {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM comments WHERE artifact_id = ?').all(id) as DbComment[];
  return rows.map(rowToComment);
}

export async function addComment(
  id: string,
  blockId: string,
  text: string,
  selector: unknown = null,
) {
  const artifact = await getArtifact(id);
  if (!artifact || !artifact.revision)
    return { ok: false as const, status: 404, error: 'not found' };
  const block = findBlockById(artifact.revision.model.blocks, blockId);
  if (!block) return { ok: false as const, status: 404, error: 'block not found' };

  const db = getDb();
  const c: Comment = {
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
  `).run(
    c.id,
    id,
    blockId,
    text,
    c.selector ? JSON.stringify(c.selector) : null,
    COMMENT_OPEN,
    c.createdAtRevision,
    JSON.stringify(block),
    c.createdAt,
  );

  return { ok: true as const, comment: c };
}

export async function updateCommentStatus(id: string, commentId: string, status: string) {
  if (!HUMAN_EDITABLE_COMMENT_STATUSES.has(status as any))
    return { ok: false as const, status: 400, error: 'invalid status' };
  const artifact = await getArtifact(id);
  if (!artifact) return { ok: false as const, status: 404, error: 'not found' };

  const db = getDb();
  const row = db
    .prepare('SELECT * FROM comments WHERE id = ? AND artifact_id = ?')
    .get(commentId, id) as DbComment | undefined;
  if (!row) return { ok: false as const, status: 404, error: 'comment not found' };

  if (status === COMMENT_RESOLVED) {
    db.prepare(
      `UPDATE comments SET status = ?, resolved_at_revision = ?, resolved_by = 'human', resolved_at = ?, reopened_at = NULL WHERE id = ?`,
    ).run(COMMENT_RESOLVED, artifact.meta.currentRevision, now(), commentId);
  } else {
    db.prepare(
      `UPDATE comments SET status = ?, resolved_at_revision = NULL, resolved_by = NULL, resolved_at = NULL, reopened_at = ? WHERE id = ?`,
    ).run(COMMENT_OPEN, now(), commentId);
  }

  const updated = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId) as DbComment;
  return { ok: true as const, comment: rowToComment(updated) };
}

export async function deleteArtifact(id: string): Promise<boolean> {
  const db = getDb();
  const row = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(id) as DbArtifact | undefined;
  if (!row) return false;
  db.prepare('DELETE FROM comments WHERE artifact_id = ?').run(id);
  db.prepare('DELETE FROM revisions WHERE artifact_id = ?').run(id);
  db.prepare('DELETE FROM artifacts WHERE id = ?').run(id);
  return true;
}

export async function getFeedback(id: string) {
  const artifact = await getArtifact(id);
  if (!artifact || !artifact.revision) return null;
  const blocks = flattenBlocks(artifact.revision.model.blocks);
  const comments = artifact.comments.filter(
    (c) => c.status === COMMENT_OPEN || c.status === COMMENT_ORPHANED,
  );
  return {
    artifactId: id,
    currentRevision: artifact.meta.currentRevision,
    url: `/a/${id}`,
    openComments: comments.map((c) => {
      const idx = blocks.findIndex((b) => b.id === c.blockId);
      const block = idx >= 0 ? blocks[idx] : null;
      return {
        id: c.id,
        blockId: c.blockId,
        status: c.status,
        text: c.text,
        selector: c.selector || null,
        createdAtRevision: c.createdAtRevision,
        block: block || (c.blockSnapshot as RkBlock),
        blockSnapshot: c.blockSnapshot,
        sourceRange: (block || (c.blockSnapshot as RkBlock))?.sourceRange,
        sourceExcerpt: (block || (c.blockSnapshot as RkBlock))?.sourceExcerpt,
        neighbors: {
          prev: idx > 0 ? [brief(blocks[idx - 1])] : [],
          next: idx >= 0 && idx < blocks.length - 1 ? [brief(blocks[idx + 1])] : [],
        },
      };
    }),
  };
}

/* ── HTML artifact support ─────────────────────────────── */

export interface HtmlArtifactResult {
  artifactId: string;
  revision: number;
  url: string;
}

export interface HtmlArtifactBundle {
  meta: ArtifactMeta;
  revision: {
    id: string;
    number: number;
    processedHtml: string | null;
    htmlSource: string | null;
    createdAt: string;
  };
  anchors: ProcessedAnchor[];
  comments: Comment[];
}

export async function pushHTML(rawHtml: string, file?: string): Promise<HtmlArtifactResult> {
  const db = getDb();
  const { processedHtml, anchors, title } = await processHTML(rawHtml);
  const _now = now();

  // Check for existing artifact by file name
  let artifactId: string | null = null;
  let currentRev = 0;

  if (file) {
    const existing = db
      .prepare('SELECT id, current_revision, title FROM artifacts WHERE title = ? AND format = ?')
      .get(file, 'html') as DbArtifact | undefined;
    if (existing) {
      artifactId = existing.id;
      currentRev = existing.current_revision;
    }
  }

  const isNew = !artifactId;
  if (isNew) {
    artifactId = 'art_' + crypto.randomBytes(5).toString('hex');
    currentRev = 0;
  }

  const nextRev = currentRev + 1;
  const revId = `${artifactId}_rev_${nextRev}`;
  const anchorIds = anchors.map((a) => a.anchor);

  // Get previous anchors for diff (only on update)
  let prevAnchorIds: string[] = [];
  if (!isNew) {
    const prevAnchors = db
      .prepare('SELECT anchor FROM anchors WHERE artifact_id = ? ORDER BY position')
      .all(artifactId) as Array<{ anchor: string }>;
    prevAnchorIds = prevAnchors.map((a) => a.anchor);
  }

  const txn = db.transaction(() => {
    if (isNew) {
      db.prepare(`
        INSERT INTO artifacts (id, title, current_revision, format, created_at, updated_at)
        VALUES (?, ?, ?, 'html', ?, ?)
      `).run(artifactId, file || title, 1, _now, _now);
    } else {
      db.prepare(
        `UPDATE artifacts SET current_revision = ?, title = ?, updated_at = ? WHERE id = ?`,
      ).run(nextRev, file || title, _now, artifactId);
    }

    db.prepare(`
      INSERT INTO revisions (id, artifact_id, number, source_text, source_hash, model, block_ids, html_source, processed_html, created_at)
      VALUES (?, ?, ?, '', '', '{}', '[]', ?, ?, ?)
    `).run(revId, artifactId, nextRev, rawHtml, processedHtml, _now);

    // Delete old anchors for this artifact and insert new ones
    db.prepare('DELETE FROM anchors WHERE artifact_id = ?').run(artifactId);
    const insertAnchor = db.prepare(`
      INSERT INTO anchors (id, revision_id, artifact_id, anchor, element_tag, position, text_preview)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const a of anchors) {
      insertAnchor.run(a.id, revId, artifactId, a.anchor, a.elementTag, a.position, a.textPreview);
    }

    // Mark orphaned comments for removed anchors
    if (!isNew) {
      const diff = diffAnchors(prevAnchorIds, anchorIds);
      if (diff.removed.length > 0) {
        const commentRows = db
          .prepare('SELECT id, block_id FROM comments WHERE artifact_id = ? AND status = ?')
          .all(artifactId, COMMENT_OPEN) as DbComment[];
        for (const c of commentRows) {
          if (diff.removed.includes(c.block_id)) {
            db.prepare('UPDATE comments SET status = ? WHERE id = ?').run(COMMENT_ORPHANED, c.id);
          }
        }
      }
    }
  });
  txn();

  return {
    artifactId: artifactId!,
    revision: nextRev,
    url: `/a/${artifactId}`,
  };
}

export async function getHtmlArtifact(id: string): Promise<HtmlArtifactBundle | null> {
  const db = getDb();

  const artRow = db
    .prepare('SELECT * FROM artifacts WHERE id = ? AND format = ?')
    .get(id, 'html') as DbArtifact | undefined;
  if (!artRow) return null;

  const revRow = db
    .prepare('SELECT * FROM revisions WHERE artifact_id = ? AND number = ?')
    .get(id, artRow.current_revision) as DbRevision | undefined;
  if (!revRow) return null;

  const anchorRows = db
    .prepare('SELECT * FROM anchors WHERE artifact_id = ? ORDER BY position')
    .all(id) as Array<{
    id: string;
    anchor: string;
    element_tag: string;
    position: number;
    text_preview: string | null;
  }>;

  const commentRows = db
    .prepare('SELECT * FROM comments WHERE artifact_id = ?')
    .all(id) as DbComment[];

  return {
    meta: rowToArtifact(artRow),
    revision: {
      id: revRow.id,
      number: revRow.number,
      processedHtml: (revRow as any).processed_html || null,
      htmlSource: (revRow as any).html_source || null,
      createdAt: revRow.created_at,
    },
    anchors: anchorRows.map((a) => ({
      id: a.id,
      anchor: a.anchor,
      elementTag: a.element_tag,
      position: a.position,
      textPreview: a.text_preview,
    })),
    comments: commentRows.map(rowToComment),
  };
}
