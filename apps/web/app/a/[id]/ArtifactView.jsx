"use client";
import { Fragment, useEffect, useState, useCallback } from 'react';
import { BlockFrame } from '@renderkit/blocks';

export default function ArtifactView({ artifactId, revision, comments: initialComments }) {
  const [comments, setComments] = useState(initialComments || []);
  const [selected, setSelected] = useState(null);
  const [text, setText] = useState('');
  const [menu, setMenu] = useState(null);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('comment');
  const [reviewMode, setReviewMode] = useState(false);
  const model = revision.model;
  const blocks = model.blocks;
  const theme = model.theme || 'paper-light';
  const surface = model.surface || '';
  const allBlocks = flattenBlocks(blocks);
  const selectedBlock = allBlocks.find(b => b.id === selected) || null;
  const feedbackCmd = `rk feedback ${artifactId}`;

  const commentsFor = useCallback((blockId) => comments.filter(c => c.blockId === blockId), [comments]);
  const outlineItems = blocks.map((b) => ({ id: b.id, type: b.type, label: blockLabel(b) }));

  function copyToClipboard(str) { navigator.clipboard?.writeText(str).catch(() => {}); }
  function openDrawer(mode, blockId = selected) {
    if (blockId) setSelected(blockId);
    setReviewMode(true);
    setDrawerMode(mode);
    setDrawerOpen(true);
  }
  function openMenu(e, blockId) {
    if (!reviewMode) return;
    e.preventDefault();
    e.stopPropagation();
    setSelected(blockId);
    setMenu({ x: e.clientX || 260, y: e.clientY || 160, blockId });
  }
  function closeMenu() { setMenu(null); }

  async function submitComment() {
    if (!selected || !text.trim()) return;
    const res = await fetch(`/api/artifacts/${artifactId}/comments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ blockId: selected, text })
    });
    const json = await res.json();
    if (json.ok) { setComments(prev => [...prev, json.comment]); setText(''); }
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        if (menu) closeMenu();
        else if (drawerOpen) setDrawerOpen(false);
        else if (outlineOpen) setOutlineOpen(false);
        else setSelected(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu, drawerOpen, outlineOpen]);

  return (
    <div className={`rk-page${reviewMode ? ' rk-review-mode' : ''}`} data-rk-theme={theme} data-rk-surface={surface || undefined}>
      <main className="rk-document" aria-label={model.title} onContextMenuCapture={(e) => {
        if (!reviewMode) return;
        const el = e.target?.closest?.('[data-block-id]');
        if (el) openMenu(e, el.getAttribute('data-block-id'));
      }}>
        <div className="rk-block-stream">
          {blocks.map(block => (
            <BlockFrame
              key={block.id}
              block={block}
              selected={reviewMode && selected === block.id}
              commentCount={commentsFor(block.id).length}
              reviewMode={reviewMode}
              onSelect={() => setSelected(block.id)}
              onComment={() => openDrawer('comment', block.id)}
              onOpenMenu={(e) => openMenu(e, block.id)}
              onContextMenu={(e) => openMenu(e, block.id)}
            />
          ))}
        </div>
      </main>

      <div className="rk-floating-tools" aria-label="Document tools">
        <button onClick={() => setReviewMode(v => !v)} title="Toggle review mode" className={reviewMode ? 'is-active' : ''}>Review</button>
        <button onClick={() => setOutlineOpen(o => !o)} title="Outline">☰</button>
        <button onClick={() => openDrawer('comments', selected)} title="Comments">💬{comments.length ? ` ${comments.length}` : ''}</button>
        <button onClick={() => copyToClipboard(feedbackCmd)} title="Copy feedback command">⎘</button>
      </div>

      {outlineOpen && (
        <aside className="rk-outline-drawer">
          <div className="rk-drawer-head">
            <span>Outline</span>
            <button onClick={() => setOutlineOpen(false)}>×</button>
          </div>
          <nav className="rk-outline-list">
            {outlineItems.map(item => (
              <button key={item.id} onClick={() => {
                setSelected(item.id);
                document.getElementById(`rk-block-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }} className={selected === item.id ? 'is-active' : ''}>
                <span>{item.label}</span>
                {commentsFor(item.id).length > 0 && <b>{commentsFor(item.id).length}</b>}
              </button>
            ))}
          </nav>
        </aside>
      )}

      {drawerOpen && (
        <aside className="rk-review-drawer">
          <div className="rk-drawer-head">
            <span>{drawerMode === 'comments' ? 'Comments' : 'Comment'}</span>
            <button onClick={() => setDrawerOpen(false)}>×</button>
          </div>

          {selectedBlock ? <BlockInspector
            block={selectedBlock}
            comments={commentsFor(selectedBlock.id)}
            text={text}
            setText={setText}
            submitComment={submitComment}
            feedbackCmd={feedbackCmd}
            copyToClipboard={copyToClipboard}
          /> : <p className="rk-muted">Select a block or right-click anywhere in the document.</p>}

          <div className="rk-drawer-section">
            <div className="rk-drawer-label">All comments</div>
            {comments.length === 0 ? <p className="rk-muted rk-small">No comments yet.</p> : comments.map(c => (
              <CommentCard key={c.id} comment={c} onClick={() => { setSelected(c.blockId); setDrawerMode('comment'); }} />
            ))}
          </div>
        </aside>
      )}

      {menu && <ContextMenu
        x={menu.x}
        y={menu.y}
        block={allBlocks.find(b => b.id === menu.blockId)}
        artifactId={artifactId}
        onInspect={() => { openDrawer('comment', menu.blockId); closeMenu(); }}
        onComment={() => { openDrawer('comment', menu.blockId); closeMenu(); }}
        onCopy={(value) => { copyToClipboard(value); closeMenu(); }}
      />}
    </div>
  );
}


function flattenBlocks(blocks) {
  const out = [];
  for (const block of blocks || []) {
    out.push(block);
    if (Array.isArray(block.props?.children)) out.push(...flattenBlocks(block.props.children));
  }
  return out;
}

function blockLabel(block) {
  if (block.type === 'heading') return block.props?.text || block.id;
  if (block.props?.title) return block.props.title;
  if (block.props?.question) return block.props.question;
  if (block.type === 'subdocument') return block.props?.title || block.id;
  return block.id;
}

function BlockInspector({ block, comments, text, setText, submitComment, feedbackCmd, copyToClipboard }) {
  return (
    <>
      <div className="rk-drawer-section">
        <div className="rk-drawer-label">Selected block</div>
        <code>{block.id}</code> <span className="rk-type-chip">{block.type}</span>
      </div>
      {block.sourceRange && <div className="rk-drawer-section">
        <div className="rk-drawer-label">Source</div>
        <div className="rk-source-range">Lines {block.sourceRange.startLine}–{block.sourceRange.endLine}</div>
        {block.sourceExcerpt && <pre className="rk-source-excerpt">{block.sourceExcerpt}</pre>}
      </div>}
      <div className="rk-drawer-section">
        <div className="rk-drawer-label">Properties</div>
        <div className="rk-props-grid">
          {Object.entries(block.props || {}).map(([k, v]) => (
            <Fragment key={k}><span className="rk-meta-key">{k}</span><span className="rk-meta-val">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span></Fragment>
          ))}
        </div>
      </div>
      <div className="rk-drawer-section">
        <div className="rk-drawer-label">Comments on this block</div>
        {comments.length === 0 ? <p className="rk-muted rk-small">No comments yet.</p> : comments.map(c => <CommentCard key={c.id} comment={c} />)}
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Comment or suggest an edit. The agent edits the source; the web UI never mutates body content." />
        <button className="rk-primary-btn" onClick={submitComment} disabled={!text.trim()}>Add comment</button>
      </div>
      <div className="rk-drawer-section rk-feedback-hint">
        <div className="rk-drawer-label">Agent handoff</div>
        <p className="rk-muted rk-small">Use feedback to route comments back to the authoring agent.</p>
        <div className="rk-feedback-cmd"><code>{feedbackCmd}</code><button onClick={() => copyToClipboard(feedbackCmd)}>⎘</button></div>
      </div>
    </>
  );
}

function ContextMenu({ x, y, block, artifactId, onInspect, onComment, onCopy }) {
  if (!block) return null;
  const style = { left: Math.min(x, window.innerWidth - 250), top: Math.min(y, window.innerHeight - 260) };
  return (
    <div className="rk-context-menu" style={style} onClick={e => e.stopPropagation()}>
      <div className="rk-context-menu-header"><code>{block.id}</code><span className="rk-type-chip">{block.type}</span></div>
      <button className="rk-context-menu-item" onClick={onInspect}>Inspect / source</button>
      <button className="rk-context-menu-item" onClick={onComment}>💬 Comment</button>
      <button className="rk-context-menu-item" onClick={onComment}>✎ Suggest edit as comment</button>
      <div className="rk-context-menu-divider" />
      <button className="rk-context-menu-item" onClick={() => onCopy(block.id)}>⎘ Copy block ID</button>
      <button className="rk-context-menu-item" onClick={() => onCopy(`rk feedback ${artifactId} --block ${block.id}`)}>⎘ Copy feedback command</button>
      {block.sourceRange && <button className="rk-context-menu-item" onClick={() => onCopy(`Lines ${block.sourceRange.startLine}–${block.sourceRange.endLine}`)}>⎘ Copy source location</button>}
    </div>
  );
}

function CommentCard({ comment: c, onClick }) {
  return (
    <div className={`rk-comment-card${onClick ? ' rk-clickable' : ''}`} data-status={c.status} onClick={onClick}>
      <div className="rk-comment-header"><b>{c.blockId}</b><span className="rk-pill" data-status={c.status}>{c.status}</span></div>
      <p>{c.text}</p>
      <div className="rk-comment-id">{c.id}</div>
    </div>
  );
}
