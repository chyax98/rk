import { getRevision } from '../../../../../../lib/store.ts';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; rev: string }> },
) {
  const { id, rev } = await params;
  const revNum = Number.parseInt(rev, 10);
  if (Number.isNaN(revNum)) {
    return Response.json({ ok: false, error: 'invalid revision' }, { status: 400 });
  }

  const result = await getRevision(id, revNum);
  if (!result.processedHtml) {
    return Response.json({ ok: false, error: 'not found' }, { status: 404 });
  }

  return Response.json({ ok: true, processedHtml: result.processedHtml });
}
