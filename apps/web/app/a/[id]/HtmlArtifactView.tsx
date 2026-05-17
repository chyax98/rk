'use client';

import Script from 'next/script';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Comment, HtmlArtifactBundle } from '../../../lib/store.ts';

interface Anchor {
  id: string;
  anchor: string;
  elementTag: string;
  position: number;
  textPreview: string | null;
}

interface AddingState {
  anchor: string;
  text: string;
}

export default function HtmlArtifactView({ artifact }: { artifact: HtmlArtifactBundle }) {
  const { meta, revision, anchors, comments } = artifact;

  const bodyRef = useRef<HTMLDivElement>(null);
  const [panelOpen, setPanelOpen] = useState(false); // default: closed, full-width doc
  const [localComments, setLocalComments] = useState<Comment[]>(
    comments.map((c) => ({ ...c, anchor: (c as any).blockId || c.anchor || '' })),
  );
  const [activeComment, setActiveComment] = useState<string | null>(null);
  const [adding, setAdding] = useState<AddingState | null>(null); // which anchor is being commented
  const [submitting, setSubmitting] = useState(false);
  const [hoveredAnchor, setHoveredAnchor] = useState<string | null>(null);

  // Only meaningful anchors
  const visibleAnchors = useMemo(
    () =>
      anchors.filter(
        (a) => a.elementTag.startsWith('rk-') || ['h1', 'h2', 'h3', 'h4', 'p', 'section'].includes(a.elementTag),
      ),
    [anchors],
  );

  // anchor → label map
  const anchorLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of visibleAnchors) m.set(a.anchor, a.textPreview?.slice(0, 60) || a.anchor);
    return m;
  }, [visibleAnchors]);

  // anchor → position map
  const anchorPos = useMemo(
    () => new Map(visibleAnchors.map((a) => [a.anchor, a.position])),
    [visibleAnchors],
  );

  // Open comments sorted by document position
  const openComments = useMemo(
    () =>
      localComments
        .filter((c) => c.status === 'open')
        .sort((a, b) => (anchorPos.get(a.anchor) ?? 999) - (anchorPos.get(b.anchor) ?? 999)),
    [localComments, anchorPos],
  );

  // Auto-open panel when there are comments
  useEffect(() => {
    if (openComments.length > 0) setPanelOpen(true);
  }, [openComments.length]);

  // Attach hover listeners to anchor elements
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    const onMouseEnter = (e: Event) => {
      const target = (e.target as HTMLElement).closest('[data-rk-anchor]') as HTMLElement | null;
      if (target) setHoveredAnchor(target.dataset.rkAnchor || null);
    };
    const onMouseLeave = (e: Event) => {
      const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
      if (!related?.closest('[data-rk-anchor]')) setHoveredAnchor(null);
    };

    el.addEventListener('mouseover', onMouseEnter);
    el.addEventListener('mouseout', onMouseLeave);
    return () => {
      el.removeEventListener('mouseover', onMouseEnter);
      el.removeEventListener('mouseout', onMouseLeave);
    };
  }, []);

  // Highlight anchor elements that have comments
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const withComments = new Set(openComments.map((c) => c.anchor));
    for (const a of visibleAnchors) {
      const target = el.querySelector(`[data-rk-anchor="${a.anchor}"]`);
      if (!target) continue;
      target.classList.toggle('rk-has-comment', withComments.has(a.anchor));
    }
  }, [openComments, visibleAnchors]);

  // Click panel comment → scroll to block
  const scrollToAnchor = useCallback((anchor: string, commentId: string) => {
    setActiveComment(commentId);
    if (!bodyRef.current) return;
    const target = bodyRef.current.querySelector(`[data-rk-anchor="${anchor}"]`);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('rk-comment-flash');
    setTimeout(() => target.classList.remove('rk-comment-flash'), 1400);
  }, []);

  // Open inline comment box for an anchor
  const openAdding = useCallback((anchor: string) => {
    setAdding({ anchor, text: '' });
    setPanelOpen(true);
  }, []);

  // Submit comment
  const submitComment = useCallback(async () => {
    if (!adding || !adding.text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/artifacts/${meta.id}/comments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ blockId: adding.anchor, text: adding.text.trim() }),
      });
      const data = await res.json();
      if (data.ok && data.comment) {
        const c = data.comment;
        setLocalComments((prev) => [
          ...prev,
          {
            id: c.id,
            anchor: c.blockId || adding.anchor,
            text: c.text,
            status: c.status || 'open',
            createdAt: c.createdAt,
          },
        ]);
        setAdding(null);
      }
    } finally {
      setSubmitting(false);
    }
  }, [adding, meta.id]);

  return (
    <div className={`rk-layout${panelOpen ? ' panel-open' : ''}`}>
      <link rel="stylesheet" href="/rk/theme.css" />
      <link rel="stylesheet" href="/rk/components.css" />

      {/* ── Main document ── */}
      <div ref={bodyRef} className="rk-html-body" data-rk-theme={revision.processedHtml?.includes('data-rk-theme') ? undefined : 'paper-light'}>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: server-processed HTML */}
        <div dangerouslySetInnerHTML={{ __html: revision.processedHtml || '' }} />

        {/* "+ add comment" buttons — appear on hover */}
        {visibleAnchors.map((a) =>
          hoveredAnchor === a.anchor ? (
            <button
              key={a.anchor}
              type="button"
              className="rk-add-comment-btn"
              style={{ '--anchor': `"${a.anchor}"` } as React.CSSProperties}
              onClick={() => openAdding(a.anchor)}
              title="添加评论"
            >
              +
            </button>
          ) : null,
        )}
      </div>

      {/* ── Panel toggle tab (always visible on right edge) ── */}
      <button
        type="button"
        className="rk-panel-tab"
        onClick={() => setPanelOpen((v) => !v)}
        title={panelOpen ? '收起评论' : '展开评论'}
      >
        {panelOpen ? '›' : '‹'}
        {!panelOpen && openComments.length > 0 && (
          <span className="rk-panel-tab__count">{openComments.length}</span>
        )}
      </button>

      {/* ── Right comment panel ── */}
      <aside className={`rk-comment-panel${panelOpen ? ' is-open' : ''}`}>
        <div className="rk-comment-panel__header">
          <span className="rk-comment-panel__title">
            评论
            {openComments.length > 0 && (
              <span className="rk-comment-panel__badge">{openComments.length}</span>
            )}
          </span>
        </div>

        <div className="rk-comment-panel__body">
          {/* Inline comment input (pinned at top when adding) */}
          {adding && (
            <div className="rk-comment-input">
              <div className="rk-comment-input__anchor">
                {anchorLabel.get(adding.anchor) || adding.anchor}
              </div>
              <textarea
                className="rk-comment-input__textarea"
                placeholder="写下评论…"
                value={adding.text}
                autoFocus
                onChange={(e) => setAdding((prev) => prev && { ...prev, text: e.target.value })}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submitComment();
                  if (e.key === 'Escape') setAdding(null);
                }}
                rows={3}
              />
              <div className="rk-comment-input__actions">
                <button
                  type="button"
                  className="rk-comment-input__cancel"
                  onClick={() => setAdding(null)}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="rk-comment-input__submit"
                  disabled={submitting || !adding.text.trim()}
                  onClick={submitComment}
                >
                  {submitting ? '…' : '发送'}
                </button>
              </div>
            </div>
          )}

          {/* Comment list */}
          {openComments.length === 0 && !adding && (
            <p className="rk-comment-panel__empty">悬停文档块，点击 + 添加评论</p>
          )}
          {openComments.map((c) => (
            <div
              key={c.id}
              className={`rk-comment-card${activeComment === c.id ? ' is-active' : ''}`}
              onClick={() => scrollToAnchor(c.anchor, c.id)}
            >
              <div className="rk-comment-card__quote">
                {anchorLabel.get(c.anchor) || c.anchor}
              </div>
              <p className="rk-comment-card__text">{c.text}</p>
              <span className="rk-comment-card__time">
                {new Date(c.createdAt).toLocaleString('zh-CN', {
                  month: 'numeric', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
          ))}
        </div>
      </aside>

      <Script src="/rk/components.js" strategy="afterInteractive" />
    </div>
  );
}
