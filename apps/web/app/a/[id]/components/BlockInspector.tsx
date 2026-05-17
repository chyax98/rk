'use client';
import { Fragment } from 'react';
import CommentCard from './CommentCard';
import CommentInput from './CommentInput';
import type { Comment } from '../hooks/useComments';
import type { QuoteAnchor } from '../hooks/useSelection';

interface BlockInspectorProps {
  block: { id: string; type: string; props: Record<string, any>; sourceRange?: { startLine: number; endLine: number }; sourceExcerpt?: string };
  comments: Comment[];
  text: string;
  setText: (t: string) => void;
  submitComment: () => void;
  quoteAnchor: QuoteAnchor | null;
  setCommentStatus: (id: string, status: string) => void;
}

export default function BlockInspector({ block, comments, text, setText, submitComment, quoteAnchor, setCommentStatus }: BlockInspectorProps) {
  return (
    <>
      <div className="rk-drawer-section">
        <div className="rk-drawer-label">当前块</div>
        <span className="rk-type-chip">{block.type}</span>
        {block.props?.title && <span style={{ marginLeft: 8 }}>{block.props.title}</span>}
      </div>

      <details className="rk-drawer-section rk-agent-metadata">
        <summary>Agent 元数据</summary>
        <div className="rk-drawer-label">Block ID</div>
        <code>{block.id}</code>
        {block.sourceRange && (
          <>
            <div className="rk-drawer-label">源文件位置</div>
            <div className="rk-source-range">第 {block.sourceRange.startLine}–{block.sourceRange.endLine} 行</div>
            {block.sourceExcerpt && <pre className="rk-source-excerpt">{block.sourceExcerpt}</pre>}
          </>
        )}
        <div className="rk-drawer-label">属性</div>
        <div className="rk-props-grid">
          {Object.entries(block.props || {}).map(([k, v]) => (
            <Fragment key={k}>
              <span className="rk-meta-key">{k}</span>
              <span className="rk-meta-val">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
            </Fragment>
          ))}
        </div>
      </details>

      <div className="rk-drawer-section">
        <div className="rk-drawer-label">此块上的评论</div>
        {quoteAnchor?.blockId === block.id && (
          <div className="rk-quote-anchor">
            <div className="rk-drawer-label">选中的文本</div>
            <blockquote>{quoteAnchor.selector.exact}</blockquote>
          </div>
        )}
        {comments.length === 0
          ? <p className="rk-muted rk-small">暂无评论。</p>
          : comments.map(c => <CommentCard key={c.id} comment={c} setCommentStatus={setCommentStatus} />)}
        <CommentInput text={text} setText={setText} onSubmit={submitComment} />
      </div>
    </>
  );
}
