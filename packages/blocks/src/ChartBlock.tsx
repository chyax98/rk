import { useEffect, useRef, useState } from 'react';
import type { ECharts } from 'echarts';

type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'kpi';
type ChartTemplate = 'default' | 'minimal' | 'report';

interface ChartBlockProps {
  chartType: ChartType;
  template?: ChartTemplate;
  title?: string;
  xField?: string;
  yField?: string;
  columns: string[];
  rows: string[][];
  caption?: string;
}

export default function ChartBlock(props: ChartBlockProps) {
  if (props.chartType === 'kpi') return <KpiCard {...props} />;
  return <EChartsChart {...props} />;
}

function KpiCard({ rows, columns, title }: ChartBlockProps) {
  const items = rows.map(row => ({
    label: row[0] || columns[0] || '',
    value: row[1] || columns[1] || '',
  }));

  return (
    <figure className="rk-chart rk-chart-kpi">
      {title && <figcaption className="rk-chart-title">{title}</figcaption>}
      <div className="rk-kpi-grid">
        {items.map((item, i) => (
          <div className="rk-kpi-tile" key={i}>
            <div className="rk-kpi-value">{item.value}</div>
            <div className="rk-kpi-label">{item.label}</div>
          </div>
        ))}
      </div>
    </figure>
  );
}

function EChartsChart({ chartType, template = 'default', title, xField, yField, columns, rows, caption }: ChartBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let chart: ECharts | null = null;
    let alive = true;

    async function run() {
      try {
        const echarts = await import('echarts');
        if (!alive || !ref.current) return;
        setErr(null);

        const option = buildOption(chartType!, columns, rows, { xField, yField, title, template });
        chart = echarts.init(ref.current, null, { renderer: 'svg' });
        chart.setOption(option);
        const resize = () => chart?.resize?.();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
      } catch (e) {
        if (alive) setErr(String((e as Error).message || e));
      }
    }

    let cleanup: (() => void) | undefined;
    run().then(fn => { cleanup = fn; });
    return () => { alive = false; cleanup?.(); chart?.dispose?.(); };
  }, [chartType, template, title, xField, yField, JSON.stringify(columns), JSON.stringify(rows)]);

  return (
    <figure className="rk-chart rk-chart-echarts">
      {title && <figcaption className="rk-chart-title">{title}</figcaption>}
      {err
        ? <div className="rk-chart-error">Chart error: {err}</div>
        : <div ref={ref} className="rk-chart-canvas" />
      }
      {caption && <div className="rk-chart-caption">{caption}</div>}
    </figure>
  );
}

function buildOption(
  chartType: ChartType,
  columns: string[],
  rows: string[][],
  opts: { xField?: string; yField?: string; title?: string; template?: ChartTemplate }
): Record<string, unknown> {
  // Determine x/y column indices
  const xIdx = opts.xField ? Math.max(0, columns.indexOf(opts.xField)) : 0;
  const yIdx = opts.yField ? Math.max(0, columns.indexOf(opts.yField)) : (columns.length > 1 ? 1 : 0);

  const labels = rows.map(r => r[xIdx] || '');
  const values = rows.map(r => Number(r[yIdx]) || 0);

  const base = {
    title: opts.template !== 'minimal' && opts.title ? { text: opts.title, textStyle: { fontSize: 14 } } : undefined,
    tooltip: { trigger: 'axis' as const },
    grid: opts.template === 'report' ? { left: 60, right: 20, top: 40, bottom: 30 } : undefined,
  };

  switch (chartType) {
    case 'bar':
      return {
        ...base,
        xAxis: { type: 'category', data: labels },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: values }],
      };
    case 'line':
      return {
        ...base,
        xAxis: { type: 'category', data: labels },
        yAxis: { type: 'value' },
        series: [{ type: 'line', data: values, smooth: true }],
      };
    case 'pie':
      return {
        ...base,
        tooltip: { trigger: 'item' as const },
        series: [{
          type: 'pie',
          radius: opts.template === 'report' ? ['35%', '65%'] : '60%',
          data: labels.map((name, i) => ({ name, value: values[i] })),
        }],
      };
    case 'scatter':
      return {
        ...base,
        xAxis: { type: 'value' },
        yAxis: { type: 'value' },
        series: [{ type: 'scatter', data: rows.map(r => [Number(r[xIdx]) || 0, Number(r[yIdx]) || 0]) }],
      };
    default:
      return {
        ...base,
        xAxis: { type: 'category', data: labels },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: values }],
      };
  }
}
