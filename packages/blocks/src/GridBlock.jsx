import RenderBlock from './RenderBlock.jsx';

export default function GridBlock({ columns = 2, gap = 'normal', title, children = [] }) {
  const cols = Math.min(Math.max(Number(columns) || 2, 1), 6);
  return (
    <div className="rk-grid-block" data-gap={gap} style={{ '--rk-grid-cols': cols }}>
      {title && <div className="rk-grid-title">{title}</div>}
      <div className="rk-grid-cells">
        {children.map((block) => (
          <div className={`rk-grid-cell rk-grid-cell-${block.type}`} key={block.id} data-block-id={block.id} data-block-type={block.type}>
            <RenderBlock block={block} />
          </div>
        ))}
      </div>
    </div>
  );
}
