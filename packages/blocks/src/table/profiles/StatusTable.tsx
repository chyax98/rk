import { TableBlockProps } from '../types';

const STATUS_COLORS: Record<string, string> = {
  '🔴': 'critical', 'red': 'critical', 'critical': 'critical', '✗': 'critical', 'no': 'critical', 'blocked': 'critical',
  '🟡': 'warning', 'yellow': 'warning', 'warning': 'warning', 'in progress': 'warning', 'wip': 'warning', 'pending': 'warning',
  '🟢': 'success', 'green': 'success', 'success': 'success', 'done': 'success', '✓': 'success', 'closed': 'success', 'complete': 'success', 'yes': 'success',
  'open': 'neutral', 'todo': 'neutral', 'blue': 'neutral',
};

function statusTone(val: string): string {
  const v = val.trim().toLowerCase();
  for (const [key, tone] of Object.entries(STATUS_COLORS)) {
    if (v.includes(key)) return tone;
  }
  return 'neutral';
}

export default function StatusTable({ title, caption, columns = [], rows = [], align = [] }: TableBlockProps) {
  return (
    <figure className="rk-table-block rk-table-status">
      {title && <figcaption className="rk-table-title">{title}</figcaption>}
      <div className="rk-table-scroll">
        <table>
          <thead>
            <tr>{columns.map((col, i) => <th key={i} data-align={align[i] || 'left'}>{col}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>{columns.map((_, c) => {
                const val = row[c] || '';
                const isFirstCol = c === 0;
                return (
                  <td key={c} data-align={align[c] || 'left'}>
                    {isFirstCol
                      ? <span className="rk-status-badge" data-tone={statusTone(val)}>{val}</span>
                      : val
                    }
                  </td>
                );
              })}</tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && <div className="rk-table-caption">{caption}</div>}
    </figure>
  );
}
