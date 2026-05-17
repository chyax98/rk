import { deleteArtifact, getArtifact } from '../../../../lib/store';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artifact = await getArtifact(id);
  if (!artifact?.revision.processedHtml)
    return Response.json(
      { ok: false, error: { code: 'RK_ARTIFACT_NOT_FOUND', message: 'not found' } },
      { status: 404 },
    );

  const openCount = artifact.comments.filter((c) => c.status === 'open').length;
  const resolvedCount = artifact.comments.filter((c) => c.status === 'resolved').length;
  const orphanedCount = artifact.comments.filter((c) => c.status === 'orphaned').length;

  return Response.json({
    ok: true,
    artifact: artifact.meta,
    revision: artifact.revision.number,
    comments: {
      open: openCount,
      resolved: resolvedCount,
      orphaned: orphanedCount,
    },
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const deleted = await deleteArtifact(id);
    if (!deleted)
      return Response.json({ ok: false, error: 'RK_ARTIFACT_NOT_FOUND' }, { status: 404 });
    return Response.json({ ok: true, artifactId: id });
  } catch (e: unknown) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
