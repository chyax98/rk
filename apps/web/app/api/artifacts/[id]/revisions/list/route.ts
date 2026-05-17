import { listRevisions } from '../../../../../../lib/store.ts';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const revisions = await listRevisions(id);
  return Response.json({ ok: true, revisions });
}
