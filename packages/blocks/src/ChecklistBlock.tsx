interface ChecklistItem {
  text: string;
  checked?: boolean;
}

interface ChecklistBlockProps {
  title?: string;
  items?: ChecklistItem[];
}

export default function ChecklistBlock({ title, items = [] }: ChecklistBlockProps) {
  return (
    <div className="rk-checklist-block">
      {title && <div className="rk-checklist-title">{title}</div>}
      <ul className="rk-checklist-items">
        {(items || []).map((item, i) => (
          <li key={i} data-checked={item.checked ? 'true' : 'false'}>
            <span className="rk-checkmark" aria-hidden="true">{item.checked ? '✓' : '○'}</span>
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
