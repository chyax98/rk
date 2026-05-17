'use client';
import type { Comment } from '../hooks/useComments';
import type { DrawerMode } from '../hooks/useReviewState';
import type { QuoteAnchor } from '../hooks/useSelection';
import AgentHandoff from './AgentHandoff';
import BlockInspector from './BlockInspector';
import CommentInput from './CommentInput';
import CommentThread from './CommentThread';

const TABS: { key: DrawerMode; label: string }[] = [
  { key: 'comments', label: '评论' },
  { key: 'block', label: '当前块' },
  { key: 'agent', label: 'Agent' },
];

interface BlockLike {
  id: string;
  type: string;
  props: Record<string, any>;
  sourceRange?: { startLine: number; endLine: number };
  sourceExcerpt?: string;
}

interface ReviewPanelProps {
  mode: DrawerMode;
  onModeChange: (m: DrawerMode) => void;
  selectedBlock: BlockLike | null;
  comments: Comment[];
  text: string;
  setText: (t: string) => void;
  submitComment: () => void;
  feedbackCmd: string;
  copyToClipboard: (s: string) => void;
  quoteAnchor: QuoteAnchor | null;
  setSelected: (id: string | null) => void;
  setDrawerMode: (m: DrawerMode) => void;
  setCommentStatus: (id: string, status: string) => void;
  commentFilter: string;
  setCommentFilter: (s: string) => void;
  commentsFor: (blockId: string) => Comment[];
}

export default function ReviewPanel({
  mode,
  onModeChange,
  selectedBlock,
  comments,
  text,
  setText,
  submitComment,
  feedbackCmd,
  copyToClipboard,
  quoteAnchor,
  setSelected,
  setDrawerMode,
  setCommentStatus,
  commentFilter,
  setCommentFilter,
  commentsFor,
}: ReviewPanelProps) {
  return (
    <div className="rk-review-panel-inner">
      <div className="rk-panel-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={mode === tab.key ? 'is-active' : ''}
            onClick={() => onModeChange(tab.key)}
          >
            {tab.label}
            {tab.key === 'comments' && comments.length > 0 && (
              <span className="rk-filter-count">{comments.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="rk-panel-content">
        {mode === 'comments' && (
          <CommentThread
            comments={comments}
            commentFilter={commentFilter}
            setCommentFilter={setCommentFilter}
            setSelected={setSelected}
            setDrawerMode={setDrawerMode}
            setCommentStatus={setCommentStatus}
          />
        )}

        {mode === 'block' &&
          (selectedBlock ? (
            <BlockInspector
              block={selectedBlock}
              comments={commentsFor(selectedBlock.id)}
              text={text}
              setText={setText}
              submitComment={submitComment}
              quoteAnchor={quoteAnchor}
              setCommentStatus={setCommentStatus}
            />
          ) : (
            <div className="rk-drawer-section">
              <p className="rk-muted rk-small">点击一个块、右键点击或选择文本来评论。</p>
              {comments.length > 0 && (
                <CommentThread
                  comments={comments}
                  commentFilter={commentFilter}
                  setCommentFilter={setCommentFilter}
                  setSelected={setSelected}
                  setDrawerMode={setDrawerMode}
                  setCommentStatus={setCommentStatus}
                />
              )}
            </div>
          ))}

        {mode === 'agent' && (
          <div>
            <AgentHandoff feedbackCmd={feedbackCmd} copyToClipboard={copyToClipboard} />
            {selectedBlock && (
              <div className="rk-drawer-section" style={{ marginTop: 12 }}>
                <CommentInput
                  text={text}
                  setText={setText}
                  onSubmit={submitComment}
                  placeholder="在 Agent 交接模式下也可以添加评论..."
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
