import { useEffect, useRef, useState } from 'react';

export default function EChartsBlock({ code, caption }) {
  const ref = useRef(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let chart;
    let alive = true;
    async function run() {
      try {
        const option = JSON.parse(code);
        const echarts = await import('echarts');
        if (!alive || !ref.current) return;
        chart = echarts.init(ref.current, null, { renderer: 'svg' });
        chart.setOption(option);
      } catch (e) {
        if (alive) setErr(String(e.message || e));
      }
    }
    run();
    return () => { alive = false; chart?.dispose?.(); };
  }, [code]);

  return (
    <figure className="rk-diagram rk-echarts">
      {caption && <figcaption className="rk-diagram-caption">{caption}</figcaption>}
      {err ? <div className="rk-diagram-error">ECharts render error: {err}</div> : <div ref={ref} className="rk-echarts-canvas" />}
    </figure>
  );
}
