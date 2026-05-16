export default function CalloutBlock({ tone = 'info', title, content }) {
  return (
    <div>
      <div className="rk-callout-title">{title || tone}</div>
      <div className="rk-block-paragraph">{content}</div>
    </div>
  );
}
