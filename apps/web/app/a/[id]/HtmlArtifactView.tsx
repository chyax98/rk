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

export default function HtmlArtifactView({ artifact }: { artifact: HtmlArtifactBundle }) {
  const { meta, revision, anchors, comments } = artifact;

  const bodyRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [localComments, setLocalComments] = useState<Comment[]>(
    comments.map((c) => ({ ...c, anchor: (c as any).blockId || c.anchor || '' })),
  );
  const [activeComment, setActiveComment] = useState<string | null>(null);
  const [newAnchor, setNewAnchor] = useState('');
  const [newText, setNewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Only show meaningful anchors (rk-* and h1/h2/h3)
  const visibleAnchors = useMemo(
    () =>
      anchors.filter(
        (a) => a.elementTag.startsWith('rk-') || ['h1', 'h2', 'h3'].includes(a.elementTag),
      ),
    [anchors],
  );

  // Open comments sorted by anchor position in document
  const openComments = useMemo(() => {
    const anchorPos = new Map(visibleAnchors.map((a) => [a.anchor, a.position]));
    return localComments
      .filter((c) => c.status === 'open')
      .sort((a, b) => (anchorPos.get(a.anchor) ?? 999) - (anchorPos.get(b.anchor) ?? 999));
  }, [localComments, visibleAnchors]);

  // Anchor label map (text preview)
  const anchorLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of visibleAnchors) m.set(a.anchor, a.textPreview?.slice(0, 60) || a.anchor);
    return m;
  }, [visibleAnchors]);

  // Mark document anchors that have comments
  useEffect(() => {
    if (!bodyRef.current) return;
    const anchorsWithComments = new Set(openComments.map((c) => c.anchor));
    for (const a of visibleAnchors) {
      const el = bodyRef.current.querySelector(`[data-rk-anchor="${a.anchor}"]`);
      if (!el) continue;
      if (anchorsWithComments.has(a.anchor)) {
        el.classList.add('rk-has-comment');
      } else {
        el.classList.remove('rk-has-comment');
      }
    }
  }, [openComments, visibleAnchors]);

  // Click comment card → scroll to anchor in document
  const scrollToAnchor = useCallback((anchor: string, commentId: string) => {
    setActiveComment(commentId);
    if (!bodyRef.current) return;
    const el = bodyRef.current.querySelector(`[data-rk-anchor="${anchor}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('rk-comment-flash');
    setTimeout(() => el.classList.remove('rk-comment-flash'), 1200);
  }, []);

  // Submit new comment
  const submitComment = useCallback(async () => {
    if (!newAnchor || !newText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/artifacts/${meta.id}/comments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ blockId: newAnchor, text: newText.trim() }),
      });
      const data = await res.json();
      if (data.ok && data.comment) {
        const c = data.comment;
        setLocalComments((prev) => [
          ...prev,
          {
            id: c.id,
            anchor: c.blockId || newAnchor,
            text: c.text,
            status: c.status || 'open',
            createdAt: c.createdAt,
          },
        ]);
        setNewText('');
      }
    } finally {
      setSubmitting(false);
    }
  }, [newAnchor, newText, meta.id]);

  return (
    <div className={`rk-page rk-layout${panelOpen ? ' panel-open' : ' panel-closed'}`} data-rk-theme="paper-light">
      <link rel="stylesheet" href="/rk/theme.css" />
      <link rel="stylesheet" href="/rk/components.css" />

      {/* Main document area */}
      <div ref={bodyRef} className="rk-html-body">
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: server-processed HTML */}
        <div dangerouslySetInnerHTML={{ __html: revision.processedHtml || '' }} />
      </div>

      {/* Right comment panel — Feishu style */}
      <aside className={`rk-comment-panel${panelOpen ? ' is-open' : ' is-closed'}`}>
        <div className="rk-comment-panel__header">
          <span className="rk-comment-panel__title">
            评论
            {openComments.length > 0 && (
              <span className="rk-comment-panel__count">{openComments.length}</span>
            )}
          </span>
          <button
            type="button"
            className="rk-comment-panel__toggle"
            onClick={() => setPanelOpen((v) => !v)}
            title={panelOpen ? '收起' : '展开评论'}
          >
            {panelOpen ? '»' : '«'}
          </button>
        </div>

        {panelOpen && (
          <>
            <div className="rk-comment-panel__list" ref={panelRef}>
              {openComments.length === 0 && (
                <p className="rk-comment-panel__empty">暂无评论</p>
              )}
              {openComments.map((c) => (
                <div
                  key={c.id}
                  className={`rk-comment-card${activeComment === c.id ? ' is-active' : ''}`}
                  onClick={() => scrollToAnchor(c.anchor, c.id)}
                >
                  {/* Anchor quote — yellow bg like Feishu */}
                  <div className="rk-comment-card__anchor">
                    <span className="rk-comment-card__anchor-text">
                      {anchorLabel.get(c.anchor) || c.anchor}
                    </span>
                  </div>
                  <p className="rk-comment-card__text">{c.text}</p>
                  <span className="rk-comment-card__time">
                    {new Date(c.createdAt).toLocaleString('zh-CN', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>

            {/* New comment area */}
            <div className="rk-comment-panel__new">
              <select
                className="rk-comment-panel__anchor-select"
                value={newAnchor}
                onChange={(e) => setNewAnchor(e.target.value)}
              >
                <option value="">选择位置…</option>
                {visibleAnchors.map((a) => (
                  <option key={a.id} value={a.anchor}>
                    {a.textPreview?.slice(0, 40) || a.anchor}
                  </option>
                ))}
              </select>
              <textarea
                className="rk-comment-panel__textarea"
                placeholder="写下评论… (Cmd+Enter 提交)"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submitComment();
                }}
                rows={3}
              />
              <button
                type="button"
                className="rk-comment-panel__submit"
                onClick={submitComment}
                disabled={submitting || !newText.trim() || !newAnchor}
              >
                {submitting ? '…' : '发送'}
              </button>
            </div>
          </>
        )}
      </aside>

      <Script src="/rk/components.js" strategy="afterInteractive" />
    </div>
  );
}
