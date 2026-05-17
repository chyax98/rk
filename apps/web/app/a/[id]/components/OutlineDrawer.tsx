'use client';

interface OutlineItem {
  id: string;
  type: string;
  label: string;
}

interface OutlineDrawerProps {
  items: OutlineItem[];
  selected: string | null;
  commentCounts: Record<string, number>;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export default function OutlineDrawer({ items, selected, commentCounts, onSelect, onClose }: OutlineDrawerProps) {
  const headings = items.filter(i => i.type === 'heading');
  const others = items.filter(i => i.type !== 'heading');

  return (
    <aside className="rk-outline-drawer">
      <div className="rk-drawer-head">
        <span>目录</span>
        <button onClick={onClose}>×</button>
      </div>
      <nav className="rk-outline-list">
        {headings.map(item => (
          <button
            key={item.id}
            onClick={() => {
              onSelect(item.id);
              document.getElementById(`rk-block-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className={selected === item.id ? 'is-active' : ''}
          >
            <span>{item.label}</span>
            {(commentCounts[item.id] || 0) > 0 && <b>{commentCounts[item.id]}</b>}
          </button>
        ))}
        {others.length > 0 && headings.length > 0 && (
          <div className="rk-outline-divider" />
        )}
        {others.map(item => (
          <button
            key={item.id}
            onClick={() => {
              onSelect(item.id);
              document.getElementById(`rk-block-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className={`rk-outline-secondary${selected === item.id ? ' is-active' : ''}`}
          >
            <span>{item.label}</span>
            {(commentCounts[item.id] || 0) > 0 && <b>{commentCounts[item.id]}</b>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
