'use client';

import Script from 'next/script';
import { useMemo, useState, useCallback } from 'react';
import type { HtmlArtifactBundle, Comment } from '../../../lib/store.ts';

export default function HtmlArtifactView({ artifact }: { artifact: HtmlArtifactBundle }) {
  const { meta, revision, anchors, comments } = artifact;

  // Active anchor for comment thread
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Build anchor -> comments map
  const commentsByAnchor = useMemo(() => {
    const map = new Map<string, Comment[]>();
    for (const c of comments) {
      const list = map.get(c.anchor) || [];
      list.push(c);
      map.set(c.anchor, list);
    }
    return map;
  }, [comments]);

  const activeComments = activeAnchor ? (commentsByAnchor.get(activeAnchor) || []) : [];

  const handleBubbleClick = useCallback((anchor: string) => {
    setActiveAnchor((prev) => (prev === anchor ? null : anchor));
  }, []);

  const handleSubmitComment = useCallback(async () => {
    if (!activeAnchor || !commentText.trim()) return;
    try {
      await fetch(`/api/artifacts/${meta.id}/comments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          anchor: activeAnchor,
          text: commentText.trim(),
        }),
      });
      setCommentText('');
      // Refresh page to show new comment
      window.location.reload();
    } catch {
      // Non-fatal
    }
  }, [activeAnchor, commentText, meta.id]);

  return (
    <div className="rk-page" data-rk-theme="paper-light">
      {/* Inject RenderKit CSS */}
      <link rel="stylesheet" href="/rk/theme.css" />
      <link rel="stylesheet" href="/rk/components.css" />

      <main id="rk-main" className="rk-artifact">
        <div
          className="rk-html-content" // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted server-processed HTML
          dangerouslySetInnerHTML={{ __html: revision.processedHtml || '' }}
        />

        {/* anchor bubble rail — only show meaningful anchors */}
        <div className="rk-block-rail">
          {anchors
            .filter((a) => a.elementTag.startsWith('rk-') || ['h1', 'h2', 'h3'].includes(a.elementTag))
            .map((a) => {
            const anchorComments = commentsByAnchor.get(a.anchor) || [];
            const count = anchorComments.length;
            const isActive = activeAnchor === a.anchor;
            return (
              <div
                key={a.id}
                className={`rk-bubble${count > 0 ? ' rk-bubble--active' : ''}${isActive ? ' rk-bubble--selected' : ''}`}
                data-anchor={a.anchor}
                title={a.textPreview || a.anchor}
                onClick={() => handleBubbleClick(a.anchor)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleBubbleClick(a.anchor); }}
                role="button"
                tabIndex={0}
              >
                {count > 0 ? count : '+'}
              </div>
            );
          })}
        </div>
      </main>

      {/* Comment thread for active anchor */}
      {activeAnchor && (
        <div className="rk-comment-thread">
          <div className="rk-comment-thread__header">
            <span className="rk-comment-thread__title">
              评论 · {anchors.find((a) => a.anchor === activeAnchor)?.textPreview || activeAnchor}
            </span>
            <button
              className="rk-comment-thread__close"
              onClick={() => setActiveAnchor(null)}
              aria-label="关闭"
            >
              ×
            </button>
          </div>

          <div className="rk-comment-thread__list">
            {activeComments.length === 0 && (
              <div className="rk-comment-thread__empty">暂无评论</div>
            )}
            {activeComments.map((c) => (
              <div key={c.id} className={`rk-comment-card rk-comment-card--${c.status}`}>
                <div className="rk-comment-card__text">{c.text}</div>
                {c.selector && (
                  <div className="rk-comment-card__quote">&ldquo;{c.selector.exact}&rdquo;</div>
                )}
                <div className="rk-comment-card__meta">
                  <span className="rk-comment-card__status">{c.status === 'open' ? '🟢 待处理' : c.status === 'resolved' ? '✅ 已解决' : '⚠️ 已失效'}</span>
                  <span className="rk-comment-card__time">{new Date(c.createdAt).toLocaleString('zh-CN')}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rk-comment-thread__input">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="写下评论…"
              rows={2}
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim()}
            >
              发送
            </button>
          </div>
        </div>
      )}

      {/* Inject RenderKit components JS */}
      <Script src="/rk/components.js" strategy="afterInteractive" />
    </div>
  );
}
