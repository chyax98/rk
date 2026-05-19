import { addComment, getComments } from '../../../../../lib/store.ts';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comments = await getComments(id);
  return Response.json({ ok: true, comments });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const anchor = typeof body.anchor === 'string' ? body.anchor.trim() : '';
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const parentId = typeof body.parentId === 'string' ? body.parentId.trim() : null;
    const author = body.author === 'agent' ? 'agent' : 'human';

    if (!parentId && !anchor) {
      return Response.json({ ok: false, error: 'anchor is required' }, { status: 400 });
    }
    if (!text) {
      return Response.json({ ok: false, error: 'text required' }, { status: 400 });
    }

    const result = await addComment(id, anchor, text, {
      selector: body.selector ?? null,
      parentId,
      author,
    });
    if (!result.ok) {
      return Response.json({ ok: false, error: result.error }, { status: result.status || 400 });
    }
    return Response.json({ ok: true, comment: result.comment });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'internal error';
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
