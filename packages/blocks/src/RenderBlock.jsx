import { registry } from './registry.jsx';

/**
 * Renders a single block by type via the registry.
 * Includes per-block error fallback.
 */
export default function RenderBlock({ block }) {
  const Comp = registry[block.type];
  if (!Comp) return <div className="rk-error-box">Unknown block: {block.type}</div>;
  try {
    return <Comp {...block.props} />;
  } catch (e) {
    return <div className="rk-error-box">Block render error: {String(e.message || e)}</div>;
  }
}
