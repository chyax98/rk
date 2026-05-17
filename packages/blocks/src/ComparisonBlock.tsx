interface ComparisonBlockProps {
  title?: string;
  caption?: string;
  columns?: string[];
  rows?: string[][];
}

export default function ComparisonBlock({ title, caption, columns = [], rows = [] }: ComparisonBlockProps) {
  const safeColumns = columns.length ? columns : ['Before', 'After'];
  return (
    <section className="rk-comparison-block">
      {(title || caption) && (
        <header className="rk-comparison-header">
          {title && <h3>{title}</h3>}
          {caption && <p>{caption}</p>}
        </header>
      )}
      <div className="rk-comparison-grid" style={{ gridTemplateColumns: `repeat(${safeColumns.length}, minmax(0, 1fr))` }}>
        {safeColumns.map((column, i) => (
          <article key={column || i} className="rk-comparison-column">
            <div className="rk-comparison-column-title">{column}</div>
            <ul>
              {(rows || []).map((row, rowIndex) => (
                <li key={rowIndex}>{row[i] || '—'}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
