import {
  COMMENT_ADDRESSED,
  COMMENT_OPEN,
  COMMENT_RESOLVED,
  type CommentStatus,
  updateCommentStatus,
  updateCommentText,
} from '../../../../../../lib/store.ts';

const ALLOWED_STATUSES: CommentStatus[] = [COMMENT_OPEN, COMMENT_ADDRESSED, COMMENT_RESOLVED];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const { id, commentId } = await params;
  try {
    const body = await req.json();
    if (typeof body.text === 'string') {
      if (!body.text.trim()) {
        return Response.json({ ok: false, error: 'text required' }, { status: 400 });
      }
      const result = await updateCommentText(id, commentId, body.text);
      if (!result.ok)
        return Response.json({ ok: false, error: result.error }, { status: result.status || 400 });
      return Response.json({ ok: true, comment: result.comment });
    }
    if (body.status && (ALLOWED_STATUSES as string[]).includes(body.status)) {
      const actor = body.actor === 'agent' ? 'agent' : 'human';
      const result = await updateCommentStatus(
        id,
        commentId,
        body.status as CommentStatus,
        actor,
      );
      if (!result.ok)
        return Response.json({ ok: false, error: result.error }, { status: result.status || 400 });
      return Response.json({ ok: true, comment: result.comment });
    }
    return Response.json({ ok: false, error: 'provide text or status' }, { status: 400 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'internal error';
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
