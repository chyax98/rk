import { useEffect, useState } from 'react';
import MermaidDiagram from './MermaidDiagram.jsx';
import EChartsBlock from './EChartsBlock.jsx';

const SERVER_RENDERED_ENGINES = new Set(['plantuml', 'd2']);

export default function DiagramBlock({ engine = 'mermaid', code = '', caption }) {
  const normalized = String(engine || 'mermaid').toLowerCase();
  if (normalized === 'mermaid') return <MermaidDiagram code={code} caption={caption} />;
  if (normalized === 'svg') return <SvgDiagram code={code} caption={caption} />;
  if (normalized === 'echarts' || normalized.startsWith('echarts-')) return <EChartsBlock code={code} caption={caption} variant={normalized.replace(/^echarts-?/, '') || 'auto'} />;
  if (normalized === 'infographic') return <InfographicBlock code={code} caption={caption} />;
  if (SERVER_RENDERED_ENGINES.has(normalized)) return <ServerDiagram engine={normalized} code={code} caption={caption} />;
  return <div className="rk-error-box">Unsupported diagram engine: {engine}</div>;
}

function SvgDiagram({ code, caption }) {
  const safe = sanitizeSvg(code);
  return (
    <figure className="rk-diagram rk-diagram-svg">
      {caption && <figcaption className="rk-diagram-caption">{caption}</figcaption>}
      {safe ? <div className="rk-svg-frame" dangerouslySetInnerHTML={{ __html: safe }} /> : <div className="rk-error-box">SVG diagram requires an &lt;svg&gt; body.</div>}
    </figure>
  );
}

function ServerDiagram({ engine, code, caption }) {
  const [state, setState] = useState({ status: 'loading', svg: '', error: '' });
  useEffect(() => {
    let alive = true;
    setState({ status: 'loading', svg: '', error: '' });
    fetch('/api/render/diagram', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ engine, code })
    })
      .then(r => r.json())
      .then(json => {
        if (!alive) return;
        if (json.ok && json.svg) setState({ status: 'rendered', svg: sanitizeSvg(json.svg), error: '' });
        else setState({ status: 'fallback', svg: '', error: json.error || 'Renderer unavailable' });
      })
      .catch(e => alive && setState({ status: 'fallback', svg: '', error: String(e.message || e) }));
    return () => { alive = false; };
  }, [engine, code]);

  return (
    <figure className="rk-diagram rk-diagram-server" data-engine={engine} data-status={state.status}>
      {caption && <figcaption className="rk-diagram-caption">{caption}</figcaption>}
      {state.status === 'rendered'
        ? <div className="rk-svg-frame" dangerouslySetInnerHTML={{ __html: state.svg }} />
        : <SourceFallback engine={engine} code={code} status={state.status} error={state.error} />}
    </figure>
  );
}

function SourceFallback({ engine, code, status, error }) {
  return (
    <div className="rk-diagram-source" data-engine={engine}>
      <div className="rk-diagram-source-head">
        {engine.toUpperCase()} {status === 'loading' ? 'rendering…' : 'source fallback'}
      </div>
      {error && <p className="rk-diagram-error">{error}</p>}
      <pre><code>{code}</code></pre>
    </div>
  );
}

function InfographicBlock({ code, caption }) {
  const items = parseLooseData(code);
  return (
    <figure className="rk-infographic">
      {caption && <figcaption className="rk-diagram-caption">{caption}</figcaption>}
      <div className="rk-infographic-grid">
        {items.map((item, i) => (
          <div className="rk-infographic-tile" key={i}>
            <div className="rk-infographic-value">{item.value}</div>
            <div className="rk-infographic-label">{item.label}</div>
          </div>
        ))}
      </div>
    </figure>
  );
}

function parseLooseData(code) {
  try {
    const json = JSON.parse(code);
    const arr = Array.isArray(json) ? json : Object.entries(json).map(([label, value]) => ({ label, value }));
    return arr.map(x => ({ label: x.label ?? x.name ?? 'Metric', value: x.value ?? x.count ?? x.metric ?? '' }));
  } catch {}
  return code.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
    const [label, ...rest] = line.split(/:|=/);
    return { label: label?.trim() || 'Metric', value: rest.join(':').trim() || '—' };
  });
}

function sanitizeSvg(svg) {
  let s = String(svg || '').trim().replace(/^<\?xml[\s\S]*?\?>\s*/i, '');
  const start = s.search(/<svg[\s>]/i);
  if (start > 0) s = s.slice(start);
  if (!/^<svg[\s>]/i.test(s)) return '';
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/javascript:/gi, '');
}
