'use client';

import Script from 'next/script';
import { useCallback, useMemo, useState } from 'react';

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
  selector?: { exact: string } | null;
}

interface HtmlArtifactViewProps {
  artifactId: string;
  processedHtml: string;
  anchors: HtmlAnchor[];
  comments: HtmlComment[];
}

export default function HtmlArtifactView({
  artifactId,
  processedHtml,
  anchors,
  comments: initialComments,
}: HtmlArtifactViewProps) {
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState<HtmlComment[]>(initialComments);

  const commentsByAnchor = useMemo(() => {
    const map = new Map<string, HtmlComment[]>();
    for (const c of localComments) {
      if (c.status === 'open') {
        const list = map.get(c.blockId) ?? [];
        list.push(c);
        map.set(c.blockId, list);
      }
    }
    return map;
  }, [localComments]);

  const activeComments = activeAnchor ? (commentsByAnchor.get(activeAnchor) ?? []) : [];

  const submitComment = useCallback(async () => {
    if (!activeAnchor || !commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/artifacts/${artifactId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId: activeAnchor, text: commentText.trim() }),
      });
      const data = await res.json();
      if (data.ok && data.comment) {
        setLocalComments((prev) => [
          ...prev,
          {
            id: data.comment.id,
            blockId: activeAnchor,
            text: data.comment.text,
            status: 'open',
            createdAt: data.comment.createdAt ?? new Date().toISOString(),
          },
        ]);
        setCommentText('');
      }
    } finally {
      setSubmitting(false);
    }
  }, [activeAnchor, commentText, artifactId]);

  return (
    <div className="rk-page" data-rk-theme="paper-light">
      <link rel="stylesheet" href="/rk/theme.css" />
      <link rel="stylesheet" href="/rk/components.css" />

      <div className="rk-html-layout">
        {/* 主体文档 */}
        <main className="rk-html-body">
          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: server-processed HTML */}
          <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
        </main>

        {/* 右侧评论 rail */}
        <aside className="rk-comment-rail">
          {anchors.map((a) => {
            const count = commentsByAnchor.get(a.anchor)?.length ?? 0;
            const isActive = activeAnchor === a.anchor;
            return (
              <button
                key={a.id}
                type="button"
                className={`rk-rail-dot${count > 0 ? ' has-comments' : ''}${isActive ? ' is-active' : ''}`}
                title={a.textPreview ?? a.anchor}
                onClick={() => setActiveAnchor(isActive ? null : a.anchor)}
              >
                {count > 0 ? count : '+'}
              </button>
            );
          })}
        </aside>
      </div>

      {/* 评论面板 — 简洁的固定右侧抽屉 */}
      {activeAnchor && (
        <div className="rk-comment-panel">
          <div className="rk-comment-panel__header">
            <span className="rk-comment-panel__anchor">{activeAnchor}</span>
            <button
              type="button"
              className="rk-comment-panel__close"
              onClick={() => setActiveAnchor(null)}
            >
              ✕
            </button>
          </div>

          <div className="rk-comment-panel__list">
            {activeComments.length === 0 && (
              <p className="rk-comment-panel__empty">暂无评论</p>
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
              placeholder="写评论… (Cmd+Enter 提交)"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment();
              }}
              rows={3}
            />
            <button
              type="button"
              className="rk-comment-panel__submit"
              onClick={submitComment}
              disabled={submitting || !commentText.trim()}
            >
              {submitting ? '…' : '提交'}
            </button>
          </div>
        </div>
      )}

      <Script src="/rk/components.js" strategy="afterInteractive" />
    </div>
  );
}
