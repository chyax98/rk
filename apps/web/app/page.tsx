import type React from 'react';
import { listArtifacts } from '../lib/store';

interface ArtifactSummary {
  id: string;
  title?: string;
  currentRevision: number;
}

export default async function Home(): Promise<React.ReactElement> {
  const artifacts: ArtifactSummary[] = await listArtifacts();
  return (
    <main className="rk-home">
      <h1>RenderKit</h1>
      <p className="rk-muted">Local Agent artifact renderer</p>
      {artifacts.length === 0 ? (
        <p className="rk-muted">尚无 artifact。推送 .rk.md 文件开始使用。</p>
      ) : (
        <ul>
          {artifacts.map((a: ArtifactSummary) => (
            <li key={a.id}>
              <a href={`/a/${a.id}`}>{a.title || a.id}</a>
              <span className="rk-muted"> rev {a.currentRevision}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
