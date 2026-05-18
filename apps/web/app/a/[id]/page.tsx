import { getHtmlArtifact } from '../../../lib/store.ts';
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

export default async function ArtifactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artifact = await getHtmlArtifact(id);

  if (!artifact?.revision.processedHtml) {
    return (
      <main style={{ padding: '3rem', fontFamily: 'system-ui, sans-serif' }}>
        <h1>Artifact not found</h1>
        <p style={{ color: '#666' }}>{id}</p>
      </main>
    );
  }

  return <HtmlArtifactView artifact={artifact} />;
}
