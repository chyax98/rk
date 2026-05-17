interface TimelineItem {
  status?: string;
  label: string;
  body?: string;
}

interface TimelineBlockProps {
  title?: string;
  items?: TimelineItem[];
}

export default function TimelineBlock({ title, items = [] }: TimelineBlockProps) {
  return (
    <section className="rk-timeline-block">
      {title && <h3>{title}</h3>}
      <ol className="rk-timeline-items">
        {(items || []).map((item, i) => (
          <li key={i} data-status={item.status || 'next'}>
            <span className="rk-timeline-dot" aria-hidden="true" />
            <div className="rk-timeline-card">
              <div className="rk-timeline-meta">{item.status || 'next'}</div>
              <div className="rk-timeline-label">{item.label}</div>
              {item.body && <p>{item.body}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
