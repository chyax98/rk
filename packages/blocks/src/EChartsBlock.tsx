import { useEffect, useRef, useState } from 'react';

export default function EChartsBlock({ code, caption, variant = 'auto' }) {
  const ref = useRef(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let chart;
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
        if (alive) setErr(String(e.message || e));
      }
    }
    let cleanup;
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

function parseEChartsOption(code, variant) {
  const text = String(code || '').trim();
  if (!text) throw new Error('empty ECharts source');
  try { return JSON.parse(text); } catch {}

  const table = parseDelimited(text);
  if (table.rows.length === 0) throw new Error('expected JSON option or CSV-like chart data');
  const headers = table.headers;
  const type = variant && variant !== 'auto' ? variant : inferType(headers, table.rows);

  if (type === 'pie') {
    const labelKey = headers[0];
    const valueKey = headers[1] || 'value';
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, type: 'scroll' },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        data: table.rows.map(row => ({ name: row[labelKey], value: numberish(row[valueKey]) }))
      }]
    };
  }

  const xKey = headers[0];
  const valueKeys = headers.slice(1);
  return {
    tooltip: { trigger: 'axis' },
    legend: { top: 0, type: 'scroll' },
    grid: { top: 44, right: 24, bottom: 36, left: 48, containLabel: true },
    xAxis: { type: 'category', data: table.rows.map(row => row[xKey]) },
    yAxis: { type: 'value' },
    series: valueKeys.map(key => ({
      name: key,
      type: type === 'line' ? 'line' : 'bar',
      smooth: type === 'line',
      emphasis: { focus: 'series' },
      data: table.rows.map(row => numberish(row[key]))
    }))
  };
}

function parseDelimited(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean).filter(l => !l.startsWith('#'));
  if (lines.length < 2) return { headers: [], rows: [] };
  const delimiter = lines[0].includes('|') ? '|' : lines[0].includes('\t') ? '\t' : ',';
  const headers = splitLine(lines[0], delimiter);
  const rows = lines.slice(1).map(line => splitLine(line, delimiter)).filter(parts => parts.length).map(parts => {
    const row = {};
    headers.forEach((header, i) => { row[header] = parts[i] ?? ''; });
    return row;
  });
  return { headers, rows };
}

function splitLine(line, delimiter) {
  const raw = delimiter === '|' ? line.replace(/^\|/, '').replace(/\|$/, '').split('|') : line.split(delimiter);
  return raw.map(part => part.trim()).filter((part, i, arr) => part || i < arr.length - 1);
}

function inferType(headers, rows) {
  if (headers.length === 2 && rows.length <= 8) return 'pie';
  return 'bar';
}

function numberish(value) {
  const n = Number(String(value ?? '').replace(/[%_,]/g, ''));
  return Number.isFinite(n) ? n : value;
}
