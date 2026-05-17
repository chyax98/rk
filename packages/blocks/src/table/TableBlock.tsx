import { TableBlockProps, TableProfile } from './types';
import MatrixTable from './profiles/MatrixTable';
import StatusTable from './profiles/StatusTable';
import KeyValueTable from './profiles/KeyValueTable';
import CardsTable from './profiles/CardsTable';
import CompactTable from './profiles/CompactTable';

const PROFILE_MAP: Record<TableProfile, React.ComponentType<TableBlockProps>> = {
  'matrix': MatrixTable,
  'status': StatusTable,
  'key-value': KeyValueTable,
  'cards': CardsTable,
  'compact': CompactTable,
};

function inferProfile(props: TableBlockProps): TableProfile {
  if (props.columns.length === 2) return 'key-value';
  // Check if first column looks like status
  if (props.rows.length > 0) {
    const firstVals = props.rows.map(r => (r[0] || '').trim().toLowerCase());
    const statusHints = ['✓', '✗', '🔴', '🟡', '🟢', 'done', 'open', 'closed', 'blocked', 'in progress', 'todo', 'wip'];
    if (firstVals.some(v => statusHints.some(h => v.includes(h)))) return 'status';
  }
  if (props.rows.length > 8 && props.columns.length <= 3) return 'cards';
  return 'matrix';
}

export default function TableBlock(props: TableBlockProps) {
  const profile: TableProfile = (props.profile as TableProfile) || inferProfile(props);
  const Component = PROFILE_MAP[profile] || MatrixTable;
  return <Component {...props} />;
}
