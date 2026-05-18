import { listArtifacts, pushHTML } from '../../../lib/store.ts';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, string>;
    const html = body.html || body.source || '';
    const file = body.file || body.title;
    const result = await pushHTML(html, file);
    return Response.json({
      ok: true,
      artifactId: result.artifactId,
      revision: result.revision,
      url: absolute(req, result.url),
      format: 'html',
      // Surface diagram render failures so CLI/agents can act on them
      warnings: result.warnings.length > 0 ? result.warnings : undefined,
    });
  } catch (e: unknown) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function GET(req?: Request) {
  try {
    const includeArchived = req ? new URL(req.url).searchParams.get('archived') === '1' : false;
    const artifacts = await listArtifacts(includeArchived);
    return Response.json({ ok: true, artifacts });
  } catch (e: unknown) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

function absolute(req: Request, path: string) {
  return new URL(path, req.url).toString();
}
