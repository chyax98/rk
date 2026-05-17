import { TableBlockProps } from '../types';

export default function CardsTable({ title, caption, columns = [], rows = [] }: TableBlockProps) {
  return (
    <figure className="rk-table-block rk-table-cards">
      {title && <figcaption className="rk-table-title">{title}</figcaption>}
      <div className="rk-cards-grid">
        {rows.map((row, r) => (
          <div className="rk-card-item" key={r}>
            {columns.map((col, c) => (
              <div className="rk-card-field" key={c}>
                <span className="rk-card-label">{col}</span>
                <span className="rk-card-value">{row[c] || '—'}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      {caption && <div className="rk-table-caption">{caption}</div>}
    </figure>
  );
}
