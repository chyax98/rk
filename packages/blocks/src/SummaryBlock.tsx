interface SummaryBlockProps {
  title?: string;
  content: string;
}

export default function SummaryBlock({ title, content }: SummaryBlockProps) {
  return (
    <div>
      {title && <div className="rk-summary-title">{title}</div>}
      <div className="rk-summary-body">{content}</div>
    </div>
  );
}
