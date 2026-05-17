interface ParagraphBlockProps {
  markdown: string;
}

export default function ParagraphBlock({ markdown }: ParagraphBlockProps) {
  return <div className="rk-block-paragraph">{markdown}</div>;
}
