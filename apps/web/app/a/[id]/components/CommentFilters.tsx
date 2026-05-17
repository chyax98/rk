'use client';

const STATUS_LABELS: Record<string, string> = {
  open: '待处理',
  resolved: '已解决',
  orphaned: '已失效',
};

interface CommentFiltersProps {
  active: string;
  setActive: (s: string) => void;
  counts: { all: number; open: number; resolved: number; orphaned: number };
}

export default function CommentFilters({ active, setActive, counts }: CommentFiltersProps) {
  const labels: Record<string, string> = {
    open: '待处理',
    resolved: '已解决',
    orphaned: '已失效',
    all: '全部',
  };
  return (
    <div className="rk-comment-filters" aria-label="评论筛选">
      {(['open', 'orphaned', 'resolved', 'all'] as const).map((status) => (
        <button
          key={status}
          type="button"
          className={active === status ? 'is-active' : ''}
          onClick={() => setActive(status)}
        >
          {labels[status]} <span className="rk-filter-count">{counts[status] || 0}</span>
        </button>
      ))}
    </div>
  );
}
