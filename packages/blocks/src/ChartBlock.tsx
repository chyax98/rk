'use client';
import { useEffect, useRef } from 'react';
import { RichText } from './utils/richText.tsx';

type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'kpi';

interface Props {
  chartType?: ChartType;
  title?: string;
  caption?: string;
  columns?: string[];
  rows?: string[][];
  template?: string;
  xField?: string;
  yField?: string;
}

export default function ChartBlock(props: Props) {
  if ((props.chartType ?? 'bar') === 'kpi') return <KpiGrid {...props} />;
  return <EChartsBlock {...props} />;
}

/* ── KPI grid ──────────────────────────────────────────── */
function KpiGrid({ title, rows = [], caption }: Props) {
  return (
    <figure className="rk-chart-kpi">
      {title && (
        <figcaption className="rk-chart-title">
          <RichText text={title} />
        </figcaption>
      )}
      <div className="rk-kpi-grid">
        {rows.map((row, i) => (
          <div key={i} className="rk-kpi-card">
            <p className="rk-kpi-label">{row[0] ?? ''}</p>
            <p className="rk-kpi-value">{row[1] ?? '—'}</p>
            {row[2] && <p className="rk-kpi-delta">{row[2]}</p>}
          </div>
        ))}
      </div>
      {caption && (
        <p className="rk-chart-caption">
          <RichText text={caption} />
        </p>
      )}
    </figure>
  );
}

/* ── ECharts block ─────────────────────────────────────── */
function EChartsBlock({ chartType = 'bar', title, caption, columns = [], rows = [] }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let instance: import('echarts').ECharts | null = null;

    import('echarts').then(({ init }) => {
      if (!ref.current) return;
      instance = init(ref.current, null, { renderer: 'svg' });
      instance.setOption(buildOption(chartType, columns, rows, title));
    });

    const ro = new ResizeObserver(() => instance?.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      instance?.dispose();
    };
  }, [chartType, title, columns, rows]);

  return (
    <figure className="rk-chart">
      <div ref={ref} className="rk-chart-container" />
      {caption && (
        <figcaption className="rk-chart-caption">
          <RichText text={caption} />
        </figcaption>
      )}
    </figure>
  );
}

/* ── Option builders ───────────────────────────────────── */
function buildOption(type: ChartType, columns: string[], rows: string[][], title?: string) {
  const names = rows.map((r) => r[0] ?? '');
  const values = rows.map((r) => Number(r[1]) || 0);

  const base = {
    title: title ? { text: title, textStyle: { fontSize: 13, fontWeight: 600 } } : undefined,
    tooltip: { trigger: type === 'pie' ? 'item' : 'axis' },
    animation: true,
  };

  if (type === 'pie') {
    return {
      ...base,
      series: [
        {
          type: 'pie',
          radius: '65%',
          data: rows.map((r) => ({ name: r[0] ?? '', value: Number(r[1]) || 0 })),
        },
      ],
    };
  }
  if (type === 'scatter') {
    return {
      ...base,
      xAxis: { type: 'value', name: columns[0] ?? 'x' },
      yAxis: { type: 'value', name: columns[1] ?? 'y' },
      series: [{ type: 'scatter', data: rows.map((r) => [Number(r[0]) || 0, Number(r[1]) || 0]) }],
    };
  }
  return {
    ...base,
    xAxis: { type: 'category', data: names },
    yAxis: { type: 'value' },
    series: [{ type, data: values, smooth: type === 'line' }],
  };
}
