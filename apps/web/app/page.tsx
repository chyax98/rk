import type React from 'react';
import { listArtifacts } from '../lib/store.ts';

export default async function Home(): Promise<React.ReactElement> {
  const artifacts = await listArtifacts();

  return (
    <main className="rk-home">
      <div className="rk-home__header">
        <div className="rk-home__logo">
          <span className="rk-home__logo-mark">RK</span>
          <div>
            <h1 className="rk-home__title">RenderKit</h1>
            <p className="rk-home__subtitle">Agent 文档渲染 · 评论协作 · 持续迭代</p>
          </div>
        </div>
        <div className="rk-home__stats">
          <div className="rk-stat-pill">
            <span className="rk-stat-pill__value">{artifacts.length}</span>
            <span className="rk-stat-pill__label">文档</span>
          </div>
        </div>
      </div>

      {artifacts.length === 0 ? (
        <div className="rk-home__empty">
          <div className="rk-home__empty-icon">📄</div>
          <h2>还没有文档</h2>
          <p>使用 RenderKit CLI 推送第一个文档：</p>
          <pre className="rk-home__code">rk push your-doc.html</pre>
        </div>
      ) : (
        <div className="rk-artifact-grid">
          {artifacts.map((a) => (
            <a key={a.id} href={`/a/${a.id}`} className="rk-artifact-card">
              <div className="rk-artifact-card__header">
                <h3 className="rk-artifact-card__title">{a.title || '未命名文档'}</h3>
                <span className="rk-artifact-card__rev">v{a.currentRevision}</span>
              </div>
              <div className="rk-artifact-card__meta">
                <span className="rk-artifact-card__id">{a.id.slice(0, 8)}…</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
