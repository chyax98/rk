'use client';

interface ContextMenuProps {
  x: number;
  y: number;
  block: { id: string; type: string; sourceRange?: { startLine: number; endLine: number } } | null;
  feedbackCmd: string;
  onInspect: () => void;
  onComment: () => void;
  onCopy: (value: string) => void;
}

export default function ContextMenu({ x, y, block, feedbackCmd, onInspect, onComment, onCopy }: ContextMenuProps) {
  if (!block) return null;
  const style = { left: Math.min(x, window.innerWidth - 250), top: Math.min(y, window.innerHeight - 260) };
  return (
    <div className="rk-context-menu" style={style} onClick={e => e.stopPropagation()}>
      <div className="rk-context-menu-header">
        <code>{block.id}</code><span className="rk-type-chip">{block.type}</span>
      </div>
      <button className="rk-context-menu-item" onClick={onInspect}>查看 / 源码</button>
      <button className="rk-context-menu-item" onClick={onComment}>💬 评论</button>
      <button className="rk-context-menu-item" onClick={onComment}>✎ 以评论方式建议编辑</button>
      <div className="rk-context-menu-divider" />
      <button className="rk-context-menu-item" onClick={() => onCopy(block.id)}>⎘ 复制 Block ID</button>
      <button className="rk-context-menu-item" onClick={() => onCopy(feedbackCmd)}>⎘ 复制反馈命令</button>
      {block.sourceRange && (
        <button className="rk-context-menu-item" onClick={() => onCopy(`第 ${block.sourceRange!.startLine}–${block.sourceRange!.endLine} 行`)}>
          ⎘ 复制源文件位置
        </button>
      )}
    </div>
  );
}
