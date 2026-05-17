import { createArtifact, pushHTML } from '../../../lib/store';

export async function POST(req: Request) {
  const body = await req.json();

  // HTML format path
  if (body.format === 'html' && body.html) {
    try {
      const result = await pushHTML(body.html, body.title || body.file);
      return Response.json({
        ok: true,
        artifactId: result.artifactId,
        revision: result.revision,
        path: result.url,
        url: absolute(req, result.url),
      });
    } catch (e: any) {
      return Response.json(
        {
          ok: false,
          errors: [{ code: 'RK_HTML_PROCESS_ERROR', message: String(e?.message || e) }],
        },
        { status: 500 },
      );
    }
  }

  // Existing rkmd path
  const result = await createArtifact(body.source || '', body.title);
  if (!result.ok)
    return Response.json(
      { ok: false, errors: result.errors, warnings: result.warnings },
      { status: 400 },
    );
  return Response.json({
    ok: true,
    artifactId: result.artifact.id,
    revision: result.revision,
    path: `/a/${result.artifact.id}`,
    url: absolute(req, `/a/${result.artifact.id}`),
    warnings: result.warnings,
  });
}

function absolute(req: Request, path: string) {
  return new URL(path, req.url).toString();
}
