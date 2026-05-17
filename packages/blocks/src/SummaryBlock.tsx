import { RichText } from './utils/richText.tsx';

interface Props {
  title?: string;
  content?: string;
  items?: string[];
}

export default function SummaryBlock({ title, content, items = [] }: Props) {
  return (
    <section className="rk-summary-block">
      <p className="rk-summary-title">{title || '摘要'}</p>
      {content && (
        <p className="rk-summary-content">
          <RichText text={content} />
        </p>
      )}
      {items.length > 0 && (
        <ul className="rk-summary-items">
          {items.map((item, i) => (
            <li key={i}>
              <RichText text={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
