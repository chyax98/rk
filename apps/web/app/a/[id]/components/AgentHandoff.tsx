'use client';

interface AgentHandoffProps {
  feedbackCmd: string;
  copyToClipboard: (s: string) => void;
}

export default function AgentHandoff({ feedbackCmd, copyToClipboard }: AgentHandoffProps) {
  return (
    <div className="rk-drawer-section rk-feedback-hint">
      <div className="rk-drawer-label">Agent 交接</div>
      <p className="rk-muted rk-small">
        将评论路由回 authoring agent，在源文件目录下执行以下命令：
      </p>
      <div className="rk-feedback-cmd">
        <code>{feedbackCmd}</code>
        <button onClick={() => copyToClipboard(feedbackCmd)} title="复制命令">⎘</button>
      </div>
    </div>
  );
}
