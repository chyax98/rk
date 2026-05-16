import { COMMENT_STATUSES } from '@renderkit/shared/contracts';
import { getArtifact } from '../../../../lib/store.mjs';

const [COMMENT_OPEN, COMMENT_RESOLVED, COMMENT_ORPHANED] = COMMENT_STATUSES;

export async function GET(_req, { params }) {
  const { id } = await params;
  const artifact = await getArtifact(id);
  if (!artifact) return Response.json({ ok: false, error: { code: 'RK_ARTIFACT_NOT_FOUND', message: 'not found' } }, { status: 404 });
  return Response.json({ ok: true, artifact: artifact.meta, revision: artifact.revision.number, comments: { open: artifact.comments.filter(c => c.status === COMMENT_OPEN).length, resolved: artifact.comments.filter(c => c.status === COMMENT_RESOLVED).length, orphaned: artifact.comments.filter(c => c.status === COMMENT_ORPHANED).length } });
}
