import {
  AlertOctagon,
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  FileText,
  Info,
  Lightbulb,
} from 'lucide-react';
import { RichText } from './utils/richText.tsx';

const TONE_ICON = {
  info: Info,
  warning: AlertTriangle,
  danger: AlertOctagon,
  success: CheckCircle2,
  tip: Lightbulb,
  decision: BadgeCheck,
  note: FileText,
} as const;

const TONE_TITLE: Record<string, string> = {
  info: '背景',
  warning: '注意',
  danger: '禁止操作',
  success: '已完成',
  tip: '提示',
  decision: '决定',
  note: '说明',
};

interface Props {
  tone?: string;
  title?: string;
  content?: string;
}

export default function CalloutBlock({ tone = 'info', title, content }: Props) {
  const t = (tone in TONE_ICON ? tone : 'info') as keyof typeof TONE_ICON;
  const Icon = TONE_ICON[t];
  const heading = title || TONE_TITLE[t] || '';
  return (
    <aside className={`rk-callout rk-callout-${t}`} role={t === 'danger' ? 'alert' : 'note'}>
      <Icon className="rk-callout-icon" size={20} strokeWidth={2} aria-hidden="true" />
      <div className="rk-callout-body">
        {heading && (
          <p className="rk-callout-title">
            <RichText text={heading} />
          </p>
        )}
        {content && (
          <p className="rk-callout-content">
            <RichText text={content} />
          </p>
        )}
      </div>
    </aside>
  );
}
