interface HeadingBlockProps {
  level?: number;
  text: string;
}

export default function HeadingBlock({ level, text }: HeadingBlockProps) {
  const Tag = `h${Math.min(Math.max(level || 2, 1), 3)}` as keyof JSX.IntrinsicElements;
  return <Tag>{text}</Tag>;
}
