'use client';
import { useState, useCallback } from 'react';
import { BlockFrame } from '@renderkit/blocks';
import { isWideReviewSurface } from '@renderkit/shared/contracts';
import { useComments } from './hooks/useComments';
import { useReviewState, type DrawerMode } from './hooks/useReviewState';
import { useSelection } from './hooks/useSelection';
import { useHighlights } from './hooks/useHighlights';
import { useKeyboard } from './hooks/useKeyboard';
import ReviewPanel from './components/ReviewPanel';
import ContextMenu from './components/ContextMenu';
import OutlineDrawer from './components/OutlineDrawer';
import SelectionMenu from './components/SelectionMenu';

function flattenBlocks(blocks: any[]): any[] {
  const out: any[] = [];
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

function blockLabel(block: any): string {
  if (block.type === 'heading') return block.props?.text || block.id;
  if (block.props?.title) return block.props.title;
  if (block.props?.question) return block.props.question;
  return block.id;
}

function copyToClipboard(str: string) {
  navigator.clipboard?.writeText(str).catch(() => {});
}

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

  // Fix P0 Bug 1: use correct CLI bin name
  const feedbackCmd = `renderkit feedback ${artifactId}`;

  // Hooks
  const { comments, commentsFor, blockCommentStatus, submitComment: rawSubmit, setCommentStatus } = useComments(artifactId, initialComments);
  const { reviewMode, setReviewMode, drawerOpen, drawerMode, setDrawerMode, selected, setSelected, outlineOpen, setOutlineOpen, openDrawer, closeDrawer } = useReviewState();
  const { quoteAnchor, setQuoteAnchor, selectionMenu, captureSelection, clearSelectionMenu, clearQuoteAnchor } = useSelection();
  const [text, setText] = useState('');
  const [commentFilter, setCommentFilter] = useState('open');
  const [menu, setMenu] = useState<{ x: number; y: number; blockId: string } | null>(null);

  const selectedBlock = allBlocks.find((b: any) => b.id === selected) || null;

  const outlineItems = blocks.map((b: any) => ({ id: b.id, type: b.type, label: blockLabel(b) }));
  const outlineCommentCounts: Record<string, number> = {};
  for (const item of outlineItems) {
    const count = commentsFor(item.id).length;
    if (count > 0) outlineCommentCounts[item.id] = count;
  }

  // Wrap submitComment to use hook's signature
  const submitComment = useCallback(async () => {
    const result = await rawSubmit(
      selected!,
      text,
      quoteAnchor?.blockId === selected ? quoteAnchor.selector : null,
    );
    if (result) {
      setText('');
      setQuoteAnchor(null);
      clearSelectionMenu();
    }
  }, [selected, text, quoteAnchor, rawSubmit, setQuoteAnchor, clearSelectionMenu]);

  function openMenu(e: React.MouseEvent, blockId: string) {
    if (!reviewMode) return;
    e.preventDefault();
    e.stopPropagation();
    setSelected(blockId);
    setMenu({ x: e.clientX || 260, y: e.clientY || 160, blockId });
  }

  function commentOnSelection() {
    if (!quoteAnchor?.blockId) return;
    openDrawer('block', quoteAnchor.blockId);
    clearSelectionMenu();
  }

  useHighlights(comments);

  useKeyboard({
    menu,
    closeMenu: () => setMenu(null),
    selectionMenu,
    clearSelectionMenu,
    drawerOpen,
    closeDrawer,
    outlineOpen,
    setOutlineOpen,
    clearSelection: () => { setSelected(null); clearQuoteAnchor(); },
  });

  return (
    <div
      className={`rk-page${reviewMode ? ' rk-review-mode' : ''}${wideReviewSurface && reviewMode ? ' rk-page-with-pane' : ''}`}
      data-rk-theme={theme}
      data-rk-surface={surface || undefined}
    >
      <main
        id="rk-main"
        className="rk-document"
        aria-label={model.title}
        onMouseUp={captureSelection}
        onContextMenuCapture={(e) => {
          if (!reviewMode) return;
          const el = (e.target as HTMLElement)?.closest?.('[data-block-id]');
          if (el) openMenu(e, el.getAttribute('data-block-id')!);
        }}
      >
        <div className="rk-block-stream">
          {blocks.map((block: any) => (
            <BlockFrame
              key={block.id}
              block={block}
              selected={reviewMode && selected === block.id}
              commentCount={commentsFor(block.id).length}
              commentStatus={blockCommentStatus(block.id)}
              reviewMode={reviewMode}
              onSelect={() => setSelected(block.id)}
              onComment={() => openDrawer('block', block.id)}
              onOpenMenu={(e: React.MouseEvent) => openMenu(e, block.id)}
              onContextMenu={(e: React.MouseEvent) => openMenu(e, block.id)}
            />
          ))}
        </div>
      </main>

      <div className="rk-floating-tools" aria-label="文档工具">
        <button onClick={() => setReviewMode(v => !v)} title="切换评审模式" className={reviewMode ? 'is-active' : ''}>评审</button>
        <button onClick={() => setOutlineOpen(o => !o)} title="目录">☰</button>
        <button onClick={() => openDrawer('comments', selected)} title="评论">💬{reviewMode && comments.length ? ` ${comments.length}` : ''}</button>
        <button onClick={() => copyToClipboard(feedbackCmd)} title="复制反馈命令">⎘</button>
      </div>

      {outlineOpen && (
        <OutlineDrawer
          items={outlineItems}
          selected={selected}
          commentCounts={outlineCommentCounts}
          onSelect={setSelected}
          onClose={() => setOutlineOpen(false)}
        />
      )}

      {wideReviewSurface && reviewMode && (
        <aside className="rk-review-pane">
          <ReviewPanel
            mode={drawerMode}
            onModeChange={setDrawerMode}
            selectedBlock={selectedBlock}
            comments={comments}
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
            commentsFor={commentsFor}
          />
        </aside>
      )}

      {drawerOpen && !(wideReviewSurface && reviewMode) && (
        <aside className="rk-review-drawer">
          <div className="rk-drawer-head">
            <span>{drawerMode === 'comments' ? '评论' : drawerMode === 'agent' ? 'Agent' : '当前块'}</span>
            <button onClick={closeDrawer}>×</button>
          </div>
          <ReviewPanel
            mode={drawerMode}
            onModeChange={setDrawerMode}
            selectedBlock={selectedBlock}
            comments={comments}
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
            commentsFor={commentsFor}
          />
        </aside>
      )}

      {selectionMenu && (
        <SelectionMenu x={selectionMenu.x} y={selectionMenu.y} onComment={commentOnSelection} />
      )}

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          block={allBlocks.find((b: any) => b.id === menu.blockId)}
          feedbackCmd={feedbackCmd}
          onInspect={() => { openDrawer('block', menu.blockId); setMenu(null); }}
          onComment={() => { openDrawer('block', menu.blockId); setMenu(null); }}
          onCopy={(value) => { copyToClipboard(value); setMenu(null); }}
        />
      )}
    </div>
  );
}
