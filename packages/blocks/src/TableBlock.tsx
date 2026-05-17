export default function TableBlock({ title, caption, columns = [], rows = [], align = [] }) {
  return (
    <figure className="rk-table-block">
      {title && <figcaption className="rk-table-title">{title}</figcaption>}
      <div className="rk-table-scroll">
        <table>
          <thead>
            <tr>{columns.map((col, i) => <th key={i} data-align={align[i] || 'left'}>{col}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>{columns.map((_, c) => <td key={c} data-align={align[c] || 'left'}>{row[c]}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && <div className="rk-table-caption">{caption}</div>}
    </figure>
  );
}
