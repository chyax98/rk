"use client";
import { useEffect, useRef, useState } from 'react';

export default function ArtifactView({ artifactId, revision, comments: initialComments }) {
  const [comments, setComments] = useState(initialComments || []);
  const [selected, setSelected] = useState(null);
  const [text, setText] = useState('');
  const model = revision.model;
  const blocks = model.blocks;
  const theme = model.theme || 'dark-pro';
  const surface = model.surface || '';

  async function submitComment() {
    if (!selected || !text.trim()) return;
    const res = await fetch(`/api/artifacts/${artifactId}/comments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ blockId: selected, text })
    });
    const json = await res.json();
    if (json.ok) { setComments([...comments, json.comment]); setText(''); }
  }

  const commentCount = (blockId) => comments.filter(c => c.blockId === blockId).length;

  return (
    <div className="rk-artifact" data-rk-theme={theme} data-rk-surface={surface || undefined}>
      <main className="rk-content">
        <div className="rk-topbar">
          <h1 className="rk-topbar-title">{model.title}</h1>
          <div className="rk-topbar-meta">
            <span>rev {revision.number}</span>
            {theme && <><span>·</span><span>{theme}</span></>}
            {surface && <><span>·</span><span>{surface}</span></>}
            <span>·</span><code>{artifactId}</code>
          </div>
        </div>
        {blocks.map(block => (
          <BlockFrame
            key={block.id}
            block={block}
            selected={selected === block.id}
            commentCount={commentCount(block.id)}
            onComment={() => setSelected(block.id)}
          />
        ))}
      </main>
      <aside className="rk-rail">
        <h2>Comments</h2>
        {selected ? (
          <div className="rk-rail-section">
            <div className="rk-muted">Comment on <code>{selected}</code></div>
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="哪里不行？让 Agent 后续 feedback 后修改。" />
            <button className="rk-primary-btn" onClick={submitComment}>Add comment</button>
          </div>
        ) : (
          <p className="rk-muted">选择 block 后评论。</p>
        )}
        {comments.length === 0 ? <p className="rk-muted">暂无评论。</p> : comments.map(c => (
          <div className="rk-comment-card" key={c.id} data-status={c.status}>
            <div className="rk-comment-header">
              <b>{c.blockId}</b>
              <span className="rk-pill" data-status={c.status}>{c.status}</span>
            </div>
            <p>{c.text}</p>
            <div className="rk-comment-id">{c.id}</div>
          </div>
        ))}
      </aside>
    </div>
  );
}

function BlockFrame({ block, onComment, selected, commentCount }) {
  const cls = `rk-block rk-block-${block.type}${selected ? ' rk-selected' : ''}`;
  return (
    <section
      className={cls}
      data-block-id={block.id}
      data-block-type={block.type}
      {...(selected ? { 'data-rk-selected': '' } : {})}
      {...(commentCount > 0 ? { 'data-rk-has-comments': '' } : {})}
      {...(block.props?.tone ? { 'data-tone': block.props.tone } : {})}
      tabIndex={0}
    >
      <div className="rk-block-tools">
        <span className="rk-block-id">{block.id}</span>
        <button className="rk-comment-btn" onClick={onComment}>💬 {commentCount || ''}</button>
      </div>
      <RenderBlock block={block} />
    </section>
  );
}

function RenderBlock({ block }) {
  try {
    switch (block.type) {
      case 'heading': return <HeadingBlock {...block.props} />;
      case 'paragraph': return <ParagraphBlock {...block.props} />;
      case 'summary': return <SummaryBlock {...block.props} />;
      case 'callout': return <CalloutBlock {...block.props} />;
      case 'decision-card': return <DecisionBlock {...block.props} />;
      case 'code': return <CodeBlock {...block.props} />;
      case 'diagram': return <DiagramBlock {...block.props} />;
      default: return <div className="rk-error-box">Unknown block: {block.type}</div>;
    }
  } catch (e) {
    return <div className="rk-error-box">Block render error: {String(e.message || e)}</div>;
  }
}

function HeadingBlock({ level, text }) {
  const Tag = `h${Math.min(Math.max(level || 2, 1), 3)}`;
  return <Tag>{text}</Tag>;
}

function ParagraphBlock({ markdown }) {
  return <div className="rk-block-paragraph">{markdown}</div>;
}

function SummaryBlock({ title, content }) {
  return (
    <div>
      {title && <div className="rk-summary-title">{title}</div>}
      <div className="rk-summary-body">{content}</div>
    </div>
  );
}

function CalloutBlock({ tone = 'info', title, content }) {
  return (
    <div>
      <div className="rk-callout-title">{title || tone}</div>
      <div className="rk-block-paragraph">{content}</div>
    </div>
  );
}

function DecisionBlock({ question, chosen, status, rationale, alternatives }) {
  return (
    <div>
      <h3 className="rk-decision-question">{question}<span className="rk-decision-status">{status || 'draft'}</span></h3>
      <div className="rk-decision-kv"><b>Chosen</b><span>{chosen}</span></div>
      {Array.isArray(rationale) && rationale.length > 0 && (
        <><b className="rk-muted">Rationale</b><ul className="rk-decision-list">{rationale.map((x, i) => <li key={i}>{x}</li>)}</ul></>
      )}
      {Array.isArray(alternatives) && alternatives.length > 0 && (
        <><b className="rk-muted">Alternatives</b><ul className="rk-decision-list">{alternatives.map((x, i) => <li key={i}>{x.name || x}: {x.reason || ''}</li>)}</ul></>
      )}
    </div>
  );
}

function CodeBlock({ language, title, code }) {
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

function DiagramBlock({ engine, code, caption }) {
  if (engine !== 'mermaid') return <div className="rk-error-box">Unsupported diagram engine: {engine}</div>;
  return <MermaidDiagram code={code} caption={caption} />;
}

function MermaidDiagram({ code, caption }) {
  const ref = useRef(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    let alive = true;
    import('mermaid').then(async ({ default: mermaid }) => {
      try {
        mermaid.initialize({ startOnLoad: false, theme: 'dark' });
        const id = 'm' + Math.random().toString(36).slice(2);
        const { svg } = await mermaid.render(id, code);
        if (alive && ref.current) ref.current.innerHTML = svg;
      } catch (e) {
        if (alive) setErr(String(e.message || e));
      }
    });
    return () => { alive = false; };
  }, [code]);
  return (
    <div>
      {caption && <div className="rk-diagram-caption">{caption}</div>}
      {err
        ? <div className="rk-diagram-error">{err}\n\n{code}</div>
        : <div ref={ref}><div className="rk-diagram-fallback"><pre>{code}</pre></div></div>
      }
    </div>
  );
}
