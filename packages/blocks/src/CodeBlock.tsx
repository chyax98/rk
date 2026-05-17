import { useState } from 'react';
import hljs from 'highlight.js/lib/common';

export default function CodeBlock({ language, title, code }) {
  const [copied, setCopied] = useState(false);
  const highlighted = highlightCode(code || '', language || '');

  async function copyCode() {
    try {
      await navigator.clipboard?.writeText(code || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  return (
    <div>
      {(title || language) && (
        <div className="rk-code-header">
          <div className="rk-code-heading">
            {title && <span className="rk-code-title">{title}</span>}
            {language && <span className="rk-code-lang">{language}</span>}
          </div>
          <button className="rk-code-copy" type="button" onClick={copyCode}>{copied ? 'Copied' : 'Copy'}</button>
        </div>
      )}
      <pre><code className={`hljs language-${language || 'text'}`} dangerouslySetInnerHTML={{ __html: highlighted }} /></pre>
    </div>
  );
}

function highlightCode(code, language) {
  const lang = String(language || '').toLowerCase();
  try {
    if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
    return hljs.highlightAuto(code).value;
  } catch {
    return escapeHtml(code);
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
