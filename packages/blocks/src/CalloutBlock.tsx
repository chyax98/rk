interface CalloutBlockProps {
  tone?: string;
  title?: string;
  content?: string;
}

export default function CalloutBlock({ tone = 'info', title, content }: CalloutBlockProps) {
  return (
    <div>
      <div className="rk-callout-title">{title || tone}</div>
      <div className="rk-block-paragraph">{content}</div>
    </div>
  );
}
