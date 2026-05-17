interface ImageBlockProps {
  src?: string;
  alt?: string;
  title?: string;
  caption?: string;
  aspect?: string;
}

export default function ImageBlock({ src, alt = '', title, caption, aspect }: ImageBlockProps) {
  return (
    <figure className="rk-image-block" data-aspect={aspect || undefined}>
      {title && <figcaption className="rk-image-title">{title}</figcaption>}
      <div className="rk-image-frame">
        {src ? (
          <img src={src} alt={alt || caption || title || ''} loading="lazy" />
        ) : (
          <div className="rk-error-box">Image block requires src.</div>
        )}
      </div>
      {caption && <figcaption className="rk-image-caption">{caption}</figcaption>}
    </figure>
  );
}
