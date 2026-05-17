'use client';

import Script from 'next/script';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Comment, HtmlArtifactBundle } from '../../../lib/store.ts';

interface AddingState { anchor: string; text: string }
interface BtnState { anchor: string; top: number; left: number }

export default function HtmlArtifactView({ artifact }: { artifact: HtmlArtifactBundle }) {
  const { meta, revision, anchors, comments } = artifact;

  const bodyRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Extract theme from processedHtml (agent sets data-rk-theme in their HTML)
  const theme = useMemo(() => {
    const m = revision.processedHtml?.match(/data-rk-theme="([^"]+)"/);
    return m?.[1] || 'paper-light';
  }, [revision.processedHtml]);

  const [panelOpen, setPanelOpen] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(
    comments.map((c) => ({ ...c, anchor: (c as any).blockId || c.anchor || '' })),
  );
  const [activeComment, setActiveComment] = useState<string | null>(null);
  const [adding, setAdding] = useState<AddingState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Floating "+" button — positioned via getBoundingClientRect (not rendered inside innerHTML)
  const [addBtn, setAddBtn] = useState<BtnState | null>(null);

  const visibleAnchors = useMemo(
    () =>
      anchors.filter(
        (a) =>
          a.elementTag.startsWith('rk-') ||
          ['h1', 'h2', 'h3', 'h4', 'p', 'section', 'div'].includes(a.elementTag),
      ),
    [anchors],
  );

  const anchorLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of visibleAnchors)
      m.set(a.anchor, a.textPreview?.slice(0, 60) || a.anchor);
    return m;
  }, [visibleAnchors]);

  const anchorPos = useMemo(
    () => new Map(visibleAnchors.map((a) => [a.anchor, a.position])),
    [visibleAnchors],
  );

  const openComments = useMemo(
    () =>
      localComments
        .filter((c) => c.status === 'open')
        .sort((a, b) => (anchorPos.get(a.anchor) ?? 999) - (anchorPos.get(b.anchor) ?? 999)),
    [localComments, anchorPos],
  );

  // Auto-open panel when comments exist
  useEffect(() => {
    if (openComments.length > 0) setPanelOpen(true);
  }, [openComments.length]);

  // Attach hover → floating "+" button via JS getBoundingClientRect
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    const show = (e: Event) => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      const target = (e.target as HTMLElement).closest('[data-rk-anchor]') as HTMLElement | null;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      setAddBtn({
        anchor: target.dataset.rkAnchor || '',
        top: rect.top + rect.height / 2 - 12, // vertically centered on block
        left: rect.right + 10,                 // 10px right of block edge
      });
    };

    const hide = () => {
      hideTimerRef.current = setTimeout(() => setAddBtn(null), 300);
    };

    el.addEventListener('mouseover', show);
    el.addEventListener('mouseout', hide);
    return () => {
      el.removeEventListener('mouseover', show);
      el.removeEventListener('mouseout', hide);
    };
  }, []);

  // Mark anchors that have comments
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

  const scrollToAnchor = useCallback((anchor: string, commentId: string) => {
    setActiveComment(commentId);
    const target = bodyRef.current?.querySelector(`[data-rk-anchor="${anchor}"]`);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('rk-comment-flash');
    setTimeout(() => target.classList.remove('rk-comment-flash'), 1400);
  }, []);

  const openAdding = useCallback((anchor: string) => {
    setAdding({ anchor, text: '' });
    setAddBtn(null);
    setPanelOpen(true);
  }, []);

  const submitComment = useCallback(async () => {
    if (!adding?.text.trim()) return;
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
          { id: c.id, anchor: c.blockId || adding.anchor, text: c.text, status: 'open', createdAt: c.createdAt },
        ]);
        setAdding(null);
      }
    } finally {
      setSubmitting(false);
    }
  }, [adding, meta.id]);

  return (
    <div className={`rk-layout${panelOpen ? ' panel-open' : ''}`} data-rk-theme={theme}>
      <link rel="stylesheet" href="/rk/theme.css" />
      <link rel="stylesheet" href="/rk/components.css" />

      {/* ── Document area ── */}
      <div ref={bodyRef} className="rk-html-body">
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: server-processed HTML */}
        <div dangerouslySetInnerHTML={{ __html: revision.processedHtml || '' }} />
      </div>

      {/* ── Floating "+" button (JS-positioned, not inside innerHTML) ── */}
      {addBtn && (
        <button
          type="button"
          className="rk-add-comment-btn"
          style={{ position: 'fixed', top: addBtn.top, left: addBtn.left }}
          onMouseEnter={() => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); }}
          onMouseLeave={() => { hideTimerRef.current = setTimeout(() => setAddBtn(null), 300); }}
          onClick={() => openAdding(addBtn.anchor)}
          title="添加评论"
        >
          +
        </button>
      )}

      {/* ── Panel toggle tab ── */}
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

      {/* ── Comment panel ── */}
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
          {/* Inline comment input */}
          {adding && (
            <div className="rk-comment-input">
              <div className="rk-comment-input__anchor">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.6 }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {anchorLabel.get(adding.anchor) || adding.anchor}
              </div>
              <textarea
                className="rk-comment-input__textarea"
                placeholder="写下评论… (Cmd+Enter 提交，Esc 取消)"
                value={adding.text}
                // biome-ignore lint/a11y/noAutofocus: intentional UX — user clicked to add comment
                autoFocus
                onChange={(e) => setAdding((p) => p && { ...p, text: e.target.value })}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submitComment();
                  if (e.key === 'Escape') setAdding(null);
                }}
                rows={3}
              />
              <div className="rk-comment-input__actions">
                <button type="button" className="rk-comment-input__cancel" onClick={() => setAdding(null)}>取消</button>
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

          {openComments.length === 0 && !adding && (
            <p className="rk-comment-panel__empty">
              悬停文档块后点击 <strong>+</strong> 添加评论
            </p>
          )}

          {openComments.map((c) => (
            <div
              key={c.id}
              className={`rk-comment-card${activeComment === c.id ? ' is-active' : ''}`}
              onClick={() => scrollToAnchor(c.anchor, c.id)}
              title="点击定位到文档"
            >
              <div className="rk-comment-card__quote">
                {anchorLabel.get(c.anchor) || c.anchor}
              </div>
              <p className="rk-comment-card__text">{c.text}</p>
              <span className="rk-comment-card__time">
                {new Date(c.createdAt).toLocaleString('zh-CN', {
                  month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
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
