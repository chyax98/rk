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
  const [commentFilter, setCommentFilter] = useState('open');
  const [quoteAnchor, setQuoteAnchor] = useState(null);
  const [selectionMenu, setSelectionMenu] = useState(null);
  const model = revision.model;
  const blocks = model.blocks;
  const theme = model.theme || 'paper-light';
  const surface = model.surface || '';
  const allBlocks = flattenBlocks(blocks);
  const selectedBlock = allBlocks.find(b => b.id === selected) || null;
  const feedbackCmd = `rk feedback ${artifactId}`;
  const wideReviewSurface = isWideReviewSurface(surface);

  const commentsFor = useCallback((blockId) => comments.filter(c => c.blockId === blockId), [comments]);
  const blockCommentStatus = useCallback((blockId) => {
    const list = commentsFor(blockId);
    if (list.some(c => c.status === 'open')) return 'open';
    if (list.some(c => c.status === 'orphaned')) return 'orphaned';
    if (list.some(c => c.status === 'resolved')) return 'resolved';
    return null;
  }, [commentsFor]);
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
      body: JSON.stringify({ blockId: selected, text, selector: quoteAnchor?.blockId === selected ? quoteAnchor.selector : null })
    });
    const json = await res.json();
    if (json.ok) { setComments(prev => [...prev, json.comment]); setText(''); setQuoteAnchor(null); setSelectionMenu(null); }
  }

  async function setCommentStatus(commentId, status) {
    const res = await fetch(`/api/artifacts/${artifactId}/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const json = await res.json();
    if (json.ok) setComments(prev => prev.map(c => c.id === commentId ? json.comment : c));
  }

  function captureSelection() {
    const selection = window.getSelection?.();
    const exact = selection?.toString?.().trim();
    if (!exact || exact.length < 2) { setSelectionMenu(null); return; }
    const range = selection.rangeCount ? selection.getRangeAt(0) : null;
    const container = range?.commonAncestorContainer?.nodeType === Node.ELEMENT_NODE ? range.commonAncestorContainer : range?.commonAncestorContainer?.parentElement;
    const el = container?.closest?.('[data-block-id]');
    if (!el) { setSelectionMenu(null); return; }
    const blockId = el.getAttribute('data-block-id');
    let prefix = '';
    let suffix = '';
    try {
      const preRange = document.createRange();
      preRange.setStart(el, 0);
      preRange.setEnd(range.startContainer, range.startOffset);
      prefix = preRange.toString().slice(-80);
      const postRange = document.createRange();
      postRange.setStart(range.endContainer, range.endOffset);
      postRange.setEnd(el, el.childNodes.length);
      suffix = postRange.toString().slice(0, 80);
    } catch {
      const blockText = el.innerText || '';
      const start = blockText.indexOf(exact);
      prefix = start > 0 ? blockText.slice(Math.max(0, start - 80), start) : '';
      suffix = start >= 0 ? blockText.slice(start + exact.length, start + exact.length + 80) : '';
    }
    const selector = {
      type: 'TextQuoteSelector',
      exact: exact.slice(0, 500),
      prefix,
      suffix
    };
    const rect = range.getBoundingClientRect();
    setSelected(blockId);
    setQuoteAnchor({ blockId, selector });
    setSelectionMenu({ x: Math.min(rect.left + rect.width / 2, window.innerWidth - 220), y: Math.max(16, rect.top - 48), blockId });
  }

  function commentOnSelection() {
    if (!quoteAnchor?.blockId) return;
    setReviewMode(true);
    openDrawer('comment', quoteAnchor.blockId);
    setSelectionMenu(null);
  }

  useEffect(() => {
    applyCommentHighlights(comments);
    return () => clearCommentHighlights();
  }, [comments]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        if (menu) closeMenu();
        else if (selectionMenu) setSelectionMenu(null);
        else if (drawerOpen) setDrawerOpen(false);
        else if (outlineOpen) setOutlineOpen(false);
        else { setSelected(null); setQuoteAnchor(null); }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu, drawerOpen, outlineOpen, selectionMenu]);

  return (
    <div className={`rk-page${reviewMode ? ' rk-review-mode' : ''}${wideReviewSurface && reviewMode ? ' rk-page-with-pane' : ''}`} data-rk-theme={theme} data-rk-surface={surface || undefined}>
      <main id="rk-main" className="rk-document" aria-label={model.title} onMouseUp={captureSelection} onContextMenuCapture={(e) => {
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
              commentStatus={blockCommentStatus(block.id)}
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
<button onClick={() => openDrawer('comments', selected)} title="Comments">💬{reviewMode && comments.length ? ` ${comments.length}` : ''}</button>
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

      {wideReviewSurface && reviewMode && (
        <aside className="rk-review-pane">
          <ReviewPanel
            mode={drawerMode}
            selectedBlock={selectedBlock}
            selected={selected}
            comments={comments}
            commentsFor={commentsFor}
            text={text}
            setText={setText}
            submitComment={submitComment}
            feedbackCmd={feedbackCmd}
            copyToClipboard={copyToClipboard}
            quoteAnchor={quoteAnchor}
            setSelected={setSelected}
            setDrawerMode={setDrawerMode}
            setCommentStatus={setCommentStatus}
            commentFilter={commentFilter}
            setCommentFilter={setCommentFilter}
          />
        </aside>
      )}

      {drawerOpen && !(wideReviewSurface && reviewMode) && (
        <aside className="rk-review-drawer">
          <div className="rk-drawer-head">
            <span>{drawerMode === 'comments' ? 'Comments' : 'Comment'}</span>
            <button onClick={() => setDrawerOpen(false)}>×</button>
          </div>

          <ReviewPanel
            mode={drawerMode}
            selectedBlock={selectedBlock}
            selected={selected}
            comments={comments}
            commentsFor={commentsFor}
            text={text}
            setText={setText}
            submitComment={submitComment}
            feedbackCmd={feedbackCmd}
            copyToClipboard={copyToClipboard}
            quoteAnchor={quoteAnchor}
            setSelected={setSelected}
            setDrawerMode={setDrawerMode}
            setCommentStatus={setCommentStatus}
            commentFilter={commentFilter}
            setCommentFilter={setCommentFilter}
          />
        </aside>
      )}

      {selectionMenu && <div className="rk-selection-menu" style={{ left: selectionMenu.x, top: selectionMenu.y }}>
        <button onClick={commentOnSelection}>Comment on selection</button>
      </div>}

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
    if (Array.isArray(block.props?.tabs)) {
      for (const tab of block.props.tabs) {
        if (Array.isArray(tab.blocks)) out.push(...flattenBlocks(tab.blocks));
      }
    }
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

function isWideReviewSurface(surface) {
  return ['engineering-plan', 'review-report', 'data-report-lite'].includes(surface);
}

function clearCommentHighlights() {
  try { CSS.highlights?.delete?.('rk-comment-quotes'); } catch {}
}

function applyCommentHighlights(comments) {
  ensureHighlightStyle();
  clearCommentHighlights();
  if (typeof window === 'undefined' || !CSS.highlights || typeof Highlight === 'undefined') return;
  const ranges = [];
  for (const comment of comments || []) {
    if (comment.status !== 'open' || !comment.selector?.exact) continue;
    const block = document.querySelector(`[data-block-id="${cssEscape(comment.blockId)}"]`);
    const range = block ? findTextRange(block, comment.selector) : null;
    if (range) ranges.push(range);
  }
  if (ranges.length) CSS.highlights.set('rk-comment-quotes', new Highlight(...ranges));
}

function ensureHighlightStyle() {
  if (document.getElementById('rk-comment-highlight-style')) return;
  const style = document.createElement('style');
  style.id = 'rk-comment-highlight-style';
  style.textContent = '::highlight(rk-comment-quotes){background:rgba(255,214,102,.55);color:inherit;}';
  document.head.appendChild(style);
}

function findTextRange(root, selector) {
  const exact = String(selector?.exact || '').trim();
  if (!exact) return null;
  const prefix = String(selector?.prefix || '');
  const suffix = String(selector?.suffix || '');
  const candidates = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue?.includes(exact)) return NodeFilter.FILTER_REJECT;
      if (node.parentElement?.closest?.('.rk-block-tools,.rk-comment-card,.rk-context-menu,.rk-selection-menu')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  let node;
  while ((node = walker.nextNode())) {
    let start = node.nodeValue.indexOf(exact);
    while (start >= 0) {
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, start + exact.length);
      candidates.push({ range, node, start });
      start = node.nodeValue.indexOf(exact, start + exact.length);
    }
  }
  if (!candidates.length) return null;
  if (candidates.length === 1 || (!prefix && !suffix)) return candidates[0].range;
  const scored = candidates.map(candidate => {
    const before = candidate.node.nodeValue.slice(Math.max(0, candidate.start - 120), candidate.start);
    const after = candidate.node.nodeValue.slice(candidate.start + exact.length, candidate.start + exact.length + 120);
    return { ...candidate, score: overlapScore(before, prefix, 'end') + overlapScore(after, suffix, 'start') };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].range;
}

function overlapScore(text, anchor, side) {
  if (!anchor) return 0;
  const a = normalizeSpace(anchor);
  const t = normalizeSpace(text);
  if (!a || !t) return 0;
  const max = Math.min(a.length, t.length, 80);
  for (let n = max; n >= 4; n--) {
    const fragment = side === 'end' ? a.slice(-n) : a.slice(0, n);
    const target = side === 'end' ? t.slice(-n) : t.slice(0, n);
    if (fragment === target) return n;
  }
  return 0;
}

function normalizeSpace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function cssEscape(value) {
  if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(value);
  return String(value).replace(/"/g, '\\"');
}

function ReviewPanel({ mode, selectedBlock, comments, commentsFor, text, setText, submitComment, feedbackCmd, copyToClipboard, quoteAnchor, setSelected, setDrawerMode, setCommentStatus, commentFilter, setCommentFilter }) {
  const counts = countCommentsByStatus(comments);
  const filtered = comments.filter(c => commentFilter === 'all' || c.status === commentFilter);
  const filteredFor = (blockId) => filtered.filter(c => c.blockId === blockId);
  return (
    <>
      <CommentFilters active={commentFilter} setActive={setCommentFilter} counts={counts} />
      {selectedBlock ? <BlockInspector
        block={selectedBlock}
        comments={filteredFor(selectedBlock.id)}
        text={text}
        setText={setText}
        submitComment={submitComment}
        feedbackCmd={feedbackCmd}
        copyToClipboard={copyToClipboard}
        quoteAnchor={quoteAnchor}
        setCommentStatus={setCommentStatus}
      /> : <p className="rk-muted">Select a block, right-click a block, or select text to comment.</p>}

      <div className="rk-drawer-section">
        <div className="rk-drawer-label">All comments</div>
        {filtered.length === 0 ? <p className="rk-muted rk-small">当前筛选下没有评论。</p> : filtered.map(c => (
          <CommentCard key={c.id} comment={c} onClick={() => { setSelected(c.blockId); setDrawerMode('comment'); }} setCommentStatus={setCommentStatus} />
        ))}
      </div>
    </>
  );
}

function countCommentsByStatus(comments) {
  return {
    all: comments.length,
    open: comments.filter(c => c.status === 'open').length,
    resolved: comments.filter(c => c.status === 'resolved').length,
    orphaned: comments.filter(c => c.status === 'orphaned').length,
  };
}

function CommentFilters({ active, setActive, counts }) {
  const labels = { open: '待处理', resolved: '已解决', orphaned: '已失效', all: '全部' };
  return (
    <div className="rk-comment-filters" aria-label="评论筛选">
      {['open', 'orphaned', 'resolved', 'all'].map(status => (
        <button key={status} type="button" className={active === status ? 'is-active' : ''} onClick={() => setActive(status)}>
          {labels[status]} <span className="rk-filter-count">{counts[status] || 0}</span>
        </button>
      ))}
    </div>
  );
}

function BlockInspector({ block, comments, text, setText, submitComment, feedbackCmd, copyToClipboard, quoteAnchor, setCommentStatus }) {
  return (
    <>
      <div className="rk-drawer-section">
        <div className="rk-drawer-label">Selected block</div>
        <code>{block.id}</code> <span className="rk-type-chip">{block.type}</span>
      </div>
      <details className="rk-drawer-section rk-agent-metadata">
        <summary>Agent metadata</summary>
        {block.sourceRange && <>
          <div className="rk-drawer-label">Source</div>
          <div className="rk-source-range">Lines {block.sourceRange.startLine}–{block.sourceRange.endLine}</div>
          {block.sourceExcerpt && <pre className="rk-source-excerpt">{block.sourceExcerpt}</pre>}
        </>}
        <div className="rk-drawer-label">Properties</div>
        <div className="rk-props-grid">
          {Object.entries(block.props || {}).map(([k, v]) => (
            <Fragment key={k}><span className="rk-meta-key">{k}</span><span className="rk-meta-val">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span></Fragment>
          ))}
        </div>
      </details>
      <div className="rk-drawer-section">
        <div className="rk-drawer-label">Comments on this block</div>
        {quoteAnchor?.blockId === block.id && <div className="rk-quote-anchor">
          <div className="rk-drawer-label">Selected text</div>
          <blockquote>{quoteAnchor.selector.exact}</blockquote>
        </div>}
        {comments.length === 0 ? <p className="rk-muted rk-small">No comments yet.</p> : comments.map(c => <CommentCard key={c.id} comment={c} setCommentStatus={setCommentStatus} />)}
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

function CommentCard({ comment: c, onClick, setCommentStatus }) {
  return (
    <div className={`rk-comment-card${onClick ? ' rk-clickable' : ''}`} data-status={c.status} onClick={onClick}>
      <div className="rk-comment-header"><b>{c.blockId}</b><span className="rk-pill" data-status={c.status}>{c.status}</span></div>
      {c.selector?.exact && <blockquote className="rk-comment-quote">{c.selector.exact}</blockquote>}
      <p>{c.text}</p>
      <div className="rk-comment-actions">
        <div className="rk-comment-id">{c.id}</div>
        {setCommentStatus && c.status !== 'orphaned' && <button type="button" onClick={(e) => { e.stopPropagation(); setCommentStatus(c.id, c.status === 'resolved' ? 'open' : 'resolved'); }}>{c.status === 'resolved' ? 'Reopen' : 'Resolve'}</button>}
      </div>
    </div>
  );
}
