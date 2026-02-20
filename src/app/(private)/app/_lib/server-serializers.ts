import type { OwnerBlogPostListItemDto } from "@/modules/blog";
import type { OwnerExperienceDto } from "@/modules/experiences";
import type { OwnerNoteListItemDto, OwnerNotebookDto } from "@/modules/notes";
import type { OwnerProjectDto } from "@/modules/projects";
import type { OwnerResumeListItemDto } from "@/modules/resumes";

export type SerializedOwnerProjectDto = Omit<OwnerProjectDto, "updatedAt"> & {
  updatedAt: string;
};

export type SerializedOwnerExperienceDto = Omit<OwnerExperienceDto, "startDate" | "endDate" | "updatedAt"> & {
  startDate: string;
  endDate: string | null;
  updatedAt: string;
};

export type SerializedOwnerResumeListItemDto = Omit<OwnerResumeListItemDto, "updatedAt"> & {
  updatedAt: string;
};

export type SerializedOwnerNoteListItemDto = Omit<OwnerNoteListItemDto, "updatedAt"> & {
  updatedAt: string;
};

export type SerializedOwnerNotebookDto = Omit<OwnerNotebookDto, "updatedAt"> & {
  updatedAt: string;
};

export type SerializedOwnerBlogPostListItemDto = Omit<OwnerBlogPostListItemDto, "lastLintedAt" | "updatedAt"> & {
  lastLintedAt: string | null;
  updatedAt: string;
};

function toIsoString(value: Date): string {
  return value.toISOString();
}

function toNullableIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export function serializeOwnerProjectList(items: OwnerProjectDto[]): SerializedOwnerProjectDto[] {
  return items.map((item) => ({
    ...item,
    updatedAt: toIsoString(item.updatedAt),
  }));
}

export function serializeOwnerExperienceList(
  items: OwnerExperienceDto[],
): SerializedOwnerExperienceDto[] {
  return items.map((item) => ({
    ...item,
    startDate: toIsoString(item.startDate),
    endDate: toNullableIsoString(item.endDate),
    updatedAt: toIsoString(item.updatedAt),
  }));
}

export function serializeOwnerResumeList(
  items: OwnerResumeListItemDto[],
): SerializedOwnerResumeListItemDto[] {
  return items.map((item) => ({
    ...item,
    updatedAt: toIsoString(item.updatedAt),
  }));
}

export function serializeOwnerNoteList(items: OwnerNoteListItemDto[]): SerializedOwnerNoteListItemDto[] {
  return items.map((item) => ({
    ...item,
    updatedAt: toIsoString(item.updatedAt),
  }));
}

export function serializeOwnerNotebookList(items: OwnerNotebookDto[]): SerializedOwnerNotebookDto[] {
  return items.map((item) => ({
    ...item,
    updatedAt: toIsoString(item.updatedAt),
  }));
}

export function serializeOwnerBlogPostList(
  items: OwnerBlogPostListItemDto[],
): SerializedOwnerBlogPostListItemDto[] {
  return items.map((item) => ({
    ...item,
    lastLintedAt: toNullableIsoString(item.lastLintedAt),
    updatedAt: toIsoString(item.updatedAt),
  }));
}
