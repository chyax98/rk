import { useEffect, useRef, useState } from 'react';

interface MermaidDiagramProps {
  code: string;
  caption?: string;
}

function sanitizeSvg(svg: string): string {
  // Remove <style> tags to prevent CSS text pollution in screen readers / pw read-text
  return svg.replace(/<style[\s\S]*?<\/style>/gi, '');
}

export default function MermaidDiagram({ code, caption }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    import('mermaid').then(async ({ default: mermaid }) => {
      try {
        mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
        const id = 'm' + Math.random().toString(36).slice(2);
        const { svg } = await mermaid.render(id, code);
        const clean = sanitizeSvg(svg);
        if (alive && ref.current) {
          ref.current.innerHTML = clean;
          // Hide SVG from screen readers; accessible text is the caption or code
          const svgEl = ref.current.querySelector('svg');
          if (svgEl) {
            svgEl.setAttribute('aria-hidden', 'true');
            svgEl.setAttribute('role', 'img');
          }
        }
      } catch (e) {
        if (alive) setErr(String((e as Error).message || e));
      }
    });
    return () => { alive = false; };
  }, [code]);

  const label = caption || '流程图';
  return (
    <figure className="rk-diagram rk-mermaid" aria-label={label}>
      {caption && <figcaption className="rk-diagram-caption">{caption}</figcaption>}
      {err
        ? <div className="rk-diagram-error">{err}{'\n\n'}{code}</div>
        : <div ref={ref} aria-hidden="true"><div className="rk-diagram-fallback"><pre>{code}</pre></div></div>
      }
    </figure>
  );
}
