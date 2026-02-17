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

export type NoteEmbeddingRunResult = {
  scheduled: number;
  succeeded: number;
  failed: number;
  noteIds: string[];
};

export type NoteEmbeddingSimilarSearchInput = {
  limit?: number;
  minScore?: number;
};

export type NoteEmbeddingSimilarNoteDto = {
  noteId: string;
  title: string;
  summary: string | null;
  tags: string[];
  notebook: {
    id: string;
    name: string;
  };
  updatedAt: Date;
  score: number;
};

export type NoteEmbeddingServiceErrorCode = "VALIDATION_ERROR" | "NOT_FOUND" | "INTERNAL_ERROR";

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

export type NoteEmbeddingServicePrismaClient = Pick<
  Prisma.TransactionClient,
  "note" | "noteEmbedding" | "$executeRawUnsafe" | "$queryRaw"
>;

export interface NoteEmbeddingPipelineService {
  prepareRebuildForOwner(ownerId: string, input?: unknown): Promise<NoteEmbeddingPlanResult>;
  rebuildForOwner(ownerId: string, input?: unknown): Promise<NoteEmbeddingRunResult>;
  searchSimilarNotesForOwner(
    ownerId: string,
    noteId: string,
    input?: unknown,
  ): Promise<NoteEmbeddingSimilarNoteDto[]>;
}
