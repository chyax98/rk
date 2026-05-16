export default function HeadingBlock({ level, text }) {
  const Tag = `h${Math.min(Math.max(level || 2, 1), 3)}`;
  return <Tag>{text}</Tag>;
}
