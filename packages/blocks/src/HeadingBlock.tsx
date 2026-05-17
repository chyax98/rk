interface HeadingBlockProps {
  level?: number;
  text: string;
}

export default function HeadingBlock({ level, text }: HeadingBlockProps) {
  const Tag = `h${Math.min(Math.max(level || 2, 1), 3)}` as 'h1' | 'h2' | 'h3';
  return <Tag>{text}</Tag>;
}
