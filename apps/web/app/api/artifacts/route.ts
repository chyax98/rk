import {
  type ArtifactSort,
  type ArtifactView,
  getArtifactViewCounts,
  listArtifacts,
  pushHTML,
} from '../../../lib/store.ts';

const VIEWS: ArtifactView[] = ['active', 'archived', 'test', 'deleted', 'all'];
const SORTS: ArtifactSort[] = ['updated', 'title'];

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const html = (body.html as string) || (body.source as string) || '';
    const file = (body.file as string) || (body.title as string);
    const isTest = body.isTest === true ? true : body.isTest === false ? false : undefined;
    const author = body.author === 'agent' ? 'agent' : body.author === 'human' ? 'human' : undefined;
    const result = await pushHTML(html, file, { isTest, author });
    return Response.json({
      ok: true,
      artifactId: result.artifactId,
      revision: result.revision,
      url: absolute(req, result.url),
      format: 'html',
      warnings: result.warnings.length > 0 ? result.warnings : undefined,
    });
  } catch (e: unknown) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const rawView = url.searchParams.get('view') ?? 'active';
    const rawSort = url.searchParams.get('sort') ?? 'updated';
    const view: ArtifactView = (VIEWS as string[]).includes(rawView)
      ? (rawView as ArtifactView)
      : 'active';
    const sort: ArtifactSort = (SORTS as string[]).includes(rawSort)
      ? (rawSort as ArtifactSort)
      : 'updated';
    const q = url.searchParams.get('q') ?? undefined;
    const tag = url.searchParams.get('tag') ?? undefined;

    const [artifacts, counts] = await Promise.all([
      listArtifacts({ view, sort, q: q ?? undefined, tag: tag ?? undefined }),
      getArtifactViewCounts(),
    ]);
    return Response.json({ ok: true, artifacts, counts, view, sort });
  } catch (e: unknown) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

function absolute(req: Request, path: string) {
  return new URL(path, req.url).toString();
}
