import { useEffect, useState } from 'react';
import MermaidDiagram from './MermaidDiagram';
import EChartsBlock from './EChartsBlock';

const SERVER_RENDERED_ENGINES = new Set(['plantuml', 'd2']);

interface DiagramBlockProps {
  engine?: string;
  code?: string;
  caption?: string;
}

export default function DiagramBlock({ engine = 'mermaid', code = '', caption }: DiagramBlockProps) {
  const normalized = String(engine || 'mermaid').toLowerCase();
  if (normalized === 'mermaid') return <MermaidDiagram code={code} caption={caption} />;
  if (normalized === 'svg') return <SvgDiagram code={code} caption={caption} />;
  if (normalized === 'echarts' || normalized.startsWith('echarts-')) return <EChartsBlock code={code} caption={caption} variant={normalized.replace(/^echarts-?/, '') || 'auto'} />;
  if (normalized === 'infographic') return <InfographicBlock code={code} caption={caption} />;
  if (SERVER_RENDERED_ENGINES.has(normalized)) return <ServerDiagram engine={normalized} code={code} caption={caption} />;
  return <div className="rk-error-box">Unsupported diagram engine: {engine}</div>;
}

function SvgDiagram({ code, caption }: { code: string; caption?: string }) {
  const safe = enhanceSvgAccessibility(sanitizeSvg(code), caption || 'SVG diagram');
  return (
    <figure className="rk-diagram rk-diagram-svg">
      {caption && <figcaption className="rk-diagram-caption">{caption}</figcaption>}
      {safe ? <div className="rk-svg-frame" dangerouslySetInnerHTML={{ __html: safe }} /> : <div className="rk-error-box">SVG diagram requires an &lt;svg&gt; body.</div>}
    </figure>
  );
}

function ServerDiagram({ engine, code, caption }: { engine: string; code: string; caption?: string }) {
  const [state, setState] = useState<{ status: string; svg: string; error: string }>({ status: 'loading', svg: '', error: '' });
  useEffect(() => {
    let alive = true;
    setState({ status: 'loading', svg: '', error: '' });
    fetch('/api/render/diagram', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ engine, code })
    })
      .then(r => r.json())
      .then((json: { ok?: boolean; svg?: string; error?: string }) => {
        if (!alive) return;
        if (json.ok && json.svg) setState({ status: 'rendered', svg: enhanceSvgAccessibility(sanitizeSvg(json.svg!), caption || `${engine} diagram`), error: '' });
        else setState({ status: 'fallback', svg: '', error: json.error || 'Renderer unavailable' });
      })
      .catch((e: Error) => alive && setState({ status: 'fallback', svg: '', error: String(e.message || e) }));
    return () => { alive = false; };
  }, [engine, code, caption]);

  return (
    <figure className="rk-diagram rk-diagram-server" data-engine={engine} data-status={state.status}>
      {caption && <figcaption className="rk-diagram-caption">{caption}</figcaption>}
      {state.status === 'rendered'
        ? <div className="rk-svg-frame" dangerouslySetInnerHTML={{ __html: state.svg }} />
        : <SourceFallback engine={engine} code={code} status={state.status} error={state.error} />}
    </figure>
  );
}

function SourceFallback({ engine, code, status, error }: { engine: string; code: string; status: string; error: string }) {
  return (
    <div className="rk-diagram-source" data-engine={engine}>
      <div className="rk-diagram-source-head">
        {engine.toUpperCase()} {status === 'loading' ? '渲染中…' : '源文件回退'}
      </div>
      {error && <p className="rk-diagram-error">{error}</p>}
      <pre><code>{code}</code></pre>
    </div>
  );
}

interface InfographicItem {
  label: string;
  value: string;
}

function InfographicBlock({ code, caption }: { code: string; caption?: string }) {
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

function parseLooseData(code: string): InfographicItem[] {
  try {
    const json = JSON.parse(code);
    const arr = Array.isArray(json) ? json : Object.entries(json as Record<string, unknown>).map(([label, value]) => ({ label, value }));
    return (arr as InfographicItem[]).map(x => ({ label: x.label ?? 'Metric', value: x.value ?? '—' }));
  } catch { /* not JSON */ }
  return code.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
    const [label, ...rest] = line.split(/:|=/);
    return { label: label?.trim() || 'Metric', value: rest.join(':').trim() || '—' };
  });
}

function sanitizeSvg(svg: string): string {
  let s = String(svg || '').trim().replace(/^<\?xml[\s\S]*?\?>\s*/i, '');
  const start = s.search(/<svg[\s>]/i);
  if (start > 0) s = s.slice(start);
  if (!/^<svg[\s>]/i.test(s)) return '';
  return s
    .replace(/<style[\s\S]*?<\/style>/gi, '')  // Remove CSS style blocks (prevents pw read-text pollution)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/javascript:/gi, '');
}

function enhanceSvgAccessibility(svg: string, label: string): string {
  const safe = escapeXml(label);
  const titleTag = `<title>${safe}</title>`;
  const descTag = `<desc>${safe}</desc>`;
  // Insert title+desc right after opening <svg...> tag; also add role="img"
  let enhanced = svg.replace(/<svg/i, `<svg role="img"`);
  enhanced = enhanced.replace(/(<svg[^>]*>)/i, `$1${titleTag}${descTag}`);
  return enhanced;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
