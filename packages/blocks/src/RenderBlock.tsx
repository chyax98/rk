import { registry } from './registry';

interface RenderBlockProps {
  block: {
    id: string;
    type: string;
    props?: Record<string, unknown>;
    [k: string]: unknown;
  };
}

export default function RenderBlock({ block }: RenderBlockProps) {
  const Comp = registry[block.type];
  if (!Comp) return <div className="rk-error-box">Unknown block: {block.type}</div>;
  try {
    return <Comp {...(block.props || {})} />;
  } catch (e) {
    return (
      <div className="rk-error-box">Block render error: {String((e as Error).message || e)}</div>
    );
  }
}
