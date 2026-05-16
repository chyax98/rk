import { addRevision } from '../../../../../lib/store.mjs';

export async function POST(req, { params }) {
  const { id } = await params;
  const body = await req.json();
  const result = await addRevision(id, body.source || '', body.resolvedCommentIds || []);
  if (!result.ok) return Response.json({ ok: false, errors: result.errors, warnings: result.warnings }, { status: result.status || 400 });
  return Response.json({ ok: true, artifactId: id, revision: result.revision, path: `/a/${id}?rev=${result.revision}`, url: new URL(`/a/${id}?rev=${result.revision}`, req.url).toString(), diff: result.diff, resolved: result.resolved, warnings: result.warnings });
}
