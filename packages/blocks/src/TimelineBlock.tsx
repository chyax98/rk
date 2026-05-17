import { RichText } from './utils/richText.tsx';

interface TimelineItem {
  label: string;
  body?: string;
  status?: 'done' | 'active' | 'next' | string;
  tags?: string[];
}

interface Props {
  title?: string;
  items?: TimelineItem[];
}

export default function TimelineBlock({ title, items = [] }: Props) {
  return (
    <section className="rk-timeline-block">
      {title && <h3 className="rk-timeline-heading"><RichText text={title} /></h3>}
      <div className="rk-timeline">
        {items.map((item, i) => {
          const done = item.status === 'done';
          const active = item.status === 'active';
          return (
            <article key={i} className={`rk-step${done ? ' is-done' : active ? ' is-active' : ''}`}>
              <div className="rk-step-num" aria-label={`步骤 ${i + 1}`}>{done ? '✓' : i + 1}</div>
              <div className="rk-step-body">
                <h4 className="rk-step-title"><RichText text={item.label} /></h4>
                {item.body && <p className="rk-step-desc"><RichText text={item.body} /></p>}
                {item.tags && item.tags.length > 0 && (
                  <div className="rk-step-tags">
                    {item.tags.map((tag, j) => <span key={j} className="rk-tag">{tag}</span>)}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
