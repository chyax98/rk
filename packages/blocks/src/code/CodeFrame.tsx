import type { ReactNode } from 'react';

interface CodeFrameProps {
  filename?: string;
  language?: string;
  frame?: 'editor' | 'terminal' | 'none';
  children: ReactNode;
}

export default function CodeFrame({ filename, language, frame = 'none', children }: CodeFrameProps) {
  if (frame === 'none' && !filename) return <>{children}</>;

  const frameClass = frame === 'terminal'
    ? 'rk-code-frame rk-code-frame-terminal'
    : 'rk-code-frame rk-code-frame-editor';

  return (
    <div className={frameClass}>
      {(frame !== 'none' || filename) && (
        <div className="rk-code-frame-bar">
          <span className="rk-code-frame-dots">
            <i /><i /><i />
          </span>
          {(filename || language) && (
            <span className="rk-code-frame-tab">
              {filename || language || ''}
            </span>
          )}
        </div>
      )}
      <div className="rk-code-frame-body">
        {children}
      </div>
    </div>
  );
}
