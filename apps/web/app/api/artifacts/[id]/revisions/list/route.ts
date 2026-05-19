import { listRevisions } from '../../../../../../lib/store.ts';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const revisions = await listRevisions(id);
    return Response.json({ ok: true, revisions });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'internal error';
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
