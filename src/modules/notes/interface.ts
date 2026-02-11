import type { NoteEdgeOrigin, NoteEdgeStatus, Prisma, Visibility } from "@prisma/client";

export type NoteCreateInput = {
  notebookId: string;
  visibility?: Visibility;
  title: string;
  contentMd: string;
  summary?: string | null;
  tags?: string[];
};

export type NoteUpdateInput = Partial<NoteCreateInput>;

export type NoteSearchQuery = {
  q?: string;
  tag?: string;
  domain?: string;
};

export type NoteEdgeActionInput = {
  edgeId: string;
};

export type OwnerNoteListItemDto = {
  id: string;
  notebookId: string;
  visibility: Visibility;
  title: string;
  summary: string | null;
  tags: string[];
  updatedAt: Date;
  notebook: {
    id: string;
    name: string;
  };
};

export type OwnerNoteDetailDto = {
  id: string;
  ownerId: string;
  notebookId: string;
  visibility: Visibility;
  title: string;
  contentMd: string;
  summary: string | null;
  tags: string[];
  updatedAt: Date;
  notebook: {
    id: string;
    name: string;
  };
};

export type OwnerCandidateEdgeDto = {
  id: string;
  fromId: string;
  toId: string;
  relationType: string;
  weight: number | null;
  status: NoteEdgeStatus;
  origin: NoteEdgeOrigin;
  reason: string | null;
  updatedAt: Date;
  from: {
    id: string;
    title: string;
  };
  to: {
    id: string;
    title: string;
  };
};

export type NoteFieldErrors = Record<string, string>;

export type NoteServiceErrorCode = "VALIDATION_ERROR" | "CONFLICT" | "NOT_FOUND" | "FORBIDDEN";

export class NoteServiceError extends Error {
  readonly code: NoteServiceErrorCode;
  readonly status: number;
  readonly fields?: NoteFieldErrors;

  constructor(code: NoteServiceErrorCode, status: number, message: string, fields?: NoteFieldErrors) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function isNoteServiceError(error: unknown): error is NoteServiceError {
  return error instanceof NoteServiceError;
}

export type NotesServicePrismaClient = Pick<Prisma.TransactionClient, "notebook" | "note" | "noteEdge">;

export interface NotesService {
  listNotesForOwner(ownerId: string): Promise<OwnerNoteListItemDto[]>;
  searchNotesForOwner(ownerId: string, query: NoteSearchQuery): Promise<OwnerNoteListItemDto[]>;
  getNoteForOwner(ownerId: string, noteId: string): Promise<OwnerNoteDetailDto>;
  createNote(ownerId: string, input: unknown): Promise<OwnerNoteDetailDto>;
  updateNote(ownerId: string, noteId: string, input: unknown): Promise<OwnerNoteDetailDto>;
  deleteNote(ownerId: string, noteId: string): Promise<{ id: string }>;
  generateCandidateEdgesForOwner(ownerId: string): Promise<OwnerCandidateEdgeDto[]>;
  listCandidateEdgesForOwner(ownerId: string): Promise<OwnerCandidateEdgeDto[]>;
  listEdgesForNoteForOwner(ownerId: string, noteId: string): Promise<OwnerCandidateEdgeDto[]>;
  confirmEdgeForOwner(ownerId: string, input: unknown): Promise<OwnerCandidateEdgeDto>;
  rejectEdgeForOwner(ownerId: string, input: unknown): Promise<OwnerCandidateEdgeDto>;
}
