import { listArtifacts } from '../lib/store.mjs';

export default async function Home() {
  const artifacts = await listArtifacts();
  return <main className="rk-home">
    <h1>RenderKit</h1>
    <p className="rk-muted">Local Agent artifact renderer</p>
    {artifacts.length === 0 ? <p className="rk-muted">No artifacts yet. Push a .rk.md file to get started.</p> : (
      <ul>{artifacts.map(a => <li key={a.id}><a href={`/a/${a.id}`}>{a.title || a.id}</a> <span className="rk-muted">rev {a.currentRevision}</span></li>)}</ul>
    )}
  </main>;
}
