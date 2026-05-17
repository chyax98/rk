import { RichText } from './utils/richText.tsx';

interface Props {
  text?: string;
  level?: 1 | 2 | 3 | 4;
  anchor?: string;
  eyebrow?: string;
}

const TAGS = { 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4' } as const;

export default function HeadingBlock({ text = '', level = 2, anchor, eyebrow }: Props) {
  const Tag = TAGS[level] ?? 'h2';
  const id =
    anchor ||
    text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fff]+/g, '-')
      .replace(/^-|-$/g, '');
  return (
    <div className={`rk-heading rk-heading-${level}`}>
      {eyebrow && <span className="rk-heading-eyebrow">{eyebrow}</span>}
      <Tag id={id} className="rk-heading-text">
        <RichText text={text} />
        <a href={`#${id}`} className="rk-heading-anchor" aria-hidden="true">
          #
        </a>
      </Tag>
    </div>
  );
}
