import { getFeedback } from '../../../../../lib/store.ts';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const feedback = await getFeedback(id);
  if (!feedback)
    return Response.json(
      { ok: false, error: { code: 'RK_ARTIFACT_NOT_FOUND', message: 'not found' } },
      { status: 404 },
    );
  return Response.json({ ok: true, ...feedback });
}
