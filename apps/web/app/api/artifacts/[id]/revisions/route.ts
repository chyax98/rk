import { getDb } from '../../../../../lib/db.ts';
import { processHTML } from '../../../../../lib/html-processor.ts';
import { diffAnchors } from '../../../../../lib/anchor-diff.ts';

function now() {
  return new Date().toISOString();
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const body = (await req.json()) as Record<string, string>;
    const rawHtml = body.html || body.source || '';
    if (!rawHtml) {
      return Response.json({ ok: false, error: 'html body required' }, { status: 400 });
    }

    const db = getDb();
    const artifact = db
      .prepare('SELECT id, current_revision, title FROM artifacts WHERE id = ?')
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

    const prevAnchors = db
      .prepare('SELECT anchor FROM anchors WHERE artifact_id = ? ORDER BY position')
      .all(id) as Array<{ anchor: string }>;
    const prevAnchorIds = prevAnchors.map((a) => a.anchor);
    const nextAnchorIds = anchors.map((a) => a.anchor);

    const txn = db.transaction(() => {
      db.prepare('UPDATE artifacts SET current_revision = ?, title = ?, updated_at = ? WHERE id = ?').run(
        nextRev,
        artifact.title || title,
        _now,
        id,
      );

      db.prepare(
        'INSERT INTO revisions (id, artifact_id, number, source_text, source_hash, model, html_source, processed_html, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ).run(revId, id, nextRev, '', '', '{}', rawHtml, processedHtml, _now);

      db.prepare('DELETE FROM anchors WHERE artifact_id = ?').run(id);
      const insertAnchor = db.prepare(
        'INSERT INTO anchors (id, revision_id, artifact_id, anchor, element_tag, position, text_preview) VALUES (?, ?, ?, ?, ?, ?, ?)',
      );
      for (const anchor of anchors) {
        insertAnchor.run(
          anchor.id,
          revId,
          id,
          anchor.anchor,
          anchor.elementTag,
          anchor.position,
          anchor.textPreview,
        );
      }

      const diff = diffAnchors(prevAnchorIds, nextAnchorIds);
      if (diff.removed.length > 0) {
        const openComments = db
          .prepare("SELECT id, anchor FROM comments WHERE artifact_id = ? AND status = 'open'")
          .all(id) as Array<{ id: string; anchor: string }>;
        for (const comment of openComments) {
          if (diff.removed.includes(comment.anchor)) {
            db.prepare("UPDATE comments SET status = 'orphaned' WHERE id = ?").run(comment.id);
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
