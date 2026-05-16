export default function SubdocumentBlock({ title, source, artifactId, revision, surface, status = 'linked', summary }) {
  const target = artifactId ? `/a/${artifactId}${revision ? `?rev=${revision}` : ''}` : '';
  return (
    <div className="rk-subdocument-card">
      <div className="rk-subdocument-kicker">Subdocument</div>
      <div className="rk-subdocument-head">
        <h3 className="rk-subdocument-title">{title}</h3>
        <span className="rk-pill" data-status={status}>{status}</span>
      </div>
      {summary && <p className="rk-subdocument-summary">{summary}</p>}
      <div className="rk-subdocument-meta">
        {surface && <span>{surface}</span>}
        {source && <code>{source}</code>}
        {artifactId && <code>{artifactId}</code>}
      </div>
      {target ? <a className="rk-secondary-btn rk-subdocument-link" href={target}>Open subdocument</a> : null}
    </div>
  );
}
