import { RichText } from './utils/richText.tsx';

interface Props {
  title?: string;
  caption?: string;
  columns?: string[];
  rows?: string[][];
  /** 'proscons' layout (2-col green/red) vs 'matrix' (N-col) */
  variant?: 'proscons' | 'matrix';
}

const PROSCONS_TONES = ['pros', 'cons'];

export default function ComparisonBlock({
  title,
  caption,
  columns = [],
  rows = [],
  variant,
}: Props) {
  const safeColumns = columns.length ? columns : ['方案 A', '方案 B'];
  const isProscons =
    variant === 'proscons' || (safeColumns.length === 2 && /优点|pros|✓/i.test(safeColumns[0]));

  if (isProscons) {
    return (
      <section className="rk-comparison-block rk-proscons">
        {(title || caption) && (
          <header className="rk-block-header">
            {title && (
              <h3 className="rk-block-title">
                <RichText text={title} />
              </h3>
            )}
            {caption && (
              <p className="rk-block-caption">
                <RichText text={caption} />
              </p>
            )}
          </header>
        )}
        <div className="rk-proscons-grid">
          {safeColumns.map((col, ci) => {
            const tone = PROSCONS_TONES[ci] ?? 'neutral';
            return (
              <div key={ci} className={`rk-proscons-col rk-proscons-${tone}`}>
                <h4 className="rk-proscons-heading">{col}</h4>
                <ul className="rk-proscons-list">
                  {rows.map((row, ri) =>
                    row[ci] ? (
                      <li key={ri}>
                        <RichText text={row[ci]} />
                      </li>
                    ) : null,
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="rk-comparison-block rk-comparison-matrix">
      {(title || caption) && (
        <header className="rk-block-header">
          {title && (
            <h3 className="rk-block-title">
              <RichText text={title} />
            </h3>
          )}
          {caption && (
            <p className="rk-block-caption">
              <RichText text={caption} />
            </p>
          )}
        </header>
      )}
      <div
        className="rk-comparison-grid"
        style={{ gridTemplateColumns: `repeat(${safeColumns.length}, minmax(0, 1fr))` }}
      >
        {safeColumns.map((col, ci) => (
          <article key={ci} className="rk-comparison-col">
            <h4 className="rk-comparison-col-title">{col}</h4>
            <ul>
              {rows.map((row, ri) =>
                row[ci] ? (
                  <li key={ri}>
                    <RichText text={row[ci]} />
                  </li>
                ) : null,
              )}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
