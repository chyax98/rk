import { RichText } from './utils/richText.tsx';

/* Inline SVG sprite — each icon is a 24×24 path */
const ICONS: Record<string, string> = {
  info:     'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 4a1.2 1.2 0 1 1 0 2.4A1.2 1.2 0 0 1 12 6zm0 4h.01a1 1 0 0 1 1 1v5a1 1 0 0 1-2 0v-5a1 1 0 0 1 .99-1z',
  warning:  'M12 2 2 19h20L12 2zm0 4 7.5 13h-15L12 6zm-1 4v4h2v-4h-2zm0 6v2h2v-2h-2z',
  danger:   'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM11 7h2v6h-2V7zm0 8h2v2h-2v-2z',
  success:  'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm-1 13.4-3.7-3.7 1.4-1.4 2.3 2.3 4.9-4.9 1.4 1.4-6.3 6.3z',
  tip:      'M12 2a7 7 0 0 1 5.4 11.4c-.6.8-1.4 1.4-1.4 2.6H8c0-1.2-.8-1.8-1.4-2.6A7 7 0 0 1 12 2zm-2 16h4a2 2 0 0 1-4 0z',
  decision: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138z',
  note:     'M11 17a1 1 0 0 0 2 0v-6a1 1 0 0 0-2 0v6zm1-8a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-7 2a7 7 0 1 1 14 0 7 7 0 0 1-14 0zm7-9a9 9 0 1 0 0 18A9 9 0 0 0 12 2z',
};

const TONE_ICON: Record<string, string> = {
  info: 'info', warning: 'warning', danger: 'danger',
  success: 'success', tip: 'tip', decision: 'decision', note: 'note',
};

const TONE_TITLE: Record<string, string> = {
  info: '背景', warning: '注意', danger: '禁止操作',
  success: '已完成', tip: '提示', decision: '决定', note: '说明',
};

interface Props {
  tone?: string;
  title?: string;
  content?: string;
  icon?: string;
}

function Icon({ name }: { name: string }) {
  const d = ICONS[name] ?? ICONS.info;
  return (
    <svg className="rk-callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function CalloutBlock({ tone = 'info', title, content, icon }: Props) {
  const resolvedTone = TONE_ICON[tone] ? tone : 'info';
  const iconName = icon || TONE_ICON[resolvedTone] || 'info';
  const headingText = title || TONE_TITLE[resolvedTone] || '';
  return (
    <aside className={`rk-callout rk-callout-${resolvedTone}`} role={resolvedTone === 'danger' ? 'alert' : 'note'}>
      <Icon name={iconName} />
      <div className="rk-callout-body">
        {headingText && <p className="rk-callout-title"><RichText text={headingText} /></p>}
        {content && <p className="rk-callout-content"><RichText text={content} /></p>}
      </div>
    </aside>
  );
}
