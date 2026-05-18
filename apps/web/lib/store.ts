import crypto from 'node:crypto';
import { diffAnchors } from './anchor-diff.ts';
import { getDb } from './db.ts';
import { type ProcessedAnchor, processHTML } from './html-processor.ts';

// All tables use CREATE TABLE IF NOT EXISTS (see db.ts): artifacts, revisions, comments, anchors, form_submissions

const COMMENT_OPEN = 'open';
const COMMENT_RESOLVED = 'resolved';
const COMMENT_ORPHANED = 'orphaned';

/* ── DB row shapes (SQLite returns loosely-typed rows) ───── */

interface DbArtifact {
  id: string;
  title: string;
  current_revision: number;
  format: string;
  created_at: string;
  updated_at: string;
  tags?: string;
  archived?: number;
}

interface DbRevision {
  id: string;
  artifact_id: string;
  number: number;
  source_text: string;
  source_hash: string;
  model: string;
  html_source: string | null;
  processed_html: string | null;
  created_at: string;
}

interface DbComment {
  id: string;
  artifact_id: string;
  anchor: string;
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

interface DbAnchor {
  id: string;
  revision_id: string;
  artifact_id: string;
  anchor: string;
  element_tag: string;
  position: number;
  text_preview: string | null;
}

/* ── runtime models ──────────────────────────────────────── */

export interface TextQuoteSelector {
  type: 'TextQuoteSelector';
  exact: string;
  prefix: string;
  suffix: string;
}

export interface Comment {
  id: string;
  artifactId: string;
  anchor: string;
  text: string;
  selector: TextQuoteSelector | null;
  status: string;
  createdAtRevision: number;
  createdAt: string;
  resolvedAtRevision?: number;
  resolvedBy?: string;
  resolvedAt?: string;
  reopenedAt?: string;
}

export interface ArtifactMeta {
  id: string;
  title: string;
  currentRevision: number;
  format: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  archived: boolean;
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

export interface RevisionSummary {
  revisionNumber: number;
  createdAt: number;
  title: string;
}

/* ── helpers ────────────────────────────────────────────── */

function _sha(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function now(): string {
  return new Date().toISOString();
}

function normalizeSelector(selector: unknown): TextQuoteSelector | null {
  if (!selector || typeof selector !== 'object') return null;
  const s = selector as Record<string, unknown>;
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

/* ── row mappers ────────────────────────────────────────── */

function rowToArtifact(r: DbArtifact): ArtifactMeta {
  return {
    id: r.id,
    title: r.title,
    currentRevision: r.current_revision,
    format: r.format || 'html',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    tags: JSON.parse(r.tags ?? '[]') as string[],
    archived: Boolean(r.archived),
  };
}

function rowToComment(r: DbComment): Comment {
  const c: Comment = {
    id: r.id,
    artifactId: r.artifact_id,
    anchor: r.anchor,
    text: r.text,
    selector: r.selector ? (JSON.parse(r.selector) as TextQuoteSelector) : null,
    status: r.status,
    createdAtRevision: r.created_at_revision,
    createdAt: r.created_at,
  };

  if (r.resolved_by != null) c.resolvedBy = r.resolved_by;
  if (r.resolved_at != null) c.resolvedAt = r.resolved_at;
  if (r.reopened_at != null) c.reopenedAt = r.reopened_at;
  return c;
}

/* ── public API ─────────────────────────────────────────── */

export async function ensureStore(): Promise<void> {
  getDb();
}

export async function listArtifacts(includeArchived = false): Promise<ArtifactMeta[]> {
  const db = getDb();
  const sql = includeArchived
    ? 'SELECT * FROM artifacts ORDER BY updated_at DESC'
    : 'SELECT * FROM artifacts WHERE archived = 0 ORDER BY updated_at DESC';
  const rows = db.prepare(sql).all() as DbArtifact[];
  return rows.map(rowToArtifact);
}

export async function getArtifactMeta(id: string): Promise<ArtifactMeta | null> {
  const db = getDb();
  const row = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(id) as DbArtifact | undefined;
  return row ? rowToArtifact(row) : null;
}

/** Simplified: always returns HTML artifact bundle */
export async function getArtifact(id: string): Promise<HtmlArtifactBundle | null> {
  return getHtmlArtifact(id);
}

/* ── Comments ───────────────────────────────────────────── */

export async function getComments(artifactId: string): Promise<Comment[]> {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM comments WHERE artifact_id = ?')
    .all(artifactId) as DbComment[];
  return rows.map(rowToComment);
}

export async function addComment(
  artifactId: string,
  anchor: string,
  text: string,
  selector: unknown = null,
) {
  const db = getDb();
  const artifact = db
    .prepare('SELECT id, current_revision FROM artifacts WHERE id = ?')
    .get(artifactId) as Pick<DbArtifact, 'id' | 'current_revision'> | undefined;
  if (!artifact) return { ok: false as const, status: 404, error: 'artifact not found' };

  const anchorRow = db
    .prepare('SELECT 1 FROM anchors WHERE artifact_id = ? AND anchor = ?')
    .get(artifactId, anchor) as { 1: number } | undefined;
  if (!anchorRow) return { ok: false as const, status: 400, error: 'anchor not found' };

  const currentRev = artifact.current_revision;
  const c: Comment = {
    id: `cmt_${crypto.randomBytes(5).toString('hex')}`,
    artifactId,
    anchor,
    text,
    selector: normalizeSelector(selector),
    status: COMMENT_OPEN,
    createdAtRevision: currentRev,
    createdAt: now(),
  };

  db.prepare(`
    INSERT INTO comments (id, artifact_id, anchor, text, selector, status, created_at_revision, block_snapshot, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)
  `).run(
    c.id,
    artifactId,
    anchor,
    text,
    c.selector ? JSON.stringify(c.selector) : null,
    COMMENT_OPEN,
    currentRev,
    c.createdAt,
  );

  return { ok: true as const, comment: c };
}

export async function updateCommentStatus(artifactId: string, commentId: string, status: string) {
  const validStatuses = new Set([COMMENT_OPEN, COMMENT_RESOLVED]);
  if (!validStatuses.has(status))
    return { ok: false as const, status: 400, error: 'invalid status' };

  const db = getDb();
  const row = db
    .prepare('SELECT * FROM comments WHERE id = ? AND artifact_id = ?')
    .get(commentId, artifactId) as DbComment | undefined;
  if (!row) return { ok: false as const, status: 404, error: 'comment not found' };

  if (status === COMMENT_RESOLVED) {
    db.prepare(
      `UPDATE comments SET status = ?, resolved_at_revision = ?, resolved_by = 'human', resolved_at = ?, reopened_at = NULL WHERE id = ?`,
    ).run(COMMENT_RESOLVED, row.created_at_revision, now(), commentId);
  } else {
    db.prepare(
      `UPDATE comments SET status = ?, resolved_at_revision = NULL, resolved_by = NULL, resolved_at = NULL, reopened_at = ? WHERE id = ?`,
    ).run(COMMENT_OPEN, now(), commentId);
  }

  const updated = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId) as DbComment;
  return { ok: true as const, comment: rowToComment(updated) };
}

export async function updateCommentText(artifactId: string, commentId: string, text: string) {
  const nextText = text.trim();
  if (!nextText) return { ok: false as const, status: 400, error: 'text required' };

  const db = getDb();
  const row = db
    .prepare('SELECT * FROM comments WHERE id = ? AND artifact_id = ?')
    .get(commentId, artifactId) as DbComment | undefined;
  if (!row) return { ok: false as const, status: 404, error: 'comment not found' };

  db.prepare('UPDATE comments SET text = ? WHERE id = ? AND artifact_id = ?').run(
    nextText,
    commentId,
    artifactId,
  );

  const updated = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId) as DbComment;
  return { ok: true as const, comment: rowToComment(updated) };
}

export async function resolveComment(commentId: string) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId) as
    | DbComment
    | undefined;
  if (!row) return false;
  db.prepare(
    `UPDATE comments SET status = ?, resolved_by = 'human', resolved_at = ? WHERE id = ?`,
  ).run(COMMENT_RESOLVED, now(), commentId);
  return true;
}

/* ── Delete ─────────────────────────────────────────────── */

export async function deleteArtifact(id: string): Promise<boolean> {
  const db = getDb();
  const row = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(id) as DbArtifact | undefined;
  if (!row) return false;
  db.prepare('DELETE FROM comments WHERE artifact_id = ?').run(id);
  db.prepare('DELETE FROM anchors WHERE artifact_id = ?').run(id);
  db.prepare('DELETE FROM form_submissions WHERE artifact_id = ?').run(id);
  db.prepare('DELETE FROM revisions WHERE artifact_id = ?').run(id);
  db.prepare('DELETE FROM artifacts WHERE id = ?').run(id);
  return true;
}

/* ── Form Submissions ───────────────────────────────────── */

export interface FormSubmission {
  id: string;
  formTitle: string;
  fields: { name: string; label: string; value: unknown }[];
  createdAt: number;
}

export async function addFormSubmission(
  artifactId: string,
  formTitle: string,
  fields: { name: string; label: string; value: unknown }[],
): Promise<{ id: string }> {
  const db = getDb();
  const id = `sub_${crypto.randomBytes(8).toString('hex')}`;
  const ts = Date.now();
  db.prepare(
    'INSERT INTO form_submissions (id, artifact_id, form_title, fields, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, artifactId, formTitle, JSON.stringify(fields), ts);
  return { id };
}

export async function getFormSubmissions(artifactId: string): Promise<FormSubmission[]> {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM form_submissions WHERE artifact_id = ? ORDER BY created_at DESC')
    .all(artifactId) as Array<{
    id: string;
    form_title: string;
    fields: string;
    created_at: number;
  }>;
  return rows.map((r) => ({
    id: r.id,
    formTitle: r.form_title,
    fields: JSON.parse(r.fields),
    createdAt: r.created_at,
  }));
}

/* ── Feedback (CLI) ─────────────────────────────────────── */

export async function getFeedback(id: string) {
  const artifact = await getHtmlArtifact(id);
  if (!artifact) return null;

  const openComments = artifact.comments.filter(
    (c) => c.status === COMMENT_OPEN || c.status === COMMENT_ORPHANED,
  );

  const submissions = await getFormSubmissions(id);

  return {
    artifactId: id,
    currentRevision: artifact.meta.currentRevision,
    url: `/a/${id}`,
    openComments: openComments.map((c) => ({
      id: c.id,
      anchor: c.anchor,
      status: c.status,
      text: c.text,
      selector: c.selector || null,
      createdAtRevision: c.createdAtRevision,
      createdAt: c.createdAt,
    })),
    submissions,
  };
}

/* ── HTML artifact: push ────────────────────────────────── */

export interface HtmlArtifactResult {
  artifactId: string;
  revision: number;
  url: string;
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
    artifactId = `art_${crypto.randomBytes(5).toString('hex')}`;
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
      INSERT INTO revisions (id, artifact_id, number, source_text, source_hash, model, html_source, processed_html, created_at)
      VALUES (?, ?, ?, '', '', '{}', ?, ?, ?)
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
          .prepare('SELECT id, anchor FROM comments WHERE artifact_id = ? AND status = ?')
          .all(artifactId, COMMENT_OPEN) as DbComment[];
        for (const c of commentRows) {
          if (diff.removed.includes(c.anchor)) {
            db.prepare('UPDATE comments SET status = ? WHERE id = ?').run(COMMENT_ORPHANED, c.id);
          }
        }
      }
    }
  });
  txn();

  const finalArtifactId = artifactId || '';
  return {
    artifactId: finalArtifactId,
    revision: nextRev,
    url: `/a/${finalArtifactId}`,
  };
}

/* ── HTML artifact: revision history ────────────────────── */

function extractRevisionTitle(
  processedHtml: string | null | undefined,
  revisionNumber: number,
): string {
  if (!processedHtml) return `版本 ${revisionNumber}`;
  const title = processedHtml.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
  if (title) return title;
  const h1 = processedHtml
    .match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
    ?.replace(/<[^>]+>/g, '')
    ?.replace(/\s+/g, ' ')
    ?.trim();
  return h1 || `版本 ${revisionNumber}`;
}

export async function listRevisions(artifactId: string): Promise<RevisionSummary[]> {
  const db = getDb();
  const rows = db
    .prepare(
      'SELECT number, created_at, processed_html FROM revisions WHERE artifact_id = ? ORDER BY number DESC',
    )
    .all(artifactId) as Array<{
    number: number;
    created_at: string;
    processed_html: string | null;
  }>;

  return rows.map((r) => ({
    revisionNumber: r.number,
    createdAt: Date.parse(r.created_at) || 0,
    title: extractRevisionTitle(r.processed_html, r.number),
  }));
}

export async function getRevision(
  artifactId: string,
  revisionNumber: number,
): Promise<{ processedHtml: string | null }> {
  const db = getDb();
  const row = db
    .prepare('SELECT processed_html FROM revisions WHERE artifact_id = ? AND number = ?')
    .get(artifactId, revisionNumber) as { processed_html: string | null } | undefined;
  return { processedHtml: row?.processed_html || null };
}

/* ── HTML artifact: read ────────────────────────────────── */

export async function updateArtifactMeta(
  id: string,
  patch: { tags?: string[]; archived?: boolean },
): Promise<boolean> {
  const db = getDb();
  const row = db.prepare('SELECT id FROM artifacts WHERE id = ?').get(id) as
    | { id: string }
    | undefined;
  if (!row) return false;

  const sets: string[] = [];
  const values: unknown[] = [];

  if (patch.tags !== undefined) {
    sets.push('tags = ?');
    values.push(JSON.stringify(patch.tags));
  }
  if (patch.archived !== undefined) {
    sets.push('archived = ?');
    values.push(patch.archived ? 1 : 0);
  }

  if (sets.length === 0) return true;

  sets.push('updated_at = ?');
  values.push(now());
  values.push(id);

  db.prepare(`UPDATE artifacts SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return true;
}

export async function getHtmlArtifact(id: string): Promise<HtmlArtifactBundle | null> {
  const db = getDb();

  const artRow = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(id) as
    | DbArtifact
    | undefined;
  if (!artRow) return null;

  const revRow = db
    .prepare('SELECT * FROM revisions WHERE artifact_id = ? AND number = ?')
    .get(id, artRow.current_revision) as DbRevision | undefined;
  if (!revRow) return null;

  const anchorRows = db
    .prepare('SELECT * FROM anchors WHERE artifact_id = ? ORDER BY position')
    .all(id) as DbAnchor[];

  const commentRows = db
    .prepare('SELECT * FROM comments WHERE artifact_id = ?')
    .all(id) as DbComment[];

  return {
    meta: rowToArtifact(artRow),
    revision: {
      id: revRow.id,
      number: revRow.number,
      processedHtml: revRow.processed_html || null,
      htmlSource: revRow.html_source || null,
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
