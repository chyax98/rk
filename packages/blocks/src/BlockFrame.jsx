import RenderBlock from './RenderBlock.jsx';

/**
 * BlockFrame wraps a renderable block with review affordances.
 * It never mutates body content: selection, context menu and comments only
 * create review signals for the authoring agent/CLI loop.
 */
export default function BlockFrame({
  block,
  onSelect,
  onComment,
  onContextMenu,
  onOpenMenu,
  selected = false,
  commentCount = 0,
  reviewMode = false,
}) {
  const cls = `rk-block rk-block-${block.type}${selected ? ' rk-selected' : ''}`;
  const width = block.props?.width || 'full';
  return (
    <section
      id={`rk-block-${block.id}`}
      className={cls}
      data-block-id={block.id}
      data-block-type={block.type}
      data-rk-width={width}
      {...(selected ? { 'data-rk-selected': '' } : {})}
      {...(commentCount > 0 ? { 'data-rk-has-comments': '', 'data-comment-count': commentCount } : {})}
      {...(block.props?.tone ? { 'data-tone': block.props.tone } : {})}
      tabIndex={reviewMode ? 0 : undefined}
      onClick={reviewMode ? onSelect : undefined}
      onMouseDown={(e) => { if (reviewMode && e.button === 2 && onContextMenu) onContextMenu(e); }}
      onContextMenu={reviewMode ? onContextMenu : undefined}
      {...(reviewMode ? { 'data-rk-review-mode': '' } : {})}
    >
      {reviewMode && <div className="rk-block-tools" aria-label="Block review tools">
        <span className="rk-block-id">{block.id}</span>
        <span className="rk-block-type-badge">{block.type}</span>
        <button
          className="rk-more-btn"
          type="button"
          onClick={e => { e.stopPropagation(); onOpenMenu ? onOpenMenu(e) : onSelect?.(); }}
          title="Block actions"
        >
          ⋯
        </button>
        <button
          className="rk-comment-btn"
          type="button"
          onClick={e => { e.stopPropagation(); onComment ? onComment() : onSelect?.(); }}
          title="Comment on this block"
        >
          💬 {commentCount || ''}
        </button>
      </div>}
      <RenderBlock block={block} />
    </section>
  );
}
