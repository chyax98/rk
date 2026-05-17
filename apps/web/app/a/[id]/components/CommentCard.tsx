'use client';
import type { Comment } from '../hooks/useComments';

const STATUS_LABELS: Record<string, string> = {
  open: '待处理',
  resolved: '已解决',
  orphaned: '已失效',
};

interface CommentCardProps {
  comment: Comment;
  onClick?: () => void;
  setCommentStatus?: (id: string, status: string) => void;
}

export default function CommentCard({ comment: c, onClick, setCommentStatus }: CommentCardProps) {
  return (
    <div
      className={`rk-comment-card${onClick ? ' rk-clickable' : ''}`}
      data-status={c.status}
      data-block-id={c.blockId}
      onClick={onClick}
    >
      <div className="rk-comment-header">
        <span className="rk-pill" data-status={c.status}>
          {STATUS_LABELS[c.status] || c.status}
        </span>
      </div>
      {c.selector?.exact && (
        <blockquote className="rk-comment-quote">{c.selector.exact}</blockquote>
      )}
      <p>{c.text}</p>
      <div className="rk-comment-actions">
        {setCommentStatus && c.status !== 'orphaned' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCommentStatus(c.id, c.status === 'resolved' ? 'open' : 'resolved');
            }}
          >
            {c.status === 'resolved' ? '重新打开' : '解决'}
          </button>
        )}
      </div>
    </div>
  );
}
