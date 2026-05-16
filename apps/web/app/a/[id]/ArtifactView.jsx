"use client";
import { useEffect, useRef, useState } from 'react';

export default function ArtifactView({ artifactId, revision, comments: initialComments }) {
  const [comments, setComments] = useState(initialComments || []);
  const [selected, setSelected] = useState(null);
  const [text, setText] = useState('');
  const blocks = revision.model.blocks;

  async function submitComment() {
    if (!selected || !text.trim()) return;
    const res = await fetch(`/api/artifacts/${artifactId}/comments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ blockId: selected, text }) });
    const json = await res.json();
    if (json.ok) { setComments([...comments, json.comment]); setText(''); }
  }

  return <div className="artifact">
    <main className="content">
      <div className="topbar"><h1>{revision.model.title}</h1><div className="muted">{artifactId} · rev {revision.number}</div></div>
      {blocks.map(block => <BlockFrame key={block.id} block={block} selected={selected === block.id} onComment={() => setSelected(block.id)} comments={comments.filter(c => c.blockId === block.id)} />)}
    </main>
    <aside className="sidebar">
      <h2>Comments</h2>
      {selected ? <div className="comment">
        <div className="muted">Comment on <code>{selected}</code></div>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="哪里不行？让 Agent 后续 feedback 后修改。" />
        <button onClick={submitComment}>Add comment</button>
      </div> : <p className="muted">选择 block 后评论。</p>}
      {comments.length === 0 ? <p className="muted">暂无评论。</p> : comments.map(c => <div className="comment" key={c.id}>
        <div><b>{c.blockId}</b> <span className="pill">{c.status}</span></div>
        <p>{c.text}</p>
        <div className="muted">{c.id}</div>
      </div>)}
    </aside>
  </div>;
}

function BlockFrame({ block, onComment, selected, comments }) {
  const cls = `block ${selected ? 'selected' : ''} ${block.type}`;
  return <section className={cls} data-block-id={block.id}>
    <div className="block-tools"><span className="block-id">{block.id}</span><button className="smallbtn" onClick={onComment}>💬 {comments.length || ''}</button></div>
    <RenderBlock block={block} />
  </section>;
}

function RenderBlock({ block }) {
  try {
    if (block.type === 'heading') return <div className="heading-block">{heading(block.props.level, block.props.text)}</div>;
    if (block.type === 'paragraph') return <div className="paragraph">{block.props.markdown}</div>;
    if (block.type === 'callout') return <Callout {...block.props} />;
    if (block.type === 'decision-card') return <Decision {...block.props} />;
    if (block.type === 'diagram') return <Diagram {...block.props} />;
    return <div className="errorbox">Unknown block: {block.type}</div>;
  } catch (e) { return <div className="errorbox">Block render error: {String(e.message || e)}</div>; }
}
function heading(level, text) { const Tag = `h${Math.min(Math.max(level || 2, 1), 3)}`; return <Tag>{text}</Tag>; }
function Callout({ tone='info', title, content }) { return <div className={`callout ${tone}`}><div className="callout-title">{title || tone}</div><div className="paragraph">{content}</div></div>; }
function Decision({ question, chosen, status, rationale, alternatives }) { return <div className="decision"><h3>{question}<span className="pill">{status || 'draft'}</span></h3><div className="kv"><b>Chosen</b><span>{chosen}</span></div>{Array.isArray(rationale) && rationale.length ? <><b className="muted">Rationale</b><ul className="clean">{rationale.map((x,i)=><li key={i}>{x}</li>)}</ul></> : null}{Array.isArray(alternatives) && alternatives.length ? <><b className="muted">Alternatives</b><ul className="clean">{alternatives.map((x,i)=><li key={i}>{x.name || x}: {x.reason || ''}</li>)}</ul></> : null}</div>; }
function Diagram({ engine, code, caption }) {
  if (engine !== 'mermaid') return <div className="errorbox">Unsupported diagram engine: {engine}</div>;
  return <Mermaid code={code} caption={caption} />;
}
function Mermaid({ code, caption }) {
  const ref = useRef(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    let alive = true;
    import('mermaid').then(async ({ default: mermaid }) => {
      try { mermaid.initialize({ startOnLoad: false, theme: 'dark' }); const id = 'm' + Math.random().toString(36).slice(2); const { svg } = await mermaid.render(id, code); if (alive && ref.current) ref.current.innerHTML = svg; }
      catch (e) { if (alive) setErr(String(e.message || e)); }
    });
    return () => { alive = false; };
  }, [code]);
  return <div className="diagram">{caption ? <div className="muted">{caption}</div> : null}{err ? <div className="errorbox">{err}\n\n{code}</div> : <div ref={ref}><pre>{code}</pre></div>}</div>;
}
