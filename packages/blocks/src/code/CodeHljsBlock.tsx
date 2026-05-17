import { useState } from 'react';
import hljs from 'highlight.js/lib/common';
import CodeFrame from './CodeFrame';
import { CodeBlockProps } from './types';

export default function CodeHljsBlock({ language, title, code, filename, frame, showLineNumbers, highlight, diff, copyMode, renderer }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const highlighted = highlightCode(code || '', language || '');
  const lines = (code || '').split('\n');
  const highlightSet = parseHighlightRanges(highlight || '', lines.length);

  async function copyCode() {
    try {
      const text = copyMode === 'all' ? (code || '') : stripPrompts(code || '');
      await navigator.clipboard?.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <div className="rk-code-block">
      {(title || language) && (
        <div className="rk-code-header">
          <div className="rk-code-heading">
            {title && <span className="rk-code-title">{title}</span>}
            {language && <span className="rk-code-lang">{language}</span>}
          </div>
          <button className="rk-code-copy" type="button" onClick={copyCode}>{copied ? 'Copied' : 'Copy'}</button>
        </div>
      )}
      <CodeFrame filename={filename} language={language} frame={frame}>
        {showLineNumbers ? (
          <table className="rk-code-table">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className={highlightSet.has(i + 1) ? 'rk-code-highlight-line' : ''}>
                  <td className="rk-code-line-number" data-line={i + 1} />
                  <td className="rk-code-line-content" dangerouslySetInnerHTML={{ __html: highlightLine(line, language || '') }} />
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <pre><code className={`hljs language-${language || 'text'}`} dangerouslySetInnerHTML={{ __html: highlighted }} /></pre>
        )}
      </CodeFrame>
    </div>
  );
}

function highlightCode(code: string, language: string): string {
  const lang = String(language || '').toLowerCase();
  try {
    if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
    return hljs.highlightAuto(code).value;
  } catch {
    return escapeHtml(code);
  }
}

function highlightLine(line: string, language: string): string {
  return highlightCode(line, language);
}

function parseHighlightRanges(spec: string, totalLines: number): Set<number> {
  const set = new Set<number>();
  if (!spec) return set;
  for (const part of spec.split(',')) {
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

function stripPrompts(code: string): string {
  return code.replace(/^\$\s+/gm, '').replace(/^#\s+/gm, '');
}

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
