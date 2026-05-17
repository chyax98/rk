'use client';

import Script from 'next/script';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Comment, HtmlArtifactBundle } from '../../../lib/store.ts';

export default function HtmlArtifactView({ artifact }: { artifact: HtmlArtifactBundle }) {
  const { meta, revision, anchors, comments } = artifact;

  const bodyRef = useRef<HTMLDivElement>(null);
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(comments);
  const [bubblePositions, setBubblePositions] = useState<Record<string, number>>({});

  // Only show meaningful anchors (rk-* components and h1/h2/h3)
  const visibleAnchors = useMemo(
    () =>
      anchors.filter(
        (a) => a.elementTag.startsWith('rk-') || ['h1', 'h2', 'h3'].includes(a.elementTag),
      ),
    [anchors],
  );

  const commentsByAnchor = useMemo(() => {
    const map = new Map<string, Comment[]>();
    for (const c of localComments) {
      if (c.status === 'open') {
        const key = c.anchor;
        if (!key) continue;
        const list = map.get(key) ?? [];
        list.push(c);
        map.set(key, list);
      }
    }
    return map;
  }, [localComments]);

  // Calculate Y position for each anchor's bubble
  const updatePositions = useCallback(() => {
    if (!bodyRef.current) return;
    const pos: Record<string, number> = {};
    for (const a of visibleAnchors) {
      const el = bodyRef.current.querySelector(`[data-rk-anchor="${a.anchor}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        pos[a.anchor] = rect.top + window.scrollY;
      }
    }
    setBubblePositions(pos);
  }, [visibleAnchors]);

  useEffect(() => {
    // Wait for WC rendering before initial positioning
    const t = setTimeout(updatePositions, 600);
    window.addEventListener('scroll', updatePositions, { passive: true });
    window.addEventListener('resize', updatePositions);
    return () => {
      clearTimeout(t);
      window.removeEventListener('scroll', updatePositions);
      window.removeEventListener('resize', updatePositions);
    };
  }, [updatePositions]);

  const submitComment = useCallback(async () => {
    if (!activeAnchor || !commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/artifacts/${meta.id}/comments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ anchor: activeAnchor, text: commentText.trim() }),
      });
      const data = await res.json();
      if (data.ok && data.comment) {
        setLocalComments((prev) => [...prev, data.comment]);
        setCommentText('');
      }
    } finally {
      setSubmitting(false);
    }
  }, [activeAnchor, commentText, meta.id]);

  const activeComments = activeAnchor ? (commentsByAnchor.get(activeAnchor) ?? []) : [];
  const activeAnchorLabel =
    visibleAnchors.find((a) => a.anchor === activeAnchor)?.textPreview?.slice(0, 40) ||
    activeAnchor;

  return (
    <div className="rk-page" data-rk-theme="paper-light">
      <link rel="stylesheet" href="/rk/theme.css" />
      <link rel="stylesheet" href="/rk/components.css" />

      <div className="rk-html-layout">
        {/* Main document body */}
        <div ref={bodyRef} className="rk-html-body">
          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: server-processed HTML */}
          <div dangerouslySetInnerHTML={{ __html: revision.processedHtml || '' }} />
        </div>

        {/* Bubble rail — absolutely positioned to track element Y */}
        <div className="rk-comment-rail">
          {visibleAnchors.map((a) => {
            const count = commentsByAnchor.get(a.anchor)?.length ?? 0;
            const isActive = activeAnchor === a.anchor;
            const top = bubblePositions[a.anchor];
            return (
              <button
                key={a.id}
                type="button"
                className={`rk-rail-dot${count > 0 ? ' has-comments' : ''}${isActive ? ' is-active' : ''}`}
                style={
                  top !== undefined
                    ? { position: 'absolute', top: `${top}px`, transform: 'translateY(-50%)' }
                    : {}
                }
                title={a.textPreview ?? a.anchor}
                onClick={() => setActiveAnchor(isActive ? null : a.anchor)}
              >
                {count > 0 ? String(count) : '+'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comment panel — fixed right drawer */}
      {activeAnchor && (
        <div className="rk-comment-panel">
          <div className="rk-comment-panel__header">
            <span className="rk-comment-panel__anchor" title={activeAnchor}>
              {activeAnchorLabel}
            </span>
            <button
              type="button"
              className="rk-comment-panel__close"
              onClick={() => {
                setActiveAnchor(null);
                setCommentText('');
              }}
            >
              ✕
            </button>
          </div>
          <div className="rk-comment-panel__list">
            {activeComments.length === 0 && (
              <p className="rk-comment-panel__empty">暂无评论，在下方写下第一条</p>
            )}
            {activeComments.map((c) => (
              <div key={c.id} className="rk-comment-card-inpanel">
                {c.selector?.exact && (
                  <blockquote className="rk-comment-card__quote">
                    &ldquo;{c.selector.exact}&rdquo;
                  </blockquote>
                )}
                <p className="rk-comment-card__text">{c.text}</p>
                <span className="rk-comment-card__time">
                  {new Date(c.createdAt).toLocaleString('zh-CN')}
                </span>
              </div>
            ))}
          </div>
          <div className="rk-comment-panel__input">
            <textarea
              className="rk-comment-panel__textarea"
              placeholder="写下评论… (Cmd+Enter 提交)"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submitComment();
              }}
              rows={3}
            />
            <button
              type="button"
              className="rk-comment-panel__submit"
              onClick={submitComment}
              disabled={submitting || !commentText.trim()}
            >
              {submitting ? '…' : '发送'}
            </button>
          </div>
        </div>
      )}

      <Script src="/rk/components.js" strategy="afterInteractive" />
    </div>
  );
}
