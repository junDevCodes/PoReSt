import { z } from "zod";

const MIN_ORDER = 0;
const MAX_ORDER = 9999;

export const PROJECT_FORM_VISIBILITIES = ["PUBLIC", "UNLISTED", "PRIVATE"] as const;
export type ProjectFormVisibility = (typeof PROJECT_FORM_VISIBILITIES)[number];

export type ProjectFormValues = {
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  contentMd: string;
  techStackText: string;
  repoUrl: string;
  demoUrl: string;
  thumbnailUrl: string;
  visibility: ProjectFormVisibility;
  isFeatured: boolean;
  order: number;
};

export const projectFormSchema = z.object({
  title: z.string().trim().min(2, "제목은 2자 이상이어야 합니다.").max(80, "제목은 80자 이하로 입력해주세요."),
  slug: z.string().trim().max(100, "슬러그는 100자 이하로 입력해주세요."),
  subtitle: z.string().trim().max(120, "부제목은 120자 이하로 입력해주세요."),
  description: z.string().trim().max(200, "설명은 200자 이하로 입력해주세요."),
  contentMd: z.string().trim().min(1, "본문은 비어 있을 수 없습니다."),
  techStackText: z.string().trim().max(1000, "기술 스택 입력 길이가 너무 깁니다."),
  repoUrl: z
    .string()
    .trim()
    .refine((value) => value.length === 0 || /^https?:\/\//i.test(value), "저장소 URL 형식이 올바르지 않습니다."),
  demoUrl: z
    .string()
    .trim()
    .refine((value) => value.length === 0 || /^https?:\/\//i.test(value), "데모 URL 형식이 올바르지 않습니다."),
  thumbnailUrl: z
    .string()
    .trim()
    .refine((value) => value.length === 0 || /^https?:\/\//i.test(value), "썸네일 URL 형식이 올바르지 않습니다."),
  visibility: z.enum(PROJECT_FORM_VISIBILITIES),
  isFeatured: z.boolean(),
  order: z
    .number({
      error: "정렬 순서는 숫자여야 합니다.",
    })
    .int("정렬 순서는 정수여야 합니다.")
    .min(MIN_ORDER, "정렬 순서는 0 이상이어야 합니다.")
    .max(MAX_ORDER, "정렬 순서는 9999 이하여야 합니다."),
});

export const DEFAULT_PROJECT_FORM_VALUES: ProjectFormValues = {
  title: "",
  slug: "",
  subtitle: "",
  description: "",
  contentMd: "",
  techStackText: "",
  repoUrl: "",
  demoUrl: "",
  thumbnailUrl: "",
  visibility: "PUBLIC",
  isFeatured: false,
  order: 0,
};

function toNullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toOptionalString(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseTechStack(techStackText: string): string[] {
  return techStackText
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function toProjectCreatePayload(values: ProjectFormValues) {
  return {
    title: values.title.trim(),
    slug: toOptionalString(values.slug),
    subtitle: toNullableString(values.subtitle),
    description: toNullableString(values.description),
    contentMd: values.contentMd,
    techStack: parseTechStack(values.techStackText),
    repoUrl: toNullableString(values.repoUrl),
    demoUrl: toNullableString(values.demoUrl),
    thumbnailUrl: toNullableString(values.thumbnailUrl),
    visibility: values.visibility,
    isFeatured: values.isFeatured,
    order: values.order,
  };
}

export function toProjectUpdatePayload(values: ProjectFormValues) {
  return {
    title: values.title.trim(),
    slug: toOptionalString(values.slug),
    subtitle: toNullableString(values.subtitle),
    description: toNullableString(values.description),
    contentMd: values.contentMd,
    techStack: parseTechStack(values.techStackText),
    repoUrl: toNullableString(values.repoUrl),
    demoUrl: toNullableString(values.demoUrl),
    thumbnailUrl: toNullableString(values.thumbnailUrl),
    visibility: values.visibility,
    isFeatured: values.isFeatured,
    order: values.order,
  };
}

export function fromOwnerProjectToFormValues(input: {
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  contentMd: string;
  techStack: string[];
  repoUrl: string | null;
  demoUrl: string | null;
  thumbnailUrl: string | null;
  visibility: ProjectFormVisibility;
  isFeatured: boolean;
  order: number;
}): ProjectFormValues {
  return {
    title: input.title,
    slug: input.slug,
    subtitle: input.subtitle ?? "",
    description: input.description ?? "",
    contentMd: input.contentMd,
    techStackText: input.techStack.join(", "),
    repoUrl: input.repoUrl ?? "",
    demoUrl: input.demoUrl ?? "",
    thumbnailUrl: input.thumbnailUrl ?? "",
    visibility: input.visibility,
    isFeatured: input.isFeatured,
    order: input.order,
  };
}
