import MermaidDiagram from './MermaidDiagram.jsx';
import EChartsBlock from './EChartsBlock.jsx';

const SUPPORTED_SOURCE_ENGINES = new Set(['plantuml', 'd2']);

export default function DiagramBlock({ engine = 'mermaid', code = '', caption }) {
  const normalized = String(engine || 'mermaid').toLowerCase();
  if (normalized === 'mermaid') return <MermaidDiagram code={code} caption={caption} />;
  if (normalized === 'svg') return <SvgDiagram code={code} caption={caption} />;
  if (normalized === 'echarts') return <EChartsBlock code={code} caption={caption} />;
  if (normalized === 'infographic') return <InfographicBlock code={code} caption={caption} />;
  if (SUPPORTED_SOURCE_ENGINES.has(normalized)) return <SourceDiagram engine={normalized} code={code} caption={caption} />;
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

function SourceDiagram({ engine, code, caption }) {
  return (
    <figure className="rk-diagram rk-diagram-source" data-engine={engine}>
      {caption && <figcaption className="rk-diagram-caption">{caption}</figcaption>}
      <div className="rk-diagram-source-head">{engine.toUpperCase()} source</div>
      <pre><code>{code}</code></pre>
      <p className="rk-muted rk-small">Local renderer adapter pending; source is preserved as a reviewable artifact block.</p>
    </figure>
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
  if (!svg || !/^\s*<svg[\s>]/i.test(svg)) return '';
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/javascript:/gi, '');
}
