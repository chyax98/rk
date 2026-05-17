import { pushHTML } from '../../../../lib/store';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const html = body.html || body.source || '';
    const file = body.title || body.file;
    const result = await pushHTML(html, file);
    return Response.json({
      ok: true,
      artifactId: result.artifactId,
      revision: result.revision,
      path: result.url,
      url: absolute(req, result.url),
    });
  } catch (e: unknown) {
    return Response.json(
      { ok: false, error: { code: 'RK_HTML_PROCESS_ERROR', message: String(e) } },
      { status: 500 },
    );
  }
}

export async function GET() {
  const { listArtifacts } = await import('../../../../lib/store.ts');
  const artifacts = await listArtifacts();
  return Response.json({ ok: true, artifacts });
}

function absolute(req: Request, path: string) {
  return new URL(path, req.url).toString();
}
