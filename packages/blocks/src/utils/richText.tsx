/**
 * Inline markdown renderer — handles **bold**, *italic*, `code`, [text](url), ~~strike~~
 * No external deps, no dangerouslySetInnerHTML. Pure React nodes.
 */

import type { ReactNode } from 'react';

type Segment =
  | { t: 'text'; v: string }
  | { t: 'bold'; v: string }
  | { t: 'italic'; v: string }
  | { t: 'code'; v: string }
  | { t: 'strike'; v: string }
  | { t: 'link'; v: string; href: string };

const INLINE_RE =
  /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|~~(.+?)~~|\[(.+?)\]\(([^)]+)\))/g;

export function parseInline(text: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > last) segments.push({ t: 'text', v: text.slice(last, m.index) });
    if (m[2] !== undefined)      segments.push({ t: 'bold',   v: m[2] });
    else if (m[3] !== undefined) segments.push({ t: 'italic', v: m[3] });
    else if (m[4] !== undefined) segments.push({ t: 'code',   v: m[4] });
    else if (m[5] !== undefined) segments.push({ t: 'strike', v: m[5] });
    else if (m[6] !== undefined) segments.push({ t: 'link',   v: m[6], href: m[7] });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ t: 'text', v: text.slice(last) });
  return segments;
}

export function RichText({ text, className }: { text: string; className?: string }): ReactNode {
  if (!text) return null;
  const segs = parseInline(text);
  const nodes = segs.map((s, i) => {
    switch (s.t) {
      case 'bold':   return <strong key={i}>{s.v}</strong>;
      case 'italic': return <em key={i}>{s.v}</em>;
      case 'code':   return <code key={i} className="rk-inline-code">{s.v}</code>;
      case 'strike': return <s key={i}>{s.v}</s>;
      case 'link':   return <a key={i} href={s.href} className="rk-link" target={s.href.startsWith('http') ? '_blank' : undefined} rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}>{s.v}</a>;
      default:       return s.v;
    }
  });
  return className ? <span className={className}>{nodes}</span> : <>{nodes}</>;
}
