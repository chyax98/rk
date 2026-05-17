import { updateCommentStatus } from '../../../../../../lib/store';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const { id, commentId } = await params;
  const body = await req.json();
  const result = await updateCommentStatus(id, commentId, body.status || 'open');
  if (!result.ok) return Response.json({ ok: false, error: result.error }, { status: result.status || 400 });
  return Response.json({ ok: true, comment: result.comment });
}
