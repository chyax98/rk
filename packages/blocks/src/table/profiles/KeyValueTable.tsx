import { TableBlockProps } from '../types';

export default function KeyValueTable({ title, caption, columns = [], rows = [] }: TableBlockProps) {
  return (
    <figure className="rk-table-block rk-table-key-value">
      {title && <figcaption className="rk-table-title">{title}</figcaption>}
      <dl className="rk-kv-list">
        {rows.map((row, r) => (
          <div className="rk-kv-row" key={r}>
            <dt className="rk-kv-key">{row[0] || columns[0] || ''}</dt>
            <dd className="rk-kv-value">{row[1] || ''}</dd>
          </div>
        ))}
      </dl>
      {caption && <div className="rk-table-caption">{caption}</div>}
    </figure>
  );
}
