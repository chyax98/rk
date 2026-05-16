import type { ArtifactComment, ArtifactMeta, Diagnostic, FeedbackPayload } from '@renderkit/shared';

export interface CreateArtifactRequest { source: string; title?: string }
export interface CreateArtifactResponse { ok: true; artifactId: string; revision: number; path: string; url: string; warnings?: Diagnostic[] }

export interface AddRevisionRequest { source: string; resolvedCommentIds?: string[] }
export interface AddRevisionResponse {
  ok: true;
  artifactId: string;
  revision: number;
  path: string;
  url: string;
  diff: { addedBlocks: string[]; removedBlocks: string[]; modifiedBlocks: string[]; orphanedComments: string[] };
  resolved: string[];
  warnings?: Diagnostic[];
}

export interface ArtifactStatusResponse {
  ok: true;
  artifact: ArtifactMeta;
  revision: number;
  comments: { open: number; resolved: number; orphaned: number };
}

export interface AddCommentRequest { blockId: string; text: string; selector?: unknown }
export interface AddCommentResponse { ok: true; comment: ArtifactComment }
export interface UpdateCommentStatusRequest { status: 'open' | 'resolved' }
export interface UpdateCommentStatusResponse { ok: true; comment: ArtifactComment }
export type FeedbackResponse = { ok: true } & FeedbackPayload;

export interface ApiErrorResponse { ok: false; error?: string | { code: string; message: string }; errors?: Diagnostic[]; warnings?: Diagnostic[] }
