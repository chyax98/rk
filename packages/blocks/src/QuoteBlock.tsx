interface QuoteBlockProps {
  quote: string;
  cite?: string;
  role?: string;
}

export default function QuoteBlock({ quote, cite, role }: QuoteBlockProps) {
  return (
    <figure className="rk-quote-block">
      <blockquote>{quote}</blockquote>
      {(cite || role) && <figcaption>{cite && <b>{cite}</b>}{role && <span>{role}</span>}</figcaption>}
    </figure>
  );
}
