import { createArtifact } from '../../../lib/store';

export async function POST(req: Request) {
  const body = await req.json();
  const result = await createArtifact(body.source || '', body.title);
  if (!result.ok) return Response.json({ ok: false, errors: result.errors, warnings: result.warnings }, { status: 400 });
  return Response.json({ ok: true, artifactId: result.artifact.id, revision: result.revision, path: `/a/${result.artifact.id}`, url: absolute(req, `/a/${result.artifact.id}`), warnings: result.warnings });
}

function absolute(req: Request, path: string) { return new URL(path, req.url).toString(); }
