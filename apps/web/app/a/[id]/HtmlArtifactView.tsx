'use client';

import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Comment, CommentStatus, HtmlArtifactBundle } from '@/lib/store.ts';

interface RevisionSummary {
  revisionNumber: number;
  createdAt: number;
  title: string;
}

interface CompareView {
  leftRev: number;
  rightRev: number;
  leftHtml: string;
  rightHtml: string;
  anchorDiff: { added: string[]; removed: string[]; kept: string[] };
}

interface RenderError {
  id: string;
  engine: string;
  message: string;
  anchor: string;
  createdAt: string;
}

interface Props {
  artifact: HtmlArtifactBundle;
  displayedHtml: string;
  viewingRev: number;
  revisions: RevisionSummary[];
  compare: CompareView | null;
  initialPanelOpen: boolean;
}

interface Thread {
  root: Comment;
  replies: Comment[];
}

const STATUS_LABEL: Record<CommentStatus, string> = {
  open: '待处理',
  addressed: '待验收',
  resolved: '已解决',
  orphaned: '锚点已失效',
};

const STATUS_COLOR: Record<CommentStatus, string> = {
  open: '#f59e0b',
  addressed: '#3b82f6',
  resolved: '#10b981',
  orphaned: '#9ca3af',
};

/* ─── Body subtree memoized to avoid React state churn re-mounting Web Components ─── */
const BodyHtml = memo(
  function BodyHtml({ html }: { html: string }) {
    return (
      <div
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-processed HTML
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  },
  (prev, next) => prev.html === next.html,
);

export default function HtmlArtifactView(props: Props) {
  const { artifact, displayedHtml, viewingRev, revisions, compare, initialPanelOpen } = props;
  const { meta, anchors, comments } = artifact;
  const router = useRouter();

  const isCurrentRev = viewingRev === meta.currentRevision && !compare;

  const bodyRef = useRef<HTMLDivElement>(null);
  const compareLeftRef = useRef<HTMLDivElement>(null);
  const compareRightRef = useRef<HTMLDivElement>(null);

  const [panelOpen, setPanelOpen] = useState(initialPanelOpen);
  const [localComments, setLocalComments] = useState<Comment[]>(comments);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [addingForAnchor, setAddingForAnchor] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showRevisionsMenu, setShowRevisionsMenu] = useState(false);
  const [showCompareMenu, setShowCompareMenu] = useState(false);

  const [renderErrors, setRenderErrors] = useState<RenderError[]>([]);
  const [showErrorPanel, setShowErrorPanel] = useState(false);

  const theme = useMemo(() => {
    const m = displayedHtml.match(/data-rk-theme="([^"]+)"/);
    return m?.[1] || 'paper-light';
  }, [displayedHtml]);

  /* ── Comment data prep ─────────────────────────────────── */

  // Only show comments whose anchor exists in the currently displayed revision
  const anchorSet = useMemo(() => new Set(anchors.map((a) => a.anchor)), [anchors]);
  const anchorLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of anchors) m.set(a.anchor, a.textPreview?.slice(0, 80) || a.anchor);
    return m;
  }, [anchors]);
  const anchorPos = useMemo(
    () => new Map(anchors.map((a) => [a.anchor, a.position])),
    [anchors],
  );

  const threads = useMemo<Thread[]>(() => {
    const byParent = new Map<string, Comment[]>();
    const roots: Comment[] = [];
    for (const c of localComments) {
      if (c.parentId) {
        const list = byParent.get(c.parentId) ?? [];
        list.push(c);
        byParent.set(c.parentId, list);
      } else {
        roots.push(c);
      }
    }
    return roots
      .filter((r) => r.status !== 'resolved')
      .sort((a, b) => (anchorPos.get(a.anchor) ?? 999) - (anchorPos.get(b.anchor) ?? 999))
      .map((root) => ({
        root,
        replies: (byParent.get(root.id) ?? []).sort((a, b) =>
          a.createdAt.localeCompare(b.createdAt),
        ),
      }));
  }, [localComments, anchorPos]);

  const threadByAnchor = useMemo(() => {
    const m = new Map<string, Thread[]>();
    for (const t of threads) {
      const list = m.get(t.root.anchor) ?? [];
      list.push(t);
      m.set(t.root.anchor, list);
    }
    return m;
  }, [threads]);

  /* ── Set artifact id so rk-form posts work ─────────────── */
  useEffect(() => {
    document.documentElement.setAttribute('data-rk-artifact-id', meta.id);
    return () => document.documentElement.removeAttribute('data-rk-artifact-id');
  }, [meta.id]);

  /* ── Render errors: load + listen ──────────────────────── */
  useEffect(() => {
    fetch(`/api/artifacts/${meta.id}/render-errors`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setRenderErrors(d.errors);
      })
      .catch(() => {});
  }, [meta.id]);

  useEffect(() => {
    const pending: { engine: string; message: string; anchor: string }[] = [];
    let timer: ReturnType<typeof setTimeout> | null = null;

    const flush = () => {
      if (pending.length === 0) return;
      const batch = pending.splice(0);
      fetch(`/api/artifacts/${meta.id}/render-errors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      })
        .then((r) => r.json())
        .then(() => {
          // Re-fetch list to display
          return fetch(`/api/artifacts/${meta.id}/render-errors`).then((r) => r.json());
        })
        .then((d) => {
          if (d.ok) setRenderErrors(d.errors);
        })
        .catch(() => {});
    };

    const handler = (e: Event) => {
      const { engine, message, anchor } = (e as CustomEvent).detail ?? {};
      if (!engine || !message) return;
      pending.push({
        engine: String(engine),
        message: String(message),
        anchor: String(anchor ?? ''),
      });
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, 800);
    };

    document.addEventListener('rk-render-error', handler);
    return () => {
      document.removeEventListener('rk-render-error', handler);
      if (timer) clearTimeout(timer);
      flush();
    };
  }, [meta.id]);

  const clearRenderErrors = useCallback(async () => {
    await fetch(`/api/artifacts/${meta.id}/render-errors`, { method: 'DELETE' });
    setRenderErrors([]);
  }, [meta.id]);

  /* ── Gutter rail: positions of anchors with comments ───── */
  const [gutterMarks, setGutterMarks] = useState<
    { anchor: string; top: number; height: number; count: number }[]
  >([]);

  useEffect(() => {
    if (!bodyRef.current) return;
    const compute = () => {
      const el = bodyRef.current;
      if (!el) return;
      const containerRect = el.getBoundingClientRect();
      const marks: { anchor: string; top: number; height: number; count: number }[] = [];
      for (const [anchor, threadList] of threadByAnchor) {
        const node = el.querySelector(`[data-rk-anchor="${anchor}"]`);
        if (!node) continue;
        const r = (node as HTMLElement).getBoundingClientRect();
        marks.push({
          anchor,
          top: r.top - containerRect.top + el.scrollTop,
          height: Math.max(r.height, 6),
          count: threadList.reduce((sum, t) => sum + 1 + t.replies.length, 0),
        });
      }
      setGutterMarks(marks);
    };
    compute();
    const onScroll = () => compute();
    window.addEventListener('resize', compute);
    // Wait two RAFs for WC to settle, then compute again
    const raf1 = requestAnimationFrame(() => requestAnimationFrame(compute));
    bodyRef.current.addEventListener('scroll', onScroll);
    return () => {
      window.removeEventListener('resize', compute);
      cancelAnimationFrame(raf1);
      if (bodyRef.current) bodyRef.current.removeEventListener('scroll', onScroll);
    };
  }, [threadByAnchor, displayedHtml]);

  /* ── Scroll-to-anchor with offset ──────────────────────── */
  const scrollToAnchor = useCallback((anchor: string, commentId?: string) => {
    if (commentId) setActiveCommentId(commentId);
    const target = bodyRef.current?.querySelector(`[data-rk-anchor="${anchor}"]`);
    if (!target) return;
    const rect = (target as HTMLElement).getBoundingClientRect();
    const offset = window.innerHeight / 3;
    window.scrollBy({ top: rect.top - offset, behavior: 'smooth' });
    target.classList.add('rk-anchor-flash');
    setTimeout(() => target.classList.remove('rk-anchor-flash'), 1200);
  }, []);

  const openThreadForAnchor = useCallback(
    (anchor: string) => {
      const first = threadByAnchor.get(anchor)?.[0];
      if (first) {
        setActiveCommentId(first.root.id);
        scrollToAnchor(anchor, first.root.id);
      }
      setPanelOpen(true);
    },
    [threadByAnchor, scrollToAnchor],
  );

  /* ── "Add comment" hover button on anchor blocks ───────── */
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const addBtnAnchorRef = useRef<string>('');
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el || !isCurrentRev) return;
    const show = (e: Event) => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      const target = (e.target as HTMLElement).closest('[data-rk-anchor]') as HTMLElement | null;
      if (!target || !addBtnRef.current) return;
      const rect = target.getBoundingClientRect();
      addBtnAnchorRef.current = target.dataset.rkAnchor || '';
      const btn = addBtnRef.current;
      btn.style.top = `${rect.top + rect.height / 2 - 12}px`;
      btn.style.left = `${rect.right + 8}px`;
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
  }, [isCurrentRev]);

  /* ── Selection-based comment trigger ───────────────────── */
  const [selectionBtn, setSelectionBtn] = useState<{ x: number; y: number; anchor: string } | null>(
    null,
  );

  useEffect(() => {
    if (!isCurrentRev) return;
    const handle = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelectionBtn(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const anchor = (range.commonAncestorContainer as HTMLElement).parentElement?.closest('[data-rk-anchor]') as
        | HTMLElement
        | null;
      if (!anchor || !bodyRef.current?.contains(anchor)) {
        setSelectionBtn(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      if (rect.width < 2 && rect.height < 2) {
        setSelectionBtn(null);
        return;
      }
      setSelectionBtn({
        x: rect.right,
        y: rect.top,
        anchor: anchor.dataset.rkAnchor || '',
      });
    };
    document.addEventListener('selectionchange', handle);
    return () => document.removeEventListener('selectionchange', handle);
  }, [isCurrentRev]);

  /* ── Comment counts as data attrs (cosmetic; gutter is canonical) ─── */
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    for (const anchor of anchorSet) {
      const target = el.querySelector(`[data-rk-anchor="${anchor}"]`);
      if (!target) continue;
      const count =
        threadByAnchor.get(anchor)?.reduce((sum, t) => sum + 1 + t.replies.length, 0) || 0;
      if (count > 0) {
        target.classList.add('rk-has-comment');
        target.setAttribute('data-comment-count', String(count));
      } else {
        target.classList.remove('rk-has-comment');
        target.removeAttribute('data-comment-count');
      }
    }
  }, [threadByAnchor, anchorSet, displayedHtml]);

  /* ── Compare mode: anchor-diff coloring + synced scroll ─── */
  useEffect(() => {
    if (!compare) return;
    const apply = (root: HTMLElement | null, side: 'left' | 'right') => {
      if (!root) return;
      const added = new Set(compare.anchorDiff.added);
      const removed = new Set(compare.anchorDiff.removed);
      const all = root.querySelectorAll('[data-rk-anchor]');
      for (const n of Array.from(all)) {
        const a = (n as HTMLElement).dataset.rkAnchor || '';
        n.classList.remove('rk-diff-added', 'rk-diff-removed', 'rk-diff-kept');
        if (side === 'right' && added.has(a)) n.classList.add('rk-diff-added');
        else if (side === 'left' && removed.has(a)) n.classList.add('rk-diff-removed');
        else n.classList.add('rk-diff-kept');
      }
    };
    apply(compareLeftRef.current, 'left');
    apply(compareRightRef.current, 'right');
  }, [compare, displayedHtml]);

  useEffect(() => {
    if (!compare) return;
    const left = compareLeftRef.current;
    const right = compareRightRef.current;
    if (!left || !right) return;
    let lock = false;
    const sync = (src: HTMLElement, dst: HTMLElement) => () => {
      if (lock) return;
      lock = true;
      const ratio = src.scrollTop / (src.scrollHeight - src.clientHeight || 1);
      dst.scrollTop = ratio * (dst.scrollHeight - dst.clientHeight);
      requestAnimationFrame(() => {
        lock = false;
      });
    };
    const l2r = sync(left, right);
    const r2l = sync(right, left);
    left.addEventListener('scroll', l2r);
    right.addEventListener('scroll', r2l);
    return () => {
      left.removeEventListener('scroll', l2r);
      right.removeEventListener('scroll', r2l);
    };
  }, [compare]);

  /* ── Comment actions ───────────────────────────────────── */

  const beginAdd = useCallback((anchor: string) => {
    setAddingForAnchor(anchor);
    setReplyingToId(null);
    setDraftText('');
    setPanelOpen(true);
    if (addBtnRef.current) addBtnRef.current.style.display = 'none';
    setSelectionBtn(null);
  }, []);

  const beginReply = useCallback((rootId: string) => {
    setReplyingToId(rootId);
    setAddingForAnchor(null);
    setDraftText('');
    setPanelOpen(true);
  }, []);

  const cancelDraft = useCallback(() => {
    setAddingForAnchor(null);
    setReplyingToId(null);
    setDraftText('');
  }, []);

  const submitDraft = useCallback(async () => {
    const text = draftText.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { text };
      if (replyingToId) {
        body.parentId = replyingToId;
        const root = localComments.find((c) => c.id === replyingToId);
        body.anchor = root?.anchor ?? '';
      } else if (addingForAnchor) {
        body.anchor = addingForAnchor;
      }
      const res = await fetch(`/api/artifacts/${meta.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok && data.comment) {
        setLocalComments((prev) => [...prev, data.comment]);
        cancelDraft();
      }
    } finally {
      setSubmitting(false);
    }
  }, [addingForAnchor, cancelDraft, draftText, localComments, meta.id, replyingToId]);

  const transitionStatus = useCallback(
    async (commentId: string, next: CommentStatus) => {
      const res = await fetch(`/api/artifacts/${meta.id}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (data.ok && data.comment) {
        setLocalComments((prev) => prev.map((c) => (c.id === commentId ? data.comment : c)));
      }
    },
    [meta.id],
  );

  const startEdit = useCallback((c: Comment) => {
    setEditingId(c.id);
    setEditText(c.text);
  }, []);

  const saveEdit = useCallback(
    async (commentId: string) => {
      const text = editText.trim();
      if (!text) return;
      setSubmitting(true);
      try {
        const res = await fetch(`/api/artifacts/${meta.id}/comments/${commentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
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

  /* ── Revision navigation (uses query params) ───────────── */
  const navTo = useCallback(
    (patch: { rev?: number | null; compare?: [number, number] | null; panel?: boolean }) => {
      const sp = new URLSearchParams();
      if (patch.rev != null && patch.rev !== meta.currentRevision) sp.set('rev', String(patch.rev));
      if (patch.compare) sp.set('compare', `${patch.compare[0]},${patch.compare[1]}`);
      if (patch.panel === false) sp.set('panel', 'closed');
      const qs = sp.toString();
      router.push(`/a/${meta.id}${qs ? `?${qs}` : ''}`);
    },
    [meta.currentRevision, meta.id, router],
  );

  /* ── Keyboard shortcuts ────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const inField =
        t?.tagName === 'INPUT' ||
        t?.tagName === 'TEXTAREA' ||
        t?.isContentEditable;
      if (inField) {
        if (e.key === 'Escape') (t as HTMLInputElement).blur();
        return;
      }
      // Order matters for thread navigation
      const orderedRoots = threads.map((t) => t.root);
      const currIdx = activeCommentId
        ? orderedRoots.findIndex((c) => c.id === activeCommentId)
        : -1;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        if (orderedRoots.length === 0) return;
        e.preventDefault();
        const next = orderedRoots[Math.min(orderedRoots.length - 1, currIdx + 1)];
        if (next) {
          setActiveCommentId(next.id);
          setPanelOpen(true);
          scrollToAnchor(next.anchor, next.id);
        }
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        if (orderedRoots.length === 0) return;
        e.preventDefault();
        const prev = orderedRoots[Math.max(0, currIdx - 1)];
        if (prev) {
          setActiveCommentId(prev.id);
          setPanelOpen(true);
          scrollToAnchor(prev.anchor, prev.id);
        }
      } else if (e.key === 'r' && activeCommentId) {
        e.preventDefault();
        transitionStatus(activeCommentId, 'resolved');
      } else if (e.key === 'R' && activeCommentId) {
        e.preventDefault();
        transitionStatus(activeCommentId, 'open');
      } else if (e.key === 'c' && activeCommentId) {
        e.preventDefault();
        beginReply(activeCommentId);
      } else if (e.key === 'Escape') {
        cancelDraft();
        setPanelOpen(false);
      } else if (e.key === '[' && panelOpen) {
        e.preventDefault();
        setPanelOpen(false);
      } else if (e.key === ']' && !panelOpen) {
        e.preventDefault();
        setPanelOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    activeCommentId,
    beginReply,
    cancelDraft,
    panelOpen,
    scrollToAnchor,
    threads,
    transitionStatus,
  ]);

  /* ── Render ────────────────────────────────────────────── */

  return (
    <div
      className={`rk-artifact${panelOpen ? ' is-panel-open' : ''}${compare ? ' is-compare' : ''}`}
      data-rk-theme={theme}
    >
      <link rel="stylesheet" href="/rk/theme.css" />
      <link rel="stylesheet" href="/rk/components.css" />

      {/* ── Topbar ── */}
      <header className="rk-artifact-topbar">
        <a href="/" className="rk-artifact-back" aria-label="返回列表">
          ←
        </a>
        <div className="rk-artifact-title-wrap">
          <span className="rk-artifact-title">{meta.title || '未命名文档'}</span>
          <span className="rk-artifact-id" title={meta.id}>{meta.id}</span>
        </div>

        <div className="rk-artifact-topbar-spacer" />

        {/* Render error badge */}
        {renderErrors.length > 0 && (
          <button
            type="button"
            className="rk-error-badge"
            onClick={() => setShowErrorPanel((v) => !v)}
            title={`${renderErrors.length} 个组件渲染失败`}
          >
            ⚠ {renderErrors.length}
          </button>
        )}

        {/* Revision menu */}
        <div className="rk-rev-menu">
          <button
            type="button"
            className={`rk-rev-trigger${!isCurrentRev ? ' is-old' : ''}`}
            onClick={() => {
              setShowRevisionsMenu((v) => !v);
              setShowCompareMenu(false);
            }}
          >
            v{viewingRev}{!isCurrentRev && !compare && ' · 历史'}
            {compare && ` vs v${compare.leftRev}`}
          </button>
          {showRevisionsMenu && (
            <div className="rk-rev-dropdown">
              <div className="rk-rev-dropdown-header">版本历史</div>
              {revisions.map((r) => (
                <button
                  key={r.revisionNumber}
                  type="button"
                  className={`rk-rev-item${viewingRev === r.revisionNumber && !compare ? ' is-current' : ''}`}
                  onClick={() => {
                    setShowRevisionsMenu(false);
                    navTo({ rev: r.revisionNumber });
                  }}
                >
                  <span className="rk-rev-item-num">v{r.revisionNumber}</span>
                  <span className="rk-rev-item-time">
                    {new Date(r.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                  {r.revisionNumber === meta.currentRevision && (
                    <span className="rk-rev-item-badge">最新</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Compare button */}
        {revisions.length > 1 && (
          <div className="rk-rev-menu">
            <button
              type="button"
              className={`rk-rev-trigger${compare ? ' is-active' : ''}`}
              onClick={() => {
                if (compare) {
                  navTo({});
                } else {
                  setShowCompareMenu((v) => !v);
                  setShowRevisionsMenu(false);
                }
              }}
            >
              {compare ? '退出对比' : '对比'}
            </button>
            {showCompareMenu && (
              <div className="rk-rev-dropdown">
                <div className="rk-rev-dropdown-header">选择基准版本</div>
                {revisions
                  .filter((r) => r.revisionNumber !== viewingRev)
                  .map((r) => (
                    <button
                      key={r.revisionNumber}
                      type="button"
                      className="rk-rev-item"
                      onClick={() => {
                        setShowCompareMenu(false);
                        navTo({ compare: [r.revisionNumber, viewingRev] });
                      }}
                    >
                      <span className="rk-rev-item-num">v{r.revisionNumber}</span>
                      <span className="rk-rev-item-time">vs v{viewingRev}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Panel toggle */}
        <button
          type="button"
          className="rk-panel-toggle"
          onClick={() => setPanelOpen((v) => !v)}
          aria-label={panelOpen ? '收起评论面板' : '展开评论面板'}
          title={panelOpen ? '收起评论面板 ([)' : '展开评论面板 (])'}
        >
          {panelOpen ? '›' : '‹'}
          {!panelOpen && threads.length > 0 && (
            <span className="rk-panel-toggle-count">{threads.length}</span>
          )}
        </button>
      </header>

      {/* ── Error panel (collapsible) ── */}
      {showErrorPanel && renderErrors.length > 0 && (
        <div className="rk-error-panel">
          <div className="rk-error-panel-head">
            <span>{renderErrors.length} 个组件渲染失败</span>
            <button type="button" onClick={clearRenderErrors} className="rk-error-panel-clear">
              清空
            </button>
          </div>
          {renderErrors.slice(0, 12).map((e) => (
            <div
              key={e.id}
              className="rk-error-row"
              onClick={() => {
                if (e.anchor) {
                  scrollToAnchor(e.anchor);
                  setShowErrorPanel(false);
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter' && e.anchor) scrollToAnchor(e.anchor);
              }}
            >
              <code className="rk-error-row-engine">{e.engine}</code>
              <span className="rk-error-row-msg">{e.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Main body ── */}
      <div className="rk-artifact-stage">
        {compare ? (
          <div className="rk-compare-split">
            <div className="rk-compare-pane">
              <div className="rk-compare-pane-head">v{compare.leftRev}（基准）</div>
              <div ref={compareLeftRef} className="rk-compare-pane-body rk-html-body">
                <BodyHtml html={compare.leftHtml} />
              </div>
            </div>
            <div className="rk-compare-pane">
              <div className="rk-compare-pane-head">
                v{compare.rightRev}（当前）
                <span className="rk-diff-legend">
                  <span className="rk-diff-chip rk-diff-added">+{compare.anchorDiff.added.length}</span>
                  <span className="rk-diff-chip rk-diff-removed">−{compare.anchorDiff.removed.length}</span>
                </span>
              </div>
              <div ref={compareRightRef} className="rk-compare-pane-body rk-html-body">
                <BodyHtml html={compare.rightHtml} />
              </div>
            </div>
          </div>
        ) : (
          <div className="rk-doc-frame">
            {/* Gutter rail */}
            <div className="rk-gutter">
              {gutterMarks.map((m) => (
                <button
                  key={m.anchor}
                  type="button"
                  className={`rk-gutter-mark${threadByAnchor.get(m.anchor)?.some((t) => t.root.id === activeCommentId) ? ' is-active' : ''}`}
                  style={{ top: `${m.top}px`, height: `${m.height}px` }}
                  onClick={() => openThreadForAnchor(m.anchor)}
                  title={`${m.count} 条评论`}
                  aria-label={`${m.count} 条评论 — ${anchorLabel.get(m.anchor) ?? m.anchor}`}
                >
                  <span className="rk-gutter-count">{m.count}</span>
                </button>
              ))}
            </div>

            <div ref={bodyRef} id="rk-main" className="rk-html-body">
              <BodyHtml html={displayedHtml} />
            </div>
          </div>
        )}
      </div>

      {/* ── Floating "+" button (hover anchor) ── */}
      {isCurrentRev && (
        <button
          ref={addBtnRef}
          type="button"
          className="rk-add-anchor-btn"
          style={{ display: 'none', position: 'fixed' }}
          onMouseEnter={() => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          }}
          onMouseLeave={() => {
            hideTimerRef.current = setTimeout(() => {
              if (addBtnRef.current) addBtnRef.current.style.display = 'none';
            }, 300);
          }}
          onClick={() => beginAdd(addBtnAnchorRef.current)}
          title="为此块加评论"
          aria-label="为此块加评论"
        >
          +
        </button>
      )}

      {/* ── Selection comment button ── */}
      {isCurrentRev && selectionBtn && (
        <button
          type="button"
          className="rk-add-selection-btn"
          style={{
            position: 'fixed',
            top: `${selectionBtn.y - 36}px`,
            left: `${selectionBtn.x}px`,
          }}
          onClick={() => beginAdd(selectionBtn.anchor)}
        >
          + 评论选区
        </button>
      )}

      {/* ── Comment panel ── */}
      <aside className="rk-thread-panel" aria-label="评论面板">
        <div className="rk-thread-panel-head">
          <span className="rk-thread-panel-title">
            评论
            {threads.length > 0 && <span className="rk-thread-panel-count">{threads.length}</span>}
          </span>
          <div className="rk-thread-panel-actions">
            <button
              type="button"
              className="rk-thread-panel-close"
              onClick={() => setPanelOpen(false)}
              aria-label="收起面板"
            >
              ›
            </button>
          </div>
        </div>

        <div className="rk-thread-panel-body">
          {/* Standalone "new comment" draft (anchor-targeted, no parent) */}
          {addingForAnchor && !replyingToId && (
            <DraftCard
              label={anchorLabel.get(addingForAnchor) || addingForAnchor}
              text={draftText}
              onText={setDraftText}
              onCancel={cancelDraft}
              onSubmit={submitDraft}
              submitting={submitting}
            />
          )}

          {threads.length === 0 && !addingForAnchor && (
            <p className="rk-thread-empty">
              悬停文档块点击 + 或选中文本加评论。
              <br />
              快捷键：<kbd>j/k</kbd> 切换 · <kbd>r</kbd> 解决 · <kbd>c</kbd> 回复
            </p>
          )}

          {threads.map((t) => (
            <ThreadCard
              key={t.root.id}
              thread={t}
              isActive={activeCommentId === t.root.id}
              isEditing={editingId === t.root.id}
              editText={editText}
              onEditText={setEditText}
              onActivate={() => {
                setActiveCommentId(t.root.id);
                scrollToAnchor(t.root.anchor, t.root.id);
              }}
              onReply={() => beginReply(t.root.id)}
              onEdit={() => startEdit(t.root)}
              onCancelEdit={() => {
                setEditingId(null);
                setEditText('');
              }}
              onSaveEdit={() => saveEdit(t.root.id)}
              onTransition={(s) => transitionStatus(t.root.id, s)}
              anchorLabel={anchorLabel.get(t.root.anchor) || t.root.anchor}
              showReplyDraft={replyingToId === t.root.id}
              replyText={draftText}
              onReplyText={setDraftText}
              onReplySubmit={submitDraft}
              onReplyCancel={cancelDraft}
              submitting={submitting}
            />
          ))}
        </div>
      </aside>

      <Script src="/rk/components.js" strategy="afterInteractive" />
    </div>
  );
}

/* ── Draft card (new top-level comment) ───────────────────── */
function DraftCard({
  label,
  text,
  onText,
  onCancel,
  onSubmit,
  submitting,
}: {
  label: string;
  text: string;
  onText: (s: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div className="rk-thread-draft">
      <div className="rk-thread-draft-anchor">{label}</div>
      <textarea
        className="rk-thread-draft-text"
        placeholder="写下评论… (⌘↩ 提交 · Esc 取消)"
        value={text}
        // biome-ignore lint/a11y/noAutofocus: user-initiated focus
        autoFocus
        onChange={(e) => onText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') onSubmit();
          if (e.key === 'Escape') onCancel();
        }}
        rows={3}
      />
      <div className="rk-thread-draft-actions">
        <button type="button" onClick={onCancel}>取消</button>
        <button
          type="button"
          className="is-primary"
          disabled={submitting || !text.trim()}
          onClick={onSubmit}
        >
          {submitting ? '…' : '发送'}
        </button>
      </div>
    </div>
  );
}

/* ── Thread card (root + replies + actions) ───────────────── */
function ThreadCard(props: {
  thread: Thread;
  isActive: boolean;
  isEditing: boolean;
  editText: string;
  onEditText: (s: string) => void;
  onActivate: () => void;
  onReply: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onTransition: (s: CommentStatus) => void;
  anchorLabel: string;
  showReplyDraft: boolean;
  replyText: string;
  onReplyText: (s: string) => void;
  onReplySubmit: () => void;
  onReplyCancel: () => void;
  submitting: boolean;
}) {
  const { thread, isActive, anchorLabel } = props;
  const root = thread.root;
  const status = root.status;

  return (
    <div
      className={`rk-thread${isActive ? ' is-active' : ''} is-${status}`}
      onClick={props.onActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          props.onActivate();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="rk-thread-head">
        <span
          className="rk-thread-status"
          style={{ background: STATUS_COLOR[status] }}
          title={STATUS_LABEL[status]}
        />
        <span className="rk-thread-quote">{anchorLabel}</span>
        <span className="rk-thread-author">{root.author === 'agent' ? '🤖' : '👤'}</span>
      </div>

      {props.isEditing ? (
        <div className="rk-thread-edit">
          <textarea
            className="rk-thread-edit-text"
            value={props.editText}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => props.onEditText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') props.onSaveEdit();
              if (e.key === 'Escape') props.onCancelEdit();
            }}
            rows={3}
          />
          <div className="rk-thread-edit-actions">
            <button type="button" onClick={(e) => { e.stopPropagation(); props.onCancelEdit(); }}>
              取消
            </button>
            <button
              type="button"
              className="is-primary"
              onClick={(e) => { e.stopPropagation(); props.onSaveEdit(); }}
              disabled={props.submitting || !props.editText.trim()}
            >
              保存
            </button>
          </div>
        </div>
      ) : (
        <p className="rk-thread-text">{root.text}</p>
      )}

      {thread.replies.map((r) => (
        <div key={r.id} className="rk-thread-reply">
          <span className="rk-thread-reply-author">{r.author === 'agent' ? '🤖' : '👤'}</span>
          <p className="rk-thread-reply-text">{r.text}</p>
        </div>
      ))}

      {props.showReplyDraft && (
        <div className="rk-thread-reply-draft" onClick={(e) => e.stopPropagation()}>
          <textarea
            placeholder="回复… (⌘↩ 提交 · Esc 取消)"
            value={props.replyText}
            // biome-ignore lint/a11y/noAutofocus: user-initiated reply focus
            autoFocus
            onChange={(e) => props.onReplyText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') props.onReplySubmit();
              if (e.key === 'Escape') props.onReplyCancel();
            }}
            rows={2}
          />
          <div className="rk-thread-edit-actions">
            <button type="button" onClick={(e) => { e.stopPropagation(); props.onReplyCancel(); }}>
              取消
            </button>
            <button
              type="button"
              className="is-primary"
              onClick={(e) => { e.stopPropagation(); props.onReplySubmit(); }}
              disabled={props.submitting || !props.replyText.trim()}
            >
              发送
            </button>
          </div>
        </div>
      )}

      <div className="rk-thread-foot">
        <span className="rk-thread-time">
          {new Date(root.createdAt).toLocaleString('zh-CN', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        <div className="rk-thread-actions" onClick={(e) => e.stopPropagation()}>
          {status === 'open' && (
            <>
              <button type="button" onClick={() => props.onTransition('addressed')}>
                标记待验收
              </button>
              <button type="button" className="is-primary" onClick={() => props.onTransition('resolved')}>
                解决
              </button>
            </>
          )}
          {status === 'addressed' && (
            <>
              <button type="button" onClick={() => props.onTransition('open')}>重开</button>
              <button type="button" className="is-primary" onClick={() => props.onTransition('resolved')}>
                验收
              </button>
            </>
          )}
          {status === 'resolved' && (
            <button type="button" onClick={() => props.onTransition('open')}>重开</button>
          )}
          <button type="button" onClick={props.onReply}>回复</button>
          {!props.isEditing && (
            <button type="button" onClick={props.onEdit}>编辑</button>
          )}
        </div>
      </div>
    </div>
  );
}
