import type { Prisma, Visibility } from "@prisma/client";

export type SkillCreateInput = {
  name: string;
  category?: string | null;
  level?: number | null;
  order?: number;
  visibility?: Visibility;
};

export type SkillUpdateInput = Partial<SkillCreateInput>;

export type OwnerSkillDto = {
  id: string;
  name: string;
  category: string | null;
  level: number | null;
  order: number;
  visibility: Visibility;
  updatedAt: Date;
};

export type SkillFieldErrors = Record<string, string>;

export type SkillServiceErrorCode = "VALIDATION_ERROR" | "CONFLICT" | "NOT_FOUND" | "FORBIDDEN";

export class SkillServiceError extends Error {
  readonly code: SkillServiceErrorCode;
  readonly status: number;
  readonly fields?: SkillFieldErrors;

  constructor(
    code: SkillServiceErrorCode,
    status: number,
    message: string,
    fields?: SkillFieldErrors,
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function isSkillServiceError(error: unknown): error is SkillServiceError {
  return error instanceof SkillServiceError;
}

export type SkillServicePrismaClient = Pick<Prisma.TransactionClient, "skill">;

export interface SkillsService {
  listSkillsForOwner(ownerId: string): Promise<OwnerSkillDto[]>;
  createSkill(ownerId: string, input: unknown): Promise<OwnerSkillDto>;
  updateSkill(ownerId: string, skillId: string, input: unknown): Promise<OwnerSkillDto>;
  deleteSkill(ownerId: string, skillId: string): Promise<{ id: string }>;
}
