import type {
  ArtifactBundle,
  ArtifactComment,
  ArtifactMeta,
  ArtifactRevision,
  Diagnostic,
  FeedbackPayload,
  RenderKitModel,
  TextQuoteSelector,
} from '@renderkit/shared';

type StoreError = { ok: false; status?: number; error?: string; errors?: Diagnostic[]; warnings?: Diagnostic[] };

export function ensureStore(): Promise<void>;
export function listArtifacts(): Promise<ArtifactMeta[]>;
export function createArtifact(source: string, title?: string): Promise<
  | { ok: true; artifact: ArtifactMeta; revision: number; model: RenderKitModel; warnings: Diagnostic[] }
  | StoreError
>;
export function addRevision(id: string, source: string, resolvedCommentIds?: string[]): Promise<
  | {
      ok: true;
      revision: number;
      model: RenderKitModel;
      diff: { addedBlocks: string[]; removedBlocks: string[]; modifiedBlocks: string[]; orphanedComments: string[] };
      resolved: string[];
      warnings: Diagnostic[];
    }
  | StoreError
>;
export function getArtifactMeta(id: string): Promise<ArtifactMeta | null>;
export function getArtifact(id: string, rev?: number | null): Promise<ArtifactBundle | null>;
export function getRevision(id: string, rev: number): Promise<ArtifactRevision | null>;
export function getComments(id: string): Promise<ArtifactComment[]>;
export function addComment(id: string, blockId: string, text: string, selector?: TextQuoteSelector | null): Promise<
  | { ok: true; comment: ArtifactComment }
  | StoreError
>;
export function updateCommentStatus(id: string, commentId: string, status: 'open' | 'resolved'): Promise<
  | { ok: true; comment: ArtifactComment }
  | StoreError
>;
export function getFeedback(id: string): Promise<FeedbackPayload | null>;
