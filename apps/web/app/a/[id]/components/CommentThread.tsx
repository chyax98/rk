'use client';
import CommentCard from './CommentCard';
import CommentFilters from './CommentFilters';
import type { Comment } from '../hooks/useComments';

interface CommentThreadProps {
  comments: Comment[];
  commentFilter: string;
  setCommentFilter: (s: string) => void;
  setSelected: (id: string | null) => void;
  setDrawerMode: (m: string) => void;
  setCommentStatus: (id: string, status: string) => void;
}

function countCommentsByStatus(comments: Comment[]) {
  return {
    all: comments.length,
    open: comments.filter(c => c.status === 'open').length,
    resolved: comments.filter(c => c.status === 'resolved').length,
    orphaned: comments.filter(c => c.status === 'orphaned').length,
  };
}

export default function CommentThread({
  comments, commentFilter, setCommentFilter,
  setSelected, setDrawerMode, setCommentStatus,
}: CommentThreadProps) {
  const counts = countCommentsByStatus(comments);
  const filtered = comments.filter(c => commentFilter === 'all' || c.status === commentFilter);

  return (
    <>
      <CommentFilters active={commentFilter} setActive={setCommentFilter} counts={counts} />
      <div className="rk-drawer-section">
        {filtered.length === 0
          ? <p className="rk-muted rk-small">当前筛选下没有评论。</p>
          : filtered.map(c => (
            <CommentCard
              key={c.id}
              comment={c}
              onClick={() => { setSelected(c.blockId); setDrawerMode('block'); }}
              setCommentStatus={setCommentStatus}
            />
          ))}
      </div>
    </>
  );
}
