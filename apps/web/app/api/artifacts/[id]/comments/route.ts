import { addComment } from '../../../../../lib/store';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const result = await addComment(id, body.blockId, body.text || '', body.selector || null);
  if (!result.ok) return Response.json({ ok: false, error: result.error }, { status: result.status || 400 });
  return Response.json({ ok: true, comment: result.comment });
}
