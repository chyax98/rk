import {
  getArtifact,
  getArtifactMeta,
  purgeArtifact,
  restoreArtifact,
  softDeleteArtifact,
  updateArtifactMeta,
} from '../../../../lib/store.ts';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artifact = await getArtifact(id);
  if (!artifact?.revision.processedHtml)
    return Response.json(
      { ok: false, error: { code: 'RK_ARTIFACT_NOT_FOUND', message: 'not found' } },
      { status: 404 },
    );

  const openCount = artifact.comments.filter((c) => c.status === 'open').length;
  const addressedCount = artifact.comments.filter((c) => c.status === 'addressed').length;
  const resolvedCount = artifact.comments.filter((c) => c.status === 'resolved').length;
  const orphanedCount = artifact.comments.filter((c) => c.status === 'orphaned').length;

  return Response.json({
    ok: true,
    artifact: artifact.meta,
    revision: artifact.revision.number,
    anchors: artifact.anchors ?? [],
    comments: {
      open: openCount,
      addressed: addressedCount,
      resolved: resolvedCount,
      orphaned: orphanedCount,
    },
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = (await req.json()) as Record<string, unknown>;

    // Restore takes precedence over other patches.
    if (body.restore === true) {
      const ok = await restoreArtifact(id);
      if (!ok) return Response.json({ ok: false, error: 'RK_ARTIFACT_NOT_FOUND' }, { status: 404 });
      return Response.json({ ok: true, artifact: await getArtifactMeta(id) });
    }

    const patch: { tags?: string[]; archived?: boolean } = {};
    if (Array.isArray(body.tags)) patch.tags = body.tags.map(String);
    if (typeof body.archived === 'boolean') patch.archived = body.archived;

    const ok = await updateArtifactMeta(id, patch);
    if (!ok) return Response.json({ ok: false, error: 'RK_ARTIFACT_NOT_FOUND' }, { status: 404 });

    const artifact = await getArtifactMeta(id);
    return Response.json({ ok: true, artifact });
  } catch (e: unknown) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

/**
 * DELETE = soft-delete by default (writes deleted_at).
 * DELETE ?purge=1 = permanent removal (hard delete + cascade).
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const url = new URL(req.url);
    const purge = url.searchParams.get('purge') === '1';
    const ok = purge ? await purgeArtifact(id) : await softDeleteArtifact(id);
    if (!ok) return Response.json({ ok: false, error: 'RK_ARTIFACT_NOT_FOUND' }, { status: 404 });
    return Response.json({ ok: true, artifactId: id, purged: purge });
  } catch (e: unknown) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
