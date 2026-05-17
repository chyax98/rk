import type { ComponentType } from 'react';

/**
 * Creates a dispatcher component that selects a variant based on props.
 * Falls back to variants['default'] if the resolved key is not found.
 */
export function createBlockDispatcher<P extends Record<string, unknown>>(
  variants: Record<string, ComponentType<P>>,
  resolveKey: (props: P) => string,
): ComponentType<P> {
  return function BlockDispatcher(props: P) {
    const key = resolveKey(props);
    const Component = variants[key] ?? variants['default'];
    if (!Component) return null;
    return <Component {...props} />;
  };
}
