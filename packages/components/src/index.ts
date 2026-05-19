// ─── Component registry (for CLI / tooling) ──────────────────────

export interface ComponentDescriptor {
  tag: string;
  className: string;
  attributes: string[];
  childElements?: string[];
  description: string;
  derived?: boolean;
}

import { COMPONENTS_BY_TAG as catalogByTag, COMPONENTS as catalogComponents } from './catalog.mjs';

export const COMPONENTS = catalogComponents as readonly ComponentDescriptor[];
export const COMPONENTS_BY_TAG = catalogByTag as Record<string, ComponentDescriptor>;
