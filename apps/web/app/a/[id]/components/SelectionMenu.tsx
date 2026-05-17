'use client';

interface SelectionMenuProps {
  x: number;
  y: number;
  onComment: () => void;
}

export default function SelectionMenu({ x, y, onComment }: SelectionMenuProps) {
  return (
    <div className="rk-selection-menu" style={{ left: x, top: y }}>
      <button onClick={onComment}>评论选中内容</button>
    </div>
  );
}
