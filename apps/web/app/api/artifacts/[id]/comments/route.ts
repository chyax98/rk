import { addComment } from '../../../../../lib/store.ts';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json() as Record<string, unknown>;
    const anchor = typeof body.anchor === 'string' ? body.anchor.trim() : '';
    const text = typeof body.text === 'string' ? body.text.trim() : '';

    if (!anchor) {
      return Response.json({ ok: false, error: 'anchor is required' }, { status: 400 });
    }
    if (!text) {
      return Response.json({ ok: false, error: 'text required' }, { status: 400 });
    }

    const result = await addComment(id, anchor, text, body.selector || null);
    if (!result.ok) {
      return Response.json({ ok: false, error: result.error }, { status: result.status || 400 });
    }
    return Response.json({ ok: true, comment: result.comment });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'internal error';
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
