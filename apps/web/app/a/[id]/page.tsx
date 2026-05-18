import { diffAnchors } from '@/lib/anchor-diff.ts';
import { getHtmlArtifact, getRevision, listRevisions } from '@/lib/store.ts';
import HtmlArtifactView from './HtmlArtifactView.tsx';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artifact = await getHtmlArtifact(id);
  const title = artifact?.meta.title || 'RenderKit';

  return {
    title,
    description: `RenderKit artifact: ${title}`,
    openGraph: {
      title,
      description: `RenderKit artifact: ${title}`,
      type: 'article',
      url: `/a/${id}`,
      images: [
        {
          url: '/renderkit-og.svg',
          width: 1200,
          height: 630,
          alt: `${title} rendered in RenderKit`,
        },
      ],
    },
  };
}

function parseCompare(raw: string | null): [number, number] | null {
  if (!raw) return null;
  const m = raw.match(/^(\d+)[,.](\d+)$/) || raw.match(/^(\d+)\s*\.\.\s*(\d+)$/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a < 1 || b < 1) return null;
  return [a, b];
}

export default async function ArtifactPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ rev?: string; compare?: string; panel?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const artifact = await getHtmlArtifact(id);

  if (!artifact?.revision.processedHtml) {
    return (
      <main className="rk-deleted-state">
        <h1>文档不存在</h1>
        <p className="rk-deleted-id">{id}</p>
        <a href="/" className="rk-deleted-back">← 返回列表</a>
      </main>
    );
  }

  if (artifact.meta.deletedAt) {
    return (
      <main className="rk-deleted-state">
        <h1>此文档已删除</h1>
        <p className="rk-deleted-id">{id}</p>
        <p className="rk-deleted-time">删除于 {new Date(artifact.meta.deletedAt).toLocaleString('zh-CN')}</p>
        <form
          action={`/api/artifacts/${id}`}
          method="POST"
          // biome-ignore lint/correctness/useUniqueElementIds: redirect-only form
        >
          <input type="hidden" name="_method" value="PATCH" />
          <a
            href="/"
            className="rk-deleted-back"
          >
            ← 返回列表
          </a>
          {' · '}
          <a
            href={`/api/artifacts/${id}`}
            className="rk-deleted-restore"
            onClick={undefined}
          >
            点此恢复（API）
          </a>
        </form>
      </main>
    );
  }

  const revisions = await listRevisions(id);
  const currentRev = artifact.meta.currentRevision;

  // Resolve view mode: compare > rev > current
  const compare = parseCompare(sp.compare ?? null);
  const requestedRev = sp.rev ? Number(sp.rev) : currentRev;
  const viewingRev = compare ? compare[1] : Number.isFinite(requestedRev) ? requestedRev : currentRev;

  // Fetch the displayed revision if it's not the current one
  let displayedHtml: string = artifact.revision.processedHtml;
  if (viewingRev !== currentRev) {
    const r = await getRevision(id, viewingRev);
    if (r.processedHtml) displayedHtml = r.processedHtml;
  }

  // Compare mode: also fetch the "left" revision
  let compareLeftHtml: string | null = null;
  let compareLeftAnchors: string[] | null = null;
  let compareRightAnchors: string[] | null = null;
  let anchorDiff: { added: string[]; removed: string[]; kept: string[] } | null = null;

  if (compare) {
    const [leftRev, rightRev] = compare;
    const leftPromise = leftRev === currentRev
      ? Promise.resolve({ processedHtml: artifact.revision.processedHtml })
      : getRevision(id, leftRev);
    const left = await leftPromise;
    compareLeftHtml = left.processedHtml ?? '';

    // Extract anchors from raw HTML (cheap regex scan; processed HTML has data-rk-anchor attrs)
    const extractAnchors = (html: string): string[] => {
      const out: string[] = [];
      const re = /data-rk-anchor="([^"]+)"/g;
      let m: RegExpExecArray | null;
      // eslint-disable-next-line no-cond-assign
      while ((m = re.exec(html)) !== null) out.push(m[1]);
      return out;
    };
    compareLeftAnchors = extractAnchors(compareLeftHtml || '');
    compareRightAnchors = extractAnchors(displayedHtml);
    anchorDiff = diffAnchors(compareLeftAnchors, compareRightAnchors);
  }

  const panelOpen = sp.panel !== 'closed';

  return (
    <HtmlArtifactView
      artifact={artifact}
      displayedHtml={displayedHtml}
      viewingRev={viewingRev}
      revisions={revisions}
      compare={
        compare
          ? {
              leftRev: compare[0],
              rightRev: compare[1],
              leftHtml: compareLeftHtml ?? '',
              rightHtml: displayedHtml,
              anchorDiff: anchorDiff ?? { added: [], removed: [], kept: [] },
            }
          : null
      }
      initialPanelOpen={panelOpen}
    />
  );
}
