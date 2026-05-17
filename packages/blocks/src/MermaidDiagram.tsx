import { useEffect, useRef, useState } from 'react';

interface MermaidDiagramProps {
  code: string;
  caption?: string;
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
        if (alive && ref.current) ref.current.innerHTML = svg;
      } catch (e) {
        if (alive) setErr(String((e as Error).message || e));
      }
    });
    return () => { alive = false; };
  }, [code]);
  return (
    <div>
      {caption && <div className="rk-diagram-caption">{caption}</div>}
      {err
        ? <div className="rk-diagram-error">{err}{'\n\n'}{code}</div>
        : <div ref={ref}><div className="rk-diagram-fallback"><pre>{code}</pre></div></div>
      }
    </div>
  );
}
