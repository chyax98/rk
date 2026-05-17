export default function QuoteBlock({ quote, cite, role }) {
  return (
    <figure className="rk-quote-block">
      <blockquote>{quote}</blockquote>
      {(cite || role) && <figcaption>{cite && <b>{cite}</b>}{role && <span>{role}</span>}</figcaption>}
    </figure>
  );
}
