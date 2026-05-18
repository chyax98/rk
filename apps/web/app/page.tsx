import type React from 'react';
import { listArtifacts } from '@/lib/store.ts';
import ArtifactActions from './ArtifactActions.tsx';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 2) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小时前`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(iso).toLocaleDateString('zh-CN');
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; archived?: string }>;
}): Promise<React.ReactElement> {
  const params = await searchParams;
  const showArchived = params.archived === '1';
  const selectedTag = params.tag ?? null;

  const allArtifacts = await listArtifacts(true);
  const activeArtifacts = allArtifacts.filter((a) => !a.archived);
  const archivedArtifacts = allArtifacts.filter((a) => a.archived);

  const filterByTag = (list: typeof allArtifacts) =>
    selectedTag ? list.filter((a) => a.tags.includes(selectedTag)) : list;

  const visibleArtifacts = showArchived
    ? filterByTag(archivedArtifacts)
    : filterByTag(activeArtifacts);

  const allTags = [...new Set(activeArtifacts.flatMap((a) => a.tags))].sort();
  const tagCounts = Object.fromEntries(
    allTags.map((t) => [t, activeArtifacts.filter((a) => a.tags.includes(t)).length]),
  );

  const totalRevisions = activeArtifacts.reduce((sum, a) => sum + a.currentRevision, 0);

  const baseHref = showArchived ? '/?archived=1' : '/';

  return (
    <div className="rk-studio">
      {/* Topbar */}
      <header className="rk-topbar">
        <a href="/" className="rk-topbar-logo">
          <span className="rk-logo-mark">RK</span>
          <span className="rk-logo-name">RenderKit</span>
        </a>
        <div className="rk-topbar-divider" />
        <span className="rk-topbar-tagline">Agent 文档渲染平台</span>
        <div className="rk-topbar-spacer" />
        <div className="rk-server-status">
          <span className="rk-status-dot" />
          <span>本地运行</span>
        </div>
      </header>

      {/* App shell */}
      <div className="rk-app-shell">
        {/* Sidebar */}
        <aside className="rk-sidebar">
          <div className="rk-sidebar-section">
            <a
              href="/"
              className={`rk-nav-item${!showArchived && !selectedTag ? ' is-active' : ''}`}
            >
              <span className="rk-nav-icon">
                {/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative icon */}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path
                    d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z"
                    fill="currentColor"
                    opacity="0.6"
                  />
                </svg>
              </span>
              <span className="rk-nav-label">全部文档</span>
              <span className="rk-nav-count">{activeArtifacts.length}</span>
            </a>
          </div>

          {allTags.length > 0 && (
            <div className="rk-sidebar-section">
              <div className="rk-sidebar-label">标签</div>
              {allTags.map((tag) => (
                <a
                  key={tag}
                  href={`/?tag=${encodeURIComponent(tag)}`}
                  className={`rk-tag-nav-item${selectedTag === tag && !showArchived ? ' is-active' : ''}`}
                >
                  <span className="rk-tag-dot" />
                  <span className="rk-tag-nav-name">#{tag}</span>
                  <span className="rk-tag-nav-count">{tagCounts[tag]}</span>
                </a>
              ))}
            </div>
          )}

          <div className="rk-sidebar-rule" />

          {archivedArtifacts.length > 0 && (
            <div className="rk-sidebar-section">
              <a href="/?archived=1" className={`rk-nav-item${showArchived ? ' is-active' : ''}`}>
                <span className="rk-nav-icon">⊟</span>
                <span className="rk-nav-label">存档</span>
                <span className="rk-nav-count">{archivedArtifacts.length}</span>
              </a>
            </div>
          )}

          <div className="rk-sidebar-footer">
            <code className="rk-sidebar-hint">rk push your-doc.html</code>
          </div>
        </aside>

        {/* Main */}
        <main className="rk-main">
          {/* Toolbar */}
          <div className="rk-main-toolbar">
            <div className="rk-stats-row">
              <div className="rk-stat-chip">
                <span className="rk-stat-num rk-stat-num--accent">{activeArtifacts.length}</span>
                <span className="rk-stat-label">活跃文档</span>
              </div>
              <div className="rk-stat-divider" />
              <div className="rk-stat-chip">
                <span className="rk-stat-num">{totalRevisions}</span>
                <span className="rk-stat-label">版本总计</span>
              </div>
              <div className="rk-stat-divider" />
              <div className="rk-stat-chip">
                <span className="rk-stat-num">{allTags.length}</span>
                <span className="rk-stat-label">标签</span>
              </div>
              {archivedArtifacts.length > 0 && (
                <>
                  <div className="rk-stat-divider" />
                  <div className="rk-stat-chip">
                    <span className="rk-stat-num rk-stat-num--muted">
                      {archivedArtifacts.length}
                    </span>
                    <span className="rk-stat-label">已存档</span>
                  </div>
                </>
              )}
            </div>

            {allTags.length > 0 && (
              <div className="rk-filter-row">
                <span className="rk-filter-label">筛选</span>
                <a href={baseHref} className={`rk-filter-chip${!selectedTag ? ' is-active' : ''}`}>
                  全部
                </a>
                {allTags.map((tag) => (
                  <a
                    key={tag}
                    href={`${showArchived ? '/?archived=1&' : '/?'}tag=${encodeURIComponent(tag)}`}
                    className={`rk-filter-chip${selectedTag === tag ? ' is-active' : ''}`}
                  >
                    <span className="rk-filter-chip-dot" />#{tag}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Grid */}
          <div className="rk-grid-container">
            {visibleArtifacts.length === 0 ? (
              <div className="rk-empty-state">
                <div className="rk-empty-icon">
                  {/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative icon */}
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
                    <path
                      d="M6 6h12v12H6zM22 6h12v12H22zM6 22h12v12H6zM22 22h12v12H22z"
                      fill="currentColor"
                      opacity="0.15"
                    />
                  </svg>
                </div>
                <h2 className="rk-empty-title">
                  {selectedTag
                    ? `没有 #${selectedTag} 文档`
                    : showArchived
                      ? '没有存档文档'
                      : '还没有文档'}
                </h2>
                <p className="rk-empty-desc">
                  {!selectedTag && !showArchived && '使用 CLI 推送第一个文档'}
                </p>
                {!selectedTag && !showArchived && (
                  <code className="rk-empty-code">rk push your-doc.html</code>
                )}
              </div>
            ) : (
              <div className="rk-card-grid">
                {visibleArtifacts.map((a, i) => (
                  <div
                    key={a.id}
                    className={`rk-card${i === 0 && !showArchived ? ' rk-card--hero' : ''}${a.archived ? ' rk-card--archived' : ''}`}
                  >
                    {/* biome-ignore lint/a11y/useAnchorContent: overlay link has aria-label */}
                    <a
                      href={`/a/${a.id}`}
                      className="rk-card-overlay"
                      aria-label={a.title || '打开文档'}
                    />

                    <div className="rk-card-id">{a.id.slice(0, 8)}</div>

                    <div className="rk-card-header">
                      <h3 className="rk-card-title">{a.title || '未命名文档'}</h3>
                      <div className="rk-card-actions">
                        <ArtifactActions artifactId={a.id} archived={a.archived} />
                      </div>
                    </div>

                    {a.tags.length > 0 && (
                      <div className="rk-card-tags">
                        {a.tags.map((t) => (
                          <span key={t} className="rk-card-tag">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="rk-card-footer">
                      <span className="rk-card-time">{relativeTime(a.updatedAt)}</span>
                      <div className="rk-card-footer-right">
                        {a.currentRevision > 1 && (
                          <a href={`/compare/${a.id}`} className="rk-card-compare">
                            v{a.currentRevision} 对比
                          </a>
                        )}
                        <span className="rk-card-rev-badge">v{a.currentRevision}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
