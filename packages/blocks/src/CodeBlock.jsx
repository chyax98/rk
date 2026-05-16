export default function CodeBlock({ language, title, code }) {
  return (
    <div>
      {(title || language) && (
        <div className="rk-code-header">
          {title && <span className="rk-code-title">{title}</span>}
          {language && <span className="rk-code-lang">{language}</span>}
        </div>
      )}
      <pre><code>{code}</code></pre>
    </div>
  );
}
