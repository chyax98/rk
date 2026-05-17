import { useEffect, useRef, useState } from 'react';

interface MermaidDiagramProps {
  code: string;
  caption?: string;
}

function sanitizeSvg(svg: string): string {
  // Remove <style> tags and HTML comments to prevent CSS text pollution
  return svg.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
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
        if (!alive || !ref.current) return;
        ref.current.innerHTML = clean;
        const svgEl = ref.current.querySelector('svg');
        if (!svgEl) return;

        // Accessibility: inject <title> + <desc> and aria-labelledby
        const titleId = 'mmd-title-' + Math.random().toString(36).slice(2);
        const descId = 'mmd-desc-' + Math.random().toString(36).slice(2);
        const label = caption || '流程图';

        const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        titleEl.id = titleId;
        titleEl.textContent = label;

        const descEl = document.createElementNS('http://www.w3.org/2000/svg', 'desc');
        descEl.id = descId;
        descEl.textContent = label + (code ? ' · ' + code.slice(0, 120) : '');

        svgEl.insertBefore(descEl, svgEl.firstChild);
        svgEl.insertBefore(titleEl, svgEl.firstChild);

        svgEl.setAttribute('role', 'img');
        svgEl.setAttribute('aria-labelledby', `${titleId} ${descId}`);

        // Hide layout <text> elements from screen readers — they are visual only
        svgEl.querySelectorAll('text').forEach((t) => {
          t.setAttribute('aria-hidden', 'true');
        });
      } catch (e) {
        if (alive) setErr(String((e as Error).message || e));
      }
    });
    return () => {
      alive = false;
    };
  }, [code, caption]);

  return (
    <figure className="rk-diagram rk-mermaid">
      {caption && <figcaption className="rk-diagram-caption">{caption}</figcaption>}
      {err ? (
        <div className="rk-diagram-error">
          {err}
          {'\n\n'}
          {code}
        </div>
      ) : (
        <div ref={ref} aria-hidden="true">
          <div className="rk-diagram-fallback">
            <pre>{code}</pre>
          </div>
        </div>
      )}
    </figure>
  );
}
