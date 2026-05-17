import { useEffect, useState } from 'react';
import CodeFrame from './CodeFrame';
import CodeHljsBlock from './CodeHljsBlock';
import type { CodeBlockProps } from './types';

interface ShikiResponse {
  ok: boolean;
  html?: string;
  error?: string;
}

export default function CodeShikiBlock(props: CodeBlockProps) {
  const { code, language, filename, frame, showLineNumbers, highlight } = props;
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    fetch('/api/render/code', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code, language, theme: 'github-light' }),
    })
      .then((r) => r.json())
      .then((json: ShikiResponse) => {
        if (!alive) return;
        if (json.ok && json.html) {
          setHtml(json.html);
        } else {
          setError(true);
        }
        setLoading(false);
      })
      .catch(() => {
        if (alive) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [code, language]);

  // Fallback to hljs if shiki fails
  if (error) return <CodeHljsBlock {...props} />;

  if (loading || html === null) {
    return <CodeHljsBlock {...props} />;
  }

  const lines = html.split('\n').filter(Boolean);
  const highlightSet = parseHighlightRanges(highlight || '', lines.length);

  return (
    <div className="rk-code-block rk-code-shiki">
      <CodeFrame filename={filename} language={language} frame={frame}>
        {showLineNumbers ? (
          <table className="rk-code-table">
            <tbody>
              {lines.map((lineHtml, i) => (
                <tr key={i} className={highlightSet.has(i + 1) ? 'rk-code-highlight-line' : ''}>
                  <td className="rk-code-line-number" data-line={i + 1} />
                  <td
                    className="rk-code-line-content"
                    dangerouslySetInnerHTML={{ __html: lineHtml }}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <pre className="shiki">
            <code dangerouslySetInnerHTML={{ __html: html }} />
          </pre>
        )}
      </CodeFrame>
    </div>
  );
}

function parseHighlightRanges(spec: string, totalLines: number): Set<number> {
  const set = new Set<number>();
  const s = String(spec ?? '');
  if (!s) return set;
  for (const part of s.split(',')) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [a, b] = trimmed.split('-').map(Number);
      for (let i = Math.max(1, a || 1); i <= Math.min(totalLines, b || totalLines); i++) set.add(i);
    } else {
      const n = Number(trimmed);
      if (n >= 1 && n <= totalLines) set.add(n);
    }
  }
  return set;
}
