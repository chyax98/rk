export default function DecisionBlock({ question, chosen, status, rationale, alternatives }) {
  return (
    <div>
      <h3 className="rk-decision-question">{question}<span className="rk-decision-status">{status || 'draft'}</span></h3>
      <div className="rk-decision-kv"><b>Chosen</b><span>{chosen}</span></div>
      {Array.isArray(rationale) && rationale.length > 0 && (
        <><b className="rk-muted">Rationale</b><ul className="rk-decision-list">{rationale.map((x, i) => <li key={i}>{x}</li>)}</ul></>
      )}
      {Array.isArray(alternatives) && alternatives.length > 0 && (
        <><b className="rk-muted">Alternatives</b><ul className="rk-decision-list">{alternatives.map((x, i) => <li key={i}>{x.name || x}: {x.reason || ''}</li>)}</ul></>
      )}
    </div>
  );
}
