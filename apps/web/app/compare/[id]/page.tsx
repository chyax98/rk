import type { Metadata } from 'next';
import Script from 'next/script';
import { getArtifactMeta, getRevision, listRevisions } from '@/lib/store.ts';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const meta = await getArtifactMeta(id);
  return { title: `对比 · ${meta?.title || id}` };
}

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const meta = await getArtifactMeta(id);
  if (!meta) {
    return (
      <main className="rk-compare">
        <div className="rk-compare__empty">Artifact not found</div>
      </main>
    );
  }

  const revA = sp.a ? Number(sp.a) : Math.max(1, meta.currentRevision - 1);
  const revB = sp.b ? Number(sp.b) : meta.currentRevision;

  const [htmlA, htmlB, revisions] = await Promise.all([
    getRevision(id, revA),
    getRevision(id, revB),
    listRevisions(id),
  ]);

  return (
    <main className="rk-compare">
      <link rel="stylesheet" href="/rk/theme.css" />
      <link rel="stylesheet" href="/rk/components.css" />
      <header className="rk-compare__header">
        <div className="rk-compare__title">
          <a href={`/a/${id}`} className="rk-compare__back">
            ← {meta.title || '未命名文档'}
          </a>
          <span className="rk-compare__revs">
            v{revA} vs v{revB}
          </span>
        </div>
        <div className="rk-compare__controls">
          <label className="rk-compare__label">
            左
            <select className="rk-compare__select" data-compare-side="a" defaultValue={revA}>
              {revisions.map((r) => (
                <option key={r.revisionNumber} value={r.revisionNumber}>
                  v{r.revisionNumber}
                </option>
              ))}
            </select>
          </label>
          <label className="rk-compare__label">
            右
            <select className="rk-compare__select" data-compare-side="b" defaultValue={revB}>
              {revisions.map((r) => (
                <option key={r.revisionNumber} value={r.revisionNumber}>
                  v{r.revisionNumber}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <div className="rk-compare__split">
        <div className="rk-compare__pane">
          <div className="rk-compare__pane-header">v{revA}</div>
          <div
            className="rk-compare__content"
            /* biome-ignore lint/security/noDangerouslySetInnerHtml: server-processed HTML */
            dangerouslySetInnerHTML={{ __html: htmlA.processedHtml || '' }}
          />
        </div>
        <div className="rk-compare__pane">
          <div className="rk-compare__pane-header">v{revB}</div>
          <div
            className="rk-compare__content"
            /* biome-ignore lint/security/noDangerouslySetInnerHtml: server-processed HTML */
            dangerouslySetInnerHTML={{ __html: htmlB.processedHtml || '' }}
          />
        </div>
      </div>
      <script
        /* biome-ignore lint/security/noDangerouslySetInnerHtml: inline nav script */
        dangerouslySetInnerHTML={{
          __html: `(function(){var s=document.querySelectorAll('.rk-compare__select');s.forEach(function(e){e.addEventListener('change',function(){var a=document.querySelector('[data-compare-side="a"]');var b=document.querySelector('[data-compare-side="b"]');var u=new URL(location.href);u.searchParams.set('a',a.value);u.searchParams.set('b',b.value);location.href=u.toString()})})})();`,
        }}
      />
      <Script src="/rk/components.js" strategy="afterInteractive" />
    </main>
  );
}
