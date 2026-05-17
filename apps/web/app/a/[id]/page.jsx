import { getArtifact } from '../../../lib/store.mjs';
import ArtifactView from './ArtifactView.jsx';

function blockText(block) {
  if (!block) return '';
  const props = block.props || {};
  if (block.type === 'paragraph') return props.text || '';
  if (block.type === 'summary') return props.content || props.title || '';
  if (block.type === 'callout') return [props.title, props.content].filter(Boolean).join(' — ');
  if (block.type === 'decision-card') return [props.question, props.chosen].filter(Boolean).join(' — ');
  if (block.type === 'quote') return [props.quote, props.attribution].filter(Boolean).join(' — ');
  return props.title || props.caption || '';
}

function artifactDescription(model) {
  const text = (model?.blocks || []).map(blockText).find(Boolean) || 'Rendered RenderKit artifact with reading-first review comments.';
  return text.replace(/\s+/g, ' ').slice(0, 180);
}

export async function generateMetadata({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const rev = sp?.rev ? Number(sp.rev) : null;
  const artifact = await getArtifact(id, rev);
  if (!artifact) return { title: 'Artifact not found' };

  const title = artifact.revision.model.title || artifact.meta.title || id;
  const description = artifactDescription(artifact.revision.model);
  const url = `/a/${id}${rev ? `?rev=${rev}` : ''}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url,
      images: [{ url: '/renderkit-og.svg', width: 1200, height: 630, alt: `${title} rendered in RenderKit` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/renderkit-og.svg'],
    },
  };
}

export default async function ArtifactPage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const rev = sp?.rev ? Number(sp.rev) : null;
  const artifact = await getArtifact(id, rev);
  if (!artifact) return <main className="rk-home"><h1>Not found</h1><p>{id}</p></main>;
  return <ArtifactView artifactId={id} revision={artifact.revision} comments={artifact.comments} />;
}
