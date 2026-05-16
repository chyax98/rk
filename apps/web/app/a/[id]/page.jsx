import { getArtifact } from '../../../lib/store.mjs';
import ArtifactView from './ArtifactView.jsx';

export default async function ArtifactPage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const rev = sp?.rev ? Number(sp.rev) : null;
  const artifact = await getArtifact(id, rev);
  if (!artifact) return <main className="home"><h1>Not found</h1><p>{id}</p></main>;
  return <ArtifactView artifactId={id} revision={artifact.revision} comments={artifact.comments} />;
}
