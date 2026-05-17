import { getDb } from '../../../../../lib/db.ts';
import { processHTML } from '../../../../../lib/html-processor.ts';
import { diffAnchors } from '../../../../../lib/anchor-diff.ts';
import crypto from 'node:crypto';

function now() {
  return new Date().toISOString();
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const body = await req.json() as Record<string, string>;
    const rawHtml = body.html || body.source || '';
    if (!rawHtml) {
      return Response.json({ ok: false, error: 'html body required' }, { status: 400 });
    }

    const db = getDb();

    // Check artifact exists
    const artifact = db.prepare('SELECT id, current_revision, title FROM artifacts WHERE id = ?')
      .get(id) as { id: string; current_revision: number; title: string } | undefined;

    if (!artifact) {
      return Response.json(
        { ok: false, error: { code: 'RK_ARTIFACT_NOT_FOUND', message: 'artifact not found' } },
        { status: 404 },
      );
    }

    const { processedHtml, anchors, title } = await processHTML(rawHtml);
    const nextRev = artifact.current_revision + 1;
    const revId = `${id}_rev_${nextRev}`;
    const _now = now();

    // Get previous anchors for diff
    const prevAnchors = db
      .prepare('SELECT anchor FROM anchors WHERE artifact_id = ? ORDER BY position')
      .all(id) as Array<{ anchor: string }>;
    const prevAnchorIds = prevAnchors.map((a) => a.anchor);
    const anchorIds = anchors.map((a) => a.anchor);

    const txn = db.transaction(() => {
      db.prepare(`UPDATE artifacts SET current_revision = ?, title = ?, updated_at = ? WHERE id = ?`)
        .run(nextRev, artifact.title || title, _now, id);

      db.prepare(`
        INSERT INTO revisions (id, artifact_id, number, source_text, source_hash, model, block_ids, html_source, processed_html, created_at)
        VALUES (?, ?, ?, '', '', '{}', '[]', ?, ?, ?)
      `).run(revId, id, nextRev, rawHtml, processedHtml, _now);

      // Replace anchors
      db.prepare('DELETE FROM anchors WHERE artifact_id = ?').run(id);
      const insertAnchor = db.prepare(`
        INSERT INTO anchors (id, revision_id, artifact_id, anchor, element_tag, position, text_preview)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const a of anchors) {
        insertAnchor.run(
          a.id, revId, id, a.anchor, a.elementTag, a.position, a.textPreview,
        );
      }

      // Mark orphaned comments
      const diff = diffAnchors(prevAnchorIds, anchorIds);
      if (diff.removed.length > 0) {
        const openComments = db
          .prepare("SELECT id, block_id FROM comments WHERE artifact_id = ? AND status = 'open'")
          .all(id) as Array<{ id: string; block_id: string }>;
        for (const c of openComments) {
          if (diff.removed.includes(c.block_id)) {
            db.prepare("UPDATE comments SET status = 'orphaned' WHERE id = ?").run(c.id);
          }
        }
      }
    });

    txn();

    return Response.json({
      ok: true,
      artifactId: id,
      revision: nextRev,
      url: `/a/${id}`,
    });
  } catch (e: unknown) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
