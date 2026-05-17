import { RichText } from './utils/richText.tsx';

interface ChecklistItem {
  text: string;
  checked?: boolean;
  note?: string;
}

interface Props {
  title?: string;
  items?: ChecklistItem[];
}

export default function ChecklistBlock({ title, items = [] }: Props) {
  return (
    <section className="rk-checklist-block">
      {title && (
        <h4 className="rk-checklist-title">
          <RichText text={title} />
        </h4>
      )}
      <ul className="rk-checklist" role="list">
        {items.map((item, i) => (
          <li key={i} className="rk-checklist-item" data-checked={item.checked ? 'true' : 'false'}>
            <span className="rk-checklist-check" aria-hidden="true">
              {item.checked ? '✓' : ''}
            </span>
            <span className="rk-checklist-label">
              <RichText text={item.text} />
              {item.note && <span className="rk-checklist-note"> — {item.note}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
