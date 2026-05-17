'use client';
import { useState, useCallback } from 'react';
import { BlockFrame } from '@renderkit/blocks';
import { isWideReviewSurface } from '@renderkit/shared/contracts';
import { flattenBlocks, blockLabel, copyToClipboard } from './lib';
import { useComments } from './hooks/useComments';
import { useReviewState } from './hooks/useReviewState';
import { useSelection } from './hooks/useSelection';
import { useHighlights } from './hooks/useHighlights';
import { useKeyboard } from './hooks/useKeyboard';
import ReviewPanel from './components/ReviewPanel';
import ContextMenu from './components/ContextMenu';
import OutlineDrawer from './components/OutlineDrawer';
import SelectionMenu from './components/SelectionMenu';

interface ArtifactViewProps {
  artifactId: string;
  revision: { model: any; sourceText?: string };
  comments: any[];
}

export default function ArtifactView({ artifactId, revision, comments: initialComments }: ArtifactViewProps) {
  const model = revision.model;
  const blocks = model.blocks;
  const theme = model.theme || 'paper-light';
  const surface = model.surface || '';
  const allBlocks = flattenBlocks(blocks);
  const wideReviewSurface = isWideReviewSurface(surface);

  // P0 Bug 1: CLI bin is "renderkit", not "rk". Feedback accepts artifactId.
  const feedbackCmd = `renderkit feedback ${artifactId}`;

  const { comments, commentsFor, blockCommentStatus, submitComment: rawSubmit, setCommentStatus } = useComments(artifactId, initialComments);
  const { reviewMode, setReviewMode, drawerOpen, drawerMode, setDrawerMode, selected, setSelected, outlineOpen, setOutlineOpen, menu, setMenu, openMenu, openDrawer, closeDrawer, handleDrawerMode } = useReviewState();
  const { quoteAnchor, setQuoteAnchor, selectionMenu, captureSelection, clearSelectionMenu, clearQuoteAnchor } = useSelection();
  const [text, setText] = useState('');
  const [commentFilter, setCommentFilter] = useState('open');

  const selectedBlock = allBlocks.find(b => b.id === selected) || null;
  const outlineItems = blocks.map((b: any) => ({ id: b.id, type: b.type, label: blockLabel(b) }));
  const outlineCommentCounts = Object.fromEntries(outlineItems.filter((i: any) => commentsFor(i.id).length > 0).map((i: any) => [i.id, commentsFor(i.id).length]));

  const submitComment = useCallback(async () => {
    const result = await rawSubmit(selected!, text, quoteAnchor?.blockId === selected ? quoteAnchor.selector : null);
    if (result) { setText(''); setQuoteAnchor(null); clearSelectionMenu(); }
  }, [selected, text, quoteAnchor, rawSubmit, setQuoteAnchor, clearSelectionMenu]);

  const commentOnSelection = useCallback(() => {
    if (!quoteAnchor?.blockId) return;
    openDrawer('block', quoteAnchor.blockId);
    clearSelectionMenu();
  }, [quoteAnchor, openDrawer, clearSelectionMenu]);

  useHighlights(comments);
  useKeyboard({ menu, closeMenu: () => setMenu(null), selectionMenu, clearSelectionMenu, drawerOpen, closeDrawer, outlineOpen, setOutlineOpen, clearSelection: () => { setSelected(null); clearQuoteAnchor(); } });

  return (
    <div className={`rk-page${reviewMode ? ' rk-review-mode' : ''}${wideReviewSurface && reviewMode ? ' rk-page-with-pane' : ''}`} data-rk-theme={theme} data-rk-surface={surface || undefined}>
      <main id="rk-main" className="rk-document" aria-label={model.title} onMouseUp={captureSelection} onContextMenuCapture={(e) => { if (!reviewMode) return; const el = (e.target as HTMLElement)?.closest?.('[data-block-id]'); if (el) openMenu(e, el.getAttribute('data-block-id')!); }}>
        <div className="rk-block-stream">
          {blocks.map((block: any) => <BlockFrame key={block.id} block={block} selected={reviewMode && selected === block.id} commentCount={commentsFor(block.id).length} commentStatus={blockCommentStatus(block.id)} reviewMode={reviewMode} onSelect={() => setSelected(block.id)} onComment={() => openDrawer('block', block.id)} onOpenMenu={(e: React.MouseEvent) => openMenu(e, block.id)} onContextMenu={(e: React.MouseEvent) => openMenu(e, block.id)} />)}
        </div>
      </main>

      <div className="rk-floating-tools" aria-label="文档工具">
        <button onClick={() => setReviewMode(v => !v)} title="切换评审模式" className={reviewMode ? 'is-active' : ''}>评审</button>
        <button onClick={() => setOutlineOpen(o => !o)} title="目录">☰</button>
        <button onClick={() => openDrawer('comments', selected)} title="评论">💬{reviewMode && comments.length ? ` ${comments.length}` : ''}</button>
        <button onClick={() => copyToClipboard(feedbackCmd)} title="复制反馈命令">⎘</button>
      </div>

      {outlineOpen && <OutlineDrawer items={outlineItems} selected={selected} commentCounts={outlineCommentCounts} onSelect={setSelected} onClose={() => setOutlineOpen(false)} />}

      {wideReviewSurface && reviewMode && (
        <aside className="rk-review-pane">
          <ReviewPanel mode={drawerMode} onModeChange={handleDrawerMode} selectedBlock={selectedBlock} comments={comments} text={text} setText={setText} submitComment={submitComment} feedbackCmd={feedbackCmd} copyToClipboard={copyToClipboard} quoteAnchor={quoteAnchor} setSelected={setSelected} setDrawerMode={handleDrawerMode} setCommentStatus={setCommentStatus} commentFilter={commentFilter} setCommentFilter={setCommentFilter} commentsFor={commentsFor} />
        </aside>
      )}

      {drawerOpen && !(wideReviewSurface && reviewMode) && (
        <aside className="rk-review-drawer">
          <div className="rk-drawer-head">
            <span>{drawerMode === 'comments' ? '评论' : drawerMode === 'agent' ? 'Agent' : '当前块'}</span>
            <button onClick={closeDrawer}>×</button>
          </div>
          <ReviewPanel mode={drawerMode} onModeChange={handleDrawerMode} selectedBlock={selectedBlock} comments={comments} text={text} setText={setText} submitComment={submitComment} feedbackCmd={feedbackCmd} copyToClipboard={copyToClipboard} quoteAnchor={quoteAnchor} setSelected={setSelected} setDrawerMode={handleDrawerMode} setCommentStatus={setCommentStatus} commentFilter={commentFilter} setCommentFilter={setCommentFilter} commentsFor={commentsFor} />
        </aside>
      )}

      {selectionMenu && <SelectionMenu x={selectionMenu.x} y={selectionMenu.y} onComment={commentOnSelection} />}
      {menu && <ContextMenu x={menu.x} y={menu.y} block={allBlocks.find((b: any) => b.id === menu.blockId)} feedbackCmd={feedbackCmd} onInspect={() => { openDrawer('block', menu.blockId); setMenu(null); }} onComment={() => { openDrawer('block', menu.blockId); setMenu(null); }} onCopy={(value) => { copyToClipboard(value); setMenu(null); }} />}
    </div>
  );
}
