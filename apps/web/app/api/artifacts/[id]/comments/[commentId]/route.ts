import { updateCommentStatus, updateCommentText } from '../../../../../../lib/store.ts';

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
    if (body.status) {
      const result = await updateCommentStatus(id, commentId, body.status);
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
