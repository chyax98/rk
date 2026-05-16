import { getFeedback } from '../../../../../lib/store.mjs';

export async function GET(_req, { params }) {
  const { id } = await params;
  const feedback = await getFeedback(id);
  if (!feedback) return Response.json({ ok: false, error: { code: 'RK_ARTIFACT_NOT_FOUND', message: 'not found' } }, { status: 404 });
  return Response.json({ ok: true, ...feedback });
}
