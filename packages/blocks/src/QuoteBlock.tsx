import { RichText } from './utils/richText.tsx';

interface Props {
  quote?: string;
  attribution?: string;
  source?: string;
}

export default function QuoteBlock({ quote = '', attribution, source }: Props) {
  return (
    <figure className="rk-quote-block">
      <blockquote className="rk-quote-text">
        <RichText text={quote} />
      </blockquote>
      {(attribution || source) && (
        <figcaption className="rk-quote-attribution">
          {attribution}
          {source && attribution ? `, ${source}` : source}
        </figcaption>
      )}
    </figure>
  );
}
