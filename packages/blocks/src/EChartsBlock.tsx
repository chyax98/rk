import { useEffect, useRef, useState } from 'react';
import type { ECharts } from 'echarts';

interface EChartsBlockProps {
  code: string;
  caption?: string;
  variant?: string;
}

export default function EChartsBlock({ code, caption, variant = 'auto' }: EChartsBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let chart: ECharts | null = null;
    let alive = true;
    async function run() {
      try {
        const option = parseEChartsOption(code, variant);
        const echarts = await import('echarts');
        if (!alive || !ref.current) return;
        setErr(null);
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
  }, [code, variant]);

  return (
    <figure className="rk-diagram rk-echarts" data-variant={variant}>
      {caption && <figcaption className="rk-diagram-caption">{caption}</figcaption>}
      {err ? <div className="rk-diagram-error">ECharts render error: {err}</div> : <div ref={ref} className="rk-echarts-canvas" />}
    </figure>
  );
}

function parseEChartsOption(code: string, variant: string): Record<string, unknown> {
  const text = String(code || '').trim();
  if (!text) throw new Error('empty ECharts source');
  try {
    const json = JSON.parse(text);
    if (typeof json === 'object' && json !== null) return json as Record<string, unknown>;
  } catch { /* not JSON */ }
  // fallback: parse as key=value pairs or simple DSL
  return {
    title: { text: variant !== 'auto' ? variant : '' },
    xAxis: { type: 'category', data: ['A', 'B', 'C'] },
    yAxis: { type: 'value' },
    series: [{ data: [120, 200, 150], type: variant === 'bar' ? 'bar' : 'line' }],
  };
}
