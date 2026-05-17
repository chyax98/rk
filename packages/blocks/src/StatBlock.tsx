import { RichText } from './utils/richText.tsx';

interface Props {
  label?: string;
  value: string;
  unit?: string;
  delta?: string;
  deltaDir?: 'up' | 'down' | 'neutral';
  caption?: string;
  tone?: 'positive' | 'negative' | 'neutral' | 'warning' | string;
}

function DeltaIcon({ dir }: { dir: string }) {
  if (dir === 'up')   return <span className="rk-stat-delta-icon" aria-hidden="true">↑</span>;
  if (dir === 'down') return <span className="rk-stat-delta-icon" aria-hidden="true">↓</span>;
  return null;
}

function inferDeltaDir(delta?: string): 'up' | 'down' | 'neutral' {
  if (!delta) return 'neutral';
  if (delta.startsWith('+') || /up|增|↑/i.test(delta)) return 'up';
  if (delta.startsWith('-') || /down|减|↓/i.test(delta)) return 'down';
  return 'neutral';
}

export default function StatBlock({ label, value, unit, delta, deltaDir, caption, tone = 'neutral' }: Props) {
  const dir = deltaDir || inferDeltaDir(delta);
  return (
    <div className={`rk-stat-block rk-stat-${tone}`} role="figure" aria-label={label}>
      {label && <p className="rk-stat-label">{label}</p>}
      <div className="rk-stat-main">
        <span className="rk-stat-value">{value}</span>
        {unit && <span className="rk-stat-unit">{unit}</span>}
      </div>
      {delta && (
        <div className={`rk-stat-delta rk-delta-${dir}`}>
          <DeltaIcon dir={dir} />
          <span>{delta}</span>
        </div>
      )}
      {caption && <p className="rk-stat-caption"><RichText text={caption} /></p>}
    </div>
  );
}
