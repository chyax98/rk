import { RichText } from './utils/richText.tsx';

interface Props {
  text?: string;
  align?: 'left' | 'center' | 'right';
  lead?: boolean;
}

export default function ParagraphBlock({ text = '', align, lead }: Props) {
  if (!text.trim()) return null;
  return (
    <p
      className={`rk-paragraph${lead ? ' rk-paragraph-lead' : ''}`}
      style={align && align !== 'left' ? { textAlign: align } : undefined}
    >
      <RichText text={text} />
    </p>
  );
}
