import type { Prisma } from "@prisma/client";

export type FieldErrors = Record<string, string>;

export type NoteEmbeddingPlanInput = {
  noteIds?: string[];
  limit?: number;
};

export type NoteEmbeddingPlanResult = {
  scheduled: number;
  noteIds: string[];
};

export type NoteEmbeddingServiceErrorCode = "VALIDATION_ERROR" | "NOT_FOUND";

export class NoteEmbeddingServiceError extends Error {
  readonly code: NoteEmbeddingServiceErrorCode;
  readonly status: number;
  readonly fields?: FieldErrors;

  constructor(code: NoteEmbeddingServiceErrorCode, status: number, message: string, fields?: FieldErrors) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function isNoteEmbeddingServiceError(error: unknown): error is NoteEmbeddingServiceError {
  return error instanceof NoteEmbeddingServiceError;
}

export type NoteEmbeddingServicePrismaClient = Pick<Prisma.TransactionClient, "note" | "noteEmbedding">;

export interface NoteEmbeddingPipelineService {
  prepareRebuildForOwner(ownerId: string, input?: unknown): Promise<NoteEmbeddingPlanResult>;
}

