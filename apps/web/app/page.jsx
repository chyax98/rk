import { listArtifacts } from '../lib/store.mjs';

export default async function Home() {
  const artifacts = await listArtifacts();
  return <main className="home">
    <h1>RenderKit</h1>
    <p>本地 Agent artifact renderer。</p>
    <section className="card">
      <h2>Artifacts</h2>
      {artifacts.length === 0 ? <p className="muted">暂无 artifact。使用 <code>renderkit push examples/plan.rk.md</code> 创建。</p> :
        <ul>{artifacts.map(a => <li key={a.id}><a href={`/a/${a.id}`}>{a.title || a.id}</a> <span className="muted">rev {a.currentRevision}</span></li>)}</ul>}
    </section>
  </main>;
}
