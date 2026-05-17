import { RichText } from './utils/richText.tsx';

interface Props {
  question?: string;
  chosen?: string;
  rationale?: string;
  status?: string;
  alternatives?: string[];
}

export default function DecisionBlock({
  question = '',
  chosen,
  rationale,
  status = 'decided',
  alternatives = [],
}: Props) {
  return (
    <article className="rk-decision-block">
      <header className="rk-decision-header">
        <p className="rk-decision-eyebrow">决策记录 · {status}</p>
        <h4 className="rk-decision-question">
          <RichText text={question} />
        </h4>
      </header>
      <div className="rk-decision-body">
        {chosen && (
          <div className="rk-decision-chosen">
            <p className="rk-decision-chosen-label">✓ 选择</p>
            <p>
              <RichText text={chosen} />
            </p>
          </div>
        )}
        {rationale && (
          <p className="rk-decision-rationale">
            <RichText text={rationale} />
          </p>
        )}
        {alternatives.length > 0 && (
          <details className="rk-decision-alternatives">
            <summary>其他方案 ({alternatives.length})</summary>
            <ul>
              {alternatives.map((a, i) => (
                <li key={i}>
                  <RichText text={a} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </article>
  );
}
