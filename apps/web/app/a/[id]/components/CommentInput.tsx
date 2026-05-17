'use client';

interface CommentInputProps {
  text: string;
  setText: (t: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function CommentInput({
  text,
  setText,
  onSubmit,
  disabled,
  placeholder,
}: CommentInputProps) {
  return (
    <>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder || '评论或建议编辑。Agent 编辑源文件；Web UI 不会修改正文内容。'}
      />
      <button className="rk-primary-btn" onClick={onSubmit} disabled={disabled || !text.trim()}>
        添加评论
      </button>
    </>
  );
}
