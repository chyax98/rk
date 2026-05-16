export default function StatBlock({ label, value, delta, tone = 'neutral', caption }) {
  return (
    <div className="rk-stat-block" data-tone={tone}>
      {label && <div className="rk-stat-label">{label}</div>}
      <div className="rk-stat-main">
        <div className="rk-stat-value">{value}</div>
        {delta && <div className="rk-stat-delta">{delta}</div>}
      </div>
      {caption && <div className="rk-stat-caption">{caption}</div>}
    </div>
  );
}
