import { addComment } from '../../../../../lib/store.ts';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    if (!body.anchor && !body.blockId) {
      return Response.json({ ok: false, error: 'blockId (anchor) is required' }, { status: 400 });
    }
    if (!body.text?.trim()) {
      return Response.json({ ok: false, error: 'text required' }, { status: 400 });
    }
    const result = await addComment(id, body.anchor || body.blockId, body.text, body.selector || null);
    if (!result.ok)
      return Response.json({ ok: false, error: result.error }, { status: result.status || 400 });
    return Response.json({ ok: true, comment: result.comment });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'internal error';
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
