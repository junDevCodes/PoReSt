import type { OwnerPortfolioSettingsDto } from "@/modules/portfolio-settings";
import type { OwnerBlogPostListItemDto, OwnerBlogPostDetailDto, OwnerBlogExportArtifactDto } from "@/modules/blog";
import type { OwnerCompanyTargetDto, CompanyTargetsListResult } from "@/modules/company-targets";
import type { OwnerCoverLetterListItemDto, OwnerCoverLetterDetailDto } from "@/modules/cover-letters";
import type { OwnerExperienceDto } from "@/modules/experiences";
import type { OwnerExperienceStoryDto, ExperienceStoriesListResult } from "@/modules/experience-stories";
import type { OwnerFeedbackRequestListItemDto, OwnerFeedbackRequestDetailDto, OwnerFeedbackItemDto, FeedbackTargetDto } from "@/modules/feedback";
import type { BoardDto as ServiceBoardDto, BoardCardDto as ServiceBoardCardDto, JdMatchResult } from "@/modules/job-tracker";
import type { TestimonialDto } from "@/modules/testimonials";
import type { OwnerDomainLinkDto } from "@/modules/domain-links";
import type { OwnerNoteListItemDto, OwnerNoteDetailDto, OwnerNotebookDto } from "@/modules/notes";
import type { OwnerProjectDto } from "@/modules/projects";
import type { OwnerResumeListItemDto, OwnerResumeDetailDto, OwnerResumeItemDto } from "@/modules/resumes";
import type { OwnerSkillDto } from "@/modules/skills";

export type SerializedOwnerCoverLetterListItemDto = Omit<OwnerCoverLetterListItemDto, "updatedAt"> & {
  updatedAt: string;
};

export type SerializedOwnerCoverLetterDetailDto = Omit<OwnerCoverLetterDetailDto, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

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

export type SerializedOwnerNoteDetailDto = Omit<OwnerNoteDetailDto, "updatedAt"> & {
  updatedAt: string;
};

export type SerializedOwnerNotebookDto = Omit<OwnerNotebookDto, "updatedAt"> & {
  updatedAt: string;
};

export type SerializedOwnerSkillDto = Omit<OwnerSkillDto, "updatedAt"> & {
  updatedAt: string;
};

export type SerializedOwnerBlogPostListItemDto = Omit<OwnerBlogPostListItemDto, "lastLintedAt" | "updatedAt"> & {
  lastLintedAt: string | null;
  updatedAt: string;
};

export type SerializedOwnerCompanyTargetDto = Omit<OwnerCompanyTargetDto, "appliedAt" | "updatedAt"> & {
  appliedAt: string | null;
  updatedAt: string;
};

export type SerializedCompanyTargetsListResult = {
  items: SerializedOwnerCompanyTargetDto[];
  nextCursor: string | null;
};

export type SerializedOwnerExperienceStoryDto = Omit<OwnerExperienceStoryDto, "updatedAt"> & {
  updatedAt: string;
};

export type SerializedExperienceStoriesListResult = {
  items: SerializedOwnerExperienceStoryDto[];
  nextCursor: string | null;
};

export type SerializedOwnerFeedbackRequestListItemDto = Omit<
  OwnerFeedbackRequestListItemDto,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};

function toIsoString(value: Date): string {
  return value.toISOString();
}

function toNullableIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export function serializeOwnerCoverLetterList(
  items: OwnerCoverLetterListItemDto[],
): SerializedOwnerCoverLetterListItemDto[] {
  return items.map((item) => ({
    ...item,
    updatedAt: toIsoString(item.updatedAt),
  }));
}

export function serializeOwnerCoverLetterDetail(
  item: OwnerCoverLetterDetailDto,
): SerializedOwnerCoverLetterDetailDto {
  return {
    ...item,
    createdAt: toIsoString(item.createdAt),
    updatedAt: toIsoString(item.updatedAt),
  };
}

export function serializeOwnerProject(item: OwnerProjectDto): SerializedOwnerProjectDto {
  return {
    ...item,
    updatedAt: toIsoString(item.updatedAt),
  };
}

export function serializeOwnerProjectList(items: OwnerProjectDto[]): SerializedOwnerProjectDto[] {
  return items.map((item) => serializeOwnerProject(item));
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

export function serializeOwnerSkillList(items: OwnerSkillDto[]): SerializedOwnerSkillDto[] {
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

export function serializeOwnerNoteDetail(item: OwnerNoteDetailDto): SerializedOwnerNoteDetailDto {
  return {
    ...item,
    updatedAt: toIsoString(item.updatedAt),
  };
}

export function serializeCompanyTargetsList(
  result: CompanyTargetsListResult,
): SerializedCompanyTargetsListResult {
  return {
    items: result.items.map((item) => ({
      ...item,
      appliedAt: toNullableIsoString(item.appliedAt),
      updatedAt: toIsoString(item.updatedAt),
    })),
    nextCursor: result.nextCursor,
  };
}

export function serializeExperienceStoriesList(
  result: ExperienceStoriesListResult,
): SerializedExperienceStoriesListResult {
  return {
    items: result.items.map((item) => ({
      ...item,
      updatedAt: toIsoString(item.updatedAt),
    })),
    nextCursor: result.nextCursor,
  };
}

export function serializeFeedbackRequestList(
  items: OwnerFeedbackRequestListItemDto[],
): SerializedOwnerFeedbackRequestListItemDto[] {
  return items.map((item) => ({
    ...item,
    createdAt: toIsoString(item.createdAt),
    updatedAt: toIsoString(item.updatedAt),
  }));
}

// ─── Testimonials ─────────────────────────────────

export type SerializedTestimonialDto = Omit<TestimonialDto, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export function serializeTestimonialList(items: TestimonialDto[]): SerializedTestimonialDto[] {
  return items.map((item) => ({
    ...item,
    createdAt: toIsoString(item.createdAt),
    updatedAt: toIsoString(item.updatedAt),
  }));
}

// ─── Feedback Detail + Targets ─────────────────────

export type SerializedOwnerFeedbackItemDto = Omit<OwnerFeedbackItemDto, "createdAt"> & {
  createdAt: string;
};

export type SerializedOwnerFeedbackRequestDetailDto = Omit<
  OwnerFeedbackRequestDetailDto,
  "createdAt" | "updatedAt" | "items"
> & {
  createdAt: string;
  updatedAt: string;
  items: SerializedOwnerFeedbackItemDto[];
};

export type SerializedFeedbackTargetDto = Omit<FeedbackTargetDto, "updatedAt"> & {
  updatedAt: string;
};

export function serializeFeedbackRequestDetail(
  detail: OwnerFeedbackRequestDetailDto,
): SerializedOwnerFeedbackRequestDetailDto {
  return {
    ...detail,
    createdAt: toIsoString(detail.createdAt),
    updatedAt: toIsoString(detail.updatedAt),
    items: detail.items.map((item) => ({
      ...item,
      createdAt: toIsoString(item.createdAt),
    })),
  };
}

export function serializeFeedbackTargetList(
  items: FeedbackTargetDto[],
): SerializedFeedbackTargetDto[] {
  return items.map((item) => ({
    ...item,
    updatedAt: toIsoString(item.updatedAt),
  }));
}

// ─── Job Tracker Board ─────────────────────────────

export type SerializedBoardCardDto = Omit<ServiceBoardCardDto, "appliedAt" | "updatedAt" | "matchScoreJson"> & {
  appliedAt: string | null;
  updatedAt: string;
  matchScoreJson: JdMatchResult | null;
};

export type SerializedBoardColumnDto = {
  status: ServiceBoardCardDto["status"];
  label: string;
  cards: SerializedBoardCardDto[];
};

export type SerializedBoardDto = {
  columns: SerializedBoardColumnDto[];
  totalCount: number;
};

export function serializeBoard(board: ServiceBoardDto): SerializedBoardDto {
  return {
    columns: board.columns.map((col) => ({
      ...col,
      cards: col.cards.map((card): SerializedBoardCardDto => ({
        ...card,
        appliedAt: toNullableIsoString(card.appliedAt),
        updatedAt: toIsoString(card.updatedAt),
        matchScoreJson: card.matchScoreJson as JdMatchResult | null,
      })),
    })),
    totalCount: board.totalCount,
  };
}

// ─── Domain Links ─────────────────────────────────

export type SerializedOwnerDomainLinkDto = Omit<OwnerDomainLinkDto, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export function serializeOwnerDomainLinkList(
  items: OwnerDomainLinkDto[],
): SerializedOwnerDomainLinkDto[] {
  return items.map((item) => ({
    ...item,
    createdAt: toIsoString(item.createdAt),
    updatedAt: toIsoString(item.updatedAt),
  }));
}

// ─── Blog Post Detail + Export Artifacts ───────────

export type SerializedOwnerBlogPostDetailDto = Omit<OwnerBlogPostDetailDto, "lastLintedAt" | "updatedAt"> & {
  lastLintedAt: string | null;
  updatedAt: string;
};

export type SerializedOwnerBlogExportArtifactDto = Omit<OwnerBlogExportArtifactDto, "createdAt"> & {
  createdAt: string;
};

export function serializeOwnerBlogPostDetail(
  item: OwnerBlogPostDetailDto,
): SerializedOwnerBlogPostDetailDto {
  return {
    ...item,
    lastLintedAt: toNullableIsoString(item.lastLintedAt),
    updatedAt: toIsoString(item.updatedAt),
  };
}

export function serializeOwnerBlogExportArtifactList(
  items: OwnerBlogExportArtifactDto[],
): SerializedOwnerBlogExportArtifactDto[] {
  return items.map((item) => ({
    ...item,
    createdAt: toIsoString(item.createdAt),
  }));
}

// ─── Portfolio Settings ──────────────────────────

export type SerializedOwnerPortfolioSettingsDto = Omit<OwnerPortfolioSettingsDto, "updatedAt">;

export function serializeOwnerPortfolioSettings(
  dto: OwnerPortfolioSettingsDto,
): SerializedOwnerPortfolioSettingsDto {
  const { updatedAt: _, ...rest } = dto;
  return rest;
}

// ─── Resume Detail ───────────────────────────────

export type SerializedOwnerResumeItemDto = Omit<OwnerResumeItemDto, "updatedAt" | "experience"> & {
  updatedAt: string;
  experience: Omit<OwnerResumeItemDto["experience"], "startDate" | "endDate" | "updatedAt"> & {
    startDate: string;
    endDate: string | null;
    updatedAt: string;
  };
};

export type SerializedOwnerResumeDetailDto = Omit<OwnerResumeDetailDto, "updatedAt" | "items"> & {
  updatedAt: string;
  items: SerializedOwnerResumeItemDto[];
};

export function serializeOwnerResumeDetail(
  dto: OwnerResumeDetailDto,
): SerializedOwnerResumeDetailDto {
  return {
    ...dto,
    updatedAt: toIsoString(dto.updatedAt),
    items: dto.items.map((item) => ({
      ...item,
      updatedAt: toIsoString(item.updatedAt),
      experience: {
        ...item.experience,
        startDate: toIsoString(item.experience.startDate),
        endDate: toNullableIsoString(item.experience.endDate),
        updatedAt: toIsoString(item.experience.updatedAt),
      },
    })),
  };
}
