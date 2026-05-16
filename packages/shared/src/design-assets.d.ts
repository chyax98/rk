export type DesignResourcePriority = 'P0' | 'P1' | 'P2' | 'P3';
export type DesignResourceIntegrationStatus =
  | 'partially-integrated'
  | 'spec-integrated'
  | 'documented-not-bundled'
  | 'mapped-to-tokens'
  | 'researched-future-surface';

export interface DesignResource {
  id: string;
  priority: DesignResourcePriority;
  repo: string;
  url: string;
  localPath: string;
  commit: string;
  primaryValue: string;
  integrationStatus: DesignResourceIntegrationStatus;
  adoptedIn: readonly string[];
  recommendedUse: readonly string[];
  risks: readonly string[];
}

export const DESIGN_RESOURCES: readonly DesignResource[];
export function listDesignResources(options?: { priority?: DesignResourcePriority }): DesignResource[];
export function getDesignResource(id: string): DesignResource | null;
export function listDesignResourcePriorities(): DesignResourcePriority[];
