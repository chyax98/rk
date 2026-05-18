'use client';

import Script from 'next/script';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Comment, HtmlArtifactBundle } from '@/lib/store.ts';

interface AddingState {
  anchor: string;
  text: string;
}
// BtnState removed — button is now ref-driven to avoid React re-renders that break WC charts
interface RevisionSummary {
  revisionNumber: number;
  createdAt: number;
  title: string;
}

export default function HtmlArtifactView({ artifact }: { artifact: HtmlArtifactBundle }) {
  const { meta, revision, anchors, comments } = artifact;

  const bodyRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(
    comments.map((c) => ({ ...c, anchor: c.anchor || '' })),
  );
  const [activeComment, setActiveComment] = useState<string | null>(null);
  const [adding, setAdding] = useState<AddingState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Use ref instead of state — state updates cause re-renders that trigger ResizeObserver in WC (ECharts/Mermaid)
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const addBtnAnchorRef = useRef<string>('');
  const [hoveredComment, setHoveredComment] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showRevisions, setShowRevisions] = useState(false);
  const [revisions, setRevisions] = useState<RevisionSummary[]>([]);
  const [viewingRev, setViewingRev] = useState<number>(meta.currentRevision);
  const [revHtml, setRevHtml] = useState<string | null>(null);

  const displayedHtml = revHtml ?? revision.processedHtml ?? '';

  const theme = useMemo(() => {
    const m = displayedHtml.match(/data-rk-theme="([^"]+)"/);
    return m?.[1] || 'paper-light';
  }, [displayedHtml]);

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
    for (const a of visibleAnchors) m.set(a.anchor, a.textPreview?.slice(0, 60) || a.anchor);
    return m;
  }, [visibleAnchors]);

  const anchorPos = useMemo(
    () => new Map(visibleAnchors.map((a) => [a.anchor, a.position])),
    [visibleAnchors],
  );

  const commentsByAnchor = useMemo(() => {
    const map = new Map<string, Comment[]>();
    for (const c of localComments.filter((comment) => comment.status === 'open')) {
      const list = map.get(c.anchor) || [];
      list.push(c);
      map.set(c.anchor, list);
    }
    return map;
  }, [localComments]);

  const openComments = useMemo(
    () =>
      localComments
        .filter((c) => c.status === 'open')
        .sort((a, b) => (anchorPos.get(a.anchor) ?? 999) - (anchorPos.get(b.anchor) ?? 999)),
    [localComments, anchorPos],
  );

  // Set artifact ID on document element so rk-form can POST submissions.
  useEffect(() => {
    document.documentElement.setAttribute('data-rk-artifact-id', meta.id);
    return () => document.documentElement.removeAttribute('data-rk-artifact-id');
  }, [meta.id]);

  const scrollToAnchor = useCallback((anchor: string, commentId?: string) => {
    if (commentId) setActiveComment(commentId);
    const target = bodyRef.current?.querySelector(`[data-rk-anchor="${anchor}"]`);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('rk-comment-flash');
    setTimeout(() => target.classList.remove('rk-comment-flash'), 1400);
  }, []);

  const openPanelForAnchor = useCallback(
    (anchor: string) => {
      const first = commentsByAnchor.get(anchor)?.[0];
      if (first) setActiveComment(first.id);
      setPanelOpen(true);
      if (first) scrollToAnchor(anchor, first.id);
    },
    [commentsByAnchor, scrollToAnchor],
  );

  // Hover a document anchor → show floating + button. Comments remain secondary; document layout never changes.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    const show = (e: Event) => {
      if (viewingRev !== meta.currentRevision) return;
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      const target = (e.target as HTMLElement).closest('[data-rk-anchor]') as HTMLElement | null;
      if (!target || !addBtnRef.current) return;
      const rect = target.getBoundingClientRect();
      addBtnAnchorRef.current = target.dataset.rkAnchor || '';
      // 直接操作 DOM，不经过 React state — 避免 re-render 触发 WC ResizeObserver
      const btn = addBtnRef.current;
      btn.style.top = `${rect.top + rect.height / 2 - 12}px`;
      btn.style.left = `${rect.right + 10}px`;
      btn.style.display = 'flex';
    };

    const hide = () => {
      hideTimerRef.current = setTimeout(() => {
        if (addBtnRef.current) addBtnRef.current.style.display = 'none';
      }, 300);
    };

    el.addEventListener('mouseover', show);
    el.addEventListener('mouseout', hide);
    return () => {
      el.removeEventListener('mouseover', show);
      el.removeEventListener('mouseout', hide);
    };
  }, [meta.currentRevision, viewingRev]);

  // Badge counts: JS sets data-comment-count, CSS renders the small orange badge.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    for (const a of visibleAnchors) {
      const target = el.querySelector(`[data-rk-anchor="${a.anchor}"]`) as HTMLElement | null;
      if (!target) continue;
      const count = commentsByAnchor.get(a.anchor)?.length || 0;
      target.classList.toggle('rk-has-comment', count > 0);
      if (count > 0) {
        target.setAttribute('data-comment-count', String(count));
      } else {
        target.removeAttribute('data-comment-count');
      }
    }
  }, [commentsByAnchor, visibleAnchors, displayedHtml]);

  // Clicking only the right-side badge zone opens panel and focuses matching comments.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(
        '[data-rk-anchor].rk-has-comment',
      ) as HTMLElement | null;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const clickedBadgeZone = e.clientX >= rect.right - 6;
      if (!clickedBadgeZone) return;
      e.preventDefault();
      e.stopPropagation();
      const anchor = target.dataset.rkAnchor;
      if (anchor) openPanelForAnchor(anchor);
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [openPanelForAnchor]);

  const openAdding = useCallback((anchor: string) => {
    setAdding({ anchor, text: '' });
    setEditingId(null);
    setDeletingId(null);
    if (addBtnRef.current) addBtnRef.current.style.display = 'none';
    setPanelOpen(true);
  }, []);

  const submitComment = useCallback(async () => {
    if (!adding?.text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/artifacts/${meta.id}/comments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ anchor: adding.anchor, text: adding.text.trim() }),
      });
      const data = await res.json();
      if (data.ok && data.comment) {
        const c = data.comment;
        setLocalComments((prev) => [
          ...prev,
          {
            id: c.id,
            artifactId: c.artifactId || meta.id,
            anchor: c.anchor || adding.anchor,
            text: c.text,
            selector: c.selector || null,
            status: c.status || 'open',
            createdAtRevision: c.createdAtRevision ?? meta.currentRevision,
            createdAt: c.createdAt,
            resolvedAtRevision: c.resolvedAtRevision,
            resolvedBy: c.resolvedBy,
            resolvedAt: c.resolvedAt,
            reopenedAt: c.reopenedAt,
          },
        ]);
        setAdding(null);
      }
    } finally {
      setSubmitting(false);
    }
  }, [adding, meta.currentRevision, meta.id]);

  const startEdit = useCallback((comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
    setDeletingId(null);
  }, []);

  const saveEdit = useCallback(
    async (commentId: string) => {
      const text = editText.trim();
      if (!text) return;
      setSubmitting(true);
      try {
        const res = await fetch(`/api/artifacts/${meta.id}/comments/${commentId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        if (data.ok && data.comment) {
          setLocalComments((prev) =>
            prev.map((c) => (c.id === commentId ? { ...c, text: data.comment.text } : c)),
          );
          setEditingId(null);
          setEditText('');
        }
      } finally {
        setSubmitting(false);
      }
    },
    [editText, meta.id],
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      if (deletingId !== commentId) {
        setDeletingId(commentId);
        return;
      }
      setSubmitting(true);
      try {
        const res = await fetch(`/api/artifacts/${meta.id}/comments/${commentId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ status: 'resolved' }),
        });
        const data = await res.json();
        if (data.ok && data.comment) {
          setLocalComments((prev) =>
            prev.map((c) => (c.id === commentId ? { ...c, status: 'resolved' } : c)),
          );
          if (activeComment === commentId) setActiveComment(null);
          setDeletingId(null);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [activeComment, deletingId, meta.id],
  );

  const loadRevisions = useCallback(async () => {
    const res = await fetch(`/api/artifacts/${meta.id}/revisions/list`);
    const data = await res.json();
    if (data.ok) setRevisions(data.revisions);
  }, [meta.id]);

  const switchRevision = useCallback(
    async (rev: number) => {
      if (rev === meta.currentRevision) {
        setRevHtml(null);
        setViewingRev(rev);
        return;
      }

      const res = await fetch(`/api/artifacts/${meta.id}/revisions/${rev}`);
      const data = await res.json();
      if (data.ok) {
        setRevHtml(data.processedHtml);
        setViewingRev(rev);
        if (addBtnRef.current) addBtnRef.current.style.display = 'none';
        setAdding(null);
      }
    },
    [meta.id, meta.currentRevision],
  );

  return (
    <div className="rk-layout" data-rk-theme={theme}>
      <link rel="stylesheet" href="/rk/theme.css" />
      <link rel="stylesheet" href="/rk/components.css" />

      <div ref={bodyRef} id="rk-main" className="rk-html-body">
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: server-processed HTML */}
        <div dangerouslySetInnerHTML={{ __html: displayedHtml }} />
      </div>

      {/* 浮动 + 按钮—不经过 React state，直接 ref 操作 DOM — 避免 re-render 触发 WC ResizeObserver 导致图表閉烁 */}
      <button
        ref={addBtnRef}
        type="button"
        className="rk-add-comment-btn"
        style={{ display: 'none', position: 'fixed' }}
        onMouseEnter={() => {
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        }}
        onMouseLeave={() => {
          hideTimerRef.current = setTimeout(() => {
            if (addBtnRef.current) addBtnRef.current.style.display = 'none';
          }, 300);
        }}
        onClick={() => openAdding(addBtnAnchorRef.current)}
        title="添加评论"
        aria-label="添加评论"
      >
        +
      </button>

      <button
        type="button"
        className="rk-panel-tab"
        onClick={() => setPanelOpen((v) => !v)}
        title={panelOpen ? '收起评论' : '展开评论'}
        aria-label={panelOpen ? '收起评论' : '展开评论'}
      >
        {panelOpen ? '›' : '‹'}
        {!panelOpen && openComments.length > 0 && (
          <span className="rk-panel-tab__count">{openComments.length}</span>
        )}
      </button>

      <button
        type="button"
        className="rk-version-tab"
        onClick={() => {
          setShowRevisions((v) => !v);
          if (!showRevisions) loadRevisions();
        }}
        title="版本历史"
      >
        v{viewingRev}
        {viewingRev !== meta.currentRevision && <span className="rk-version-tab__old">历史</span>}
      </button>

      {showRevisions && (
        <div className="rk-version-panel">
          <div className="rk-version-panel__header">版本历史</div>
          {revisions.map((r) => (
            <button
              key={r.revisionNumber}
              type="button"
              className={`rk-version-item${viewingRev === r.revisionNumber ? ' is-current' : ''}`}
              onClick={() => switchRevision(r.revisionNumber)}
              title={r.title}
            >
              <span className="rk-version-item__num">v{r.revisionNumber}</span>
              <span className="rk-version-item__time">
                {new Date(r.createdAt).toLocaleDateString('zh-CN')}
              </span>
              {r.revisionNumber === meta.currentRevision && (
                <span className="rk-version-item__badge">最新</span>
              )}
            </button>
          ))}
        </div>
      )}

      <aside className={`rk-comment-panel${panelOpen ? ' is-open' : ''}`} aria-label="评论面板">
        <div className="rk-comment-panel__header">
          <span className="rk-comment-panel__title">
            评论
            {openComments.length > 0 && (
              <span className="rk-comment-panel__badge">{openComments.length}</span>
            )}
          </span>
          <button
            type="button"
            className="rk-comment-panel__close"
            onClick={() => setPanelOpen(false)}
            aria-label="关闭评论面板"
          >
            ×
          </button>
        </div>

        <div className="rk-comment-panel__body">
          {adding && (
            <div className="rk-comment-input">
              <div className="rk-comment-input__anchor">
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

          {openComments.length === 0 && !adding && (
            <p className="rk-comment-panel__empty">悬停文档块后点击 + 添加评论</p>
          )}

          {openComments.map((c) => (
            /* biome-ignore lint/a11y/useSemanticElements: comment card contains nested action buttons; native button would be invalid HTML */
            <div
              className={`rk-comment-card${activeComment === c.id ? ' is-active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => scrollToAnchor(c.anchor, c.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  scrollToAnchor(c.anchor, c.id);
                }
              }}
              onMouseEnter={() => setHoveredComment(c.id)}
              onMouseLeave={() => setHoveredComment(null)}
            >
              <div className="rk-comment-card__quote">{anchorLabel.get(c.anchor) || c.anchor}</div>

              {editingId === c.id ? (
                <div className="rk-comment-edit">
                  <textarea
                    className="rk-comment-edit__textarea"
                    value={editText}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') saveEdit(c.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    rows={3}
                  />
                  <div className="rk-comment-card__actions is-editing">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        saveEdit(c.id);
                      }}
                      disabled={submitting || !editText.trim()}
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(null);
                      }}
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <p className="rk-comment-card__text">{c.text}</p>
              )}

              <span className="rk-comment-card__time">
                {new Date(c.createdAt).toLocaleString('zh-CN', {
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>

              {hoveredComment === c.id && editingId !== c.id && (
                <div className="rk-comment-card__actions">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(c);
                    }}
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    className="is-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteComment(c.id);
                    }}
                    disabled={submitting}
                  >
                    {deletingId === c.id ? '确认删除' : '删除'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      <Script src="/rk/components.js" strategy="afterInteractive" />
    </div>
  );
}
