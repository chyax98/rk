'use client';

import Script from 'next/script';
import { useMemo } from 'react';

export interface HtmlAnchor {
  id: string;
  anchor: string;
  elementTag: string;
  position: number;
  textPreview: string | null;
}

export interface HtmlComment {
  id: string;
  blockId: string;
  text: string;
  status: string;
  createdAt: string;
}

interface HtmlArtifactViewProps {
  artifactId: string;
  processedHtml: string;
  anchors: HtmlAnchor[];
  comments: HtmlComment[];
}

export default function HtmlArtifactView({
  processedHtml,
  anchors,
  comments,
}: HtmlArtifactViewProps) {
  // Build anchor -> comment count map
  const commentCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of comments) {
      map.set(c.blockId, (map.get(c.blockId) || 0) + 1);
    }
    return map;
  }, [comments]);

  return (
    <div className="rk-page" data-rk-theme="paper-light">
      {/* Inject RenderKit CSS */}
      <link rel="stylesheet" href="/rk/theme.css" />
      <link rel="stylesheet" href="/rk/components.css" />

      <main id="rk-main" className="rk-artifact">
        <div
          className="rk-html-content" // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted server-processed HTML
          dangerouslySetInnerHTML={{ __html: processedHtml }}
        />
        {/* anchor 气泡 rail */}
        <div className="rk-block-rail">
          {anchors.map((a) => {
            const count = commentCounts.get(a.anchor) || 0;
            return (
              <div
                key={a.id}
                className={`rk-bubble${count > 0 ? ' rk-bubble--active' : ''}`}
                data-anchor={a.anchor}
                title={a.textPreview || a.anchor}
              >
                {count > 0 ? count : '+'}
              </div>
            );
          })}
        </div>
      </main>

      {/* Inject RenderKit components JS */}
      <Script src="/rk/components.js" strategy="afterInteractive" />
    </div>
  );
}
