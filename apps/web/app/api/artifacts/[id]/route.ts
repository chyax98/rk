import { COMMENT_STATUSES } from '@renderkit/shared/contracts';
import { deleteArtifact, getArtifact } from '../../../../lib/store';

const [COMMENT_OPEN, COMMENT_RESOLVED, COMMENT_ORPHANED] = COMMENT_STATUSES;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artifact = await getArtifact(id);
  if (!artifact || !artifact.revision)
    return Response.json(
      { ok: false, error: { code: 'RK_ARTIFACT_NOT_FOUND', message: 'not found' } },
      { status: 404 },
    );
  return Response.json({
    ok: true,
    artifact: artifact.meta,
    revision: artifact.revision.number,
    comments: {
      open: artifact.comments.filter((c: any) => c.status === COMMENT_OPEN).length,
      resolved: artifact.comments.filter((c: any) => c.status === COMMENT_RESOLVED).length,
      orphaned: artifact.comments.filter((c: any) => c.status === COMMENT_ORPHANED).length,
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
  } catch (e: any) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
