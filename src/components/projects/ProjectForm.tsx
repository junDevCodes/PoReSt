"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  DEFAULT_PROJECT_FORM_VALUES,
  PROJECT_FORM_VISIBILITIES,
  projectFormSchema,
  type ProjectFormValues,
} from "@/types/project-form";

type ProjectFormProps = {
  initialValues?: ProjectFormValues;
  submitLabel: string;
  submitting: boolean;
  serverError?: string | null;
  serverFields?: Record<string, string> | null;
  onSubmit: (values: ProjectFormValues) => Promise<void> | void;
};

function firstFieldError(
  fieldErrors: Record<string, string> | null | undefined,
  fieldName: string,
): string | null {
  if (!fieldErrors) {
    return null;
  }

  const error = fieldErrors[fieldName];
  return error && error.length > 0 ? error : null;
}

export function ProjectForm({
  initialValues,
  submitLabel,
  submitting,
  serverError,
  serverFields,
  onSubmit,
}: ProjectFormProps) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: initialValues ?? DEFAULT_PROJECT_FORM_VALUES,
  });

  useEffect(() => {
    form.reset(initialValues ?? DEFAULT_PROJECT_FORM_VALUES);
  }, [form, initialValues]);

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);
      })}
      className="grid gap-4"
    >
      <label className="flex flex-col gap-2 text-sm">
        <span>제목</span>
        <input
          {...form.register("title")}
          className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
          placeholder="프로젝트 제목"
        />
        <span className="text-xs text-rose-300">
          {form.formState.errors.title?.message ?? firstFieldError(serverFields, "title") ?? ""}
        </span>
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span>슬러그 (선택)</span>
        <input
          {...form.register("slug")}
          className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
          placeholder="my-project"
        />
        <span className="text-xs text-rose-300">
          {form.formState.errors.slug?.message ?? firstFieldError(serverFields, "slug") ?? ""}
        </span>
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span>부제목</span>
        <input
          {...form.register("subtitle")}
          className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
          placeholder="프로젝트 한 줄 요약"
        />
        <span className="text-xs text-rose-300">
          {form.formState.errors.subtitle?.message ??
            firstFieldError(serverFields, "subtitle") ??
            ""}
        </span>
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span>설명</span>
        <textarea
          {...form.register("description")}
          className="min-h-20 rounded-lg border border-white/20 bg-black/20 px-3 py-2"
          placeholder="요약 설명"
        />
        <span className="text-xs text-rose-300">
          {form.formState.errors.description?.message ??
            firstFieldError(serverFields, "description") ??
            ""}
        </span>
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span>본문 Markdown</span>
        <textarea
          {...form.register("contentMd")}
          className="min-h-52 rounded-lg border border-white/20 bg-black/20 px-3 py-2"
          placeholder={"## Problem\n문제 정의"}
        />
        <span className="text-xs text-rose-300">
          {form.formState.errors.contentMd?.message ??
            firstFieldError(serverFields, "contentMd") ??
            ""}
        </span>
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span>기술 스택 (콤마 구분)</span>
          <input
            {...form.register("techStackText")}
            className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
            placeholder="Next.js, Prisma, Neon"
          />
          <span className="text-xs text-rose-300">
            {form.formState.errors.techStackText?.message ??
              firstFieldError(serverFields, "techStack") ??
              ""}
          </span>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span>공개 상태</span>
          <select
            {...form.register("visibility")}
            className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
          >
            {PROJECT_FORM_VISIBILITIES.map((visibility) => (
              <option key={visibility} value={visibility}>
                {visibility}
              </option>
            ))}
          </select>
          <span className="text-xs text-rose-300">
            {form.formState.errors.visibility?.message ??
              firstFieldError(serverFields, "visibility") ??
              ""}
          </span>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm">
          <span>저장소 URL</span>
          <input
            {...form.register("repoUrl")}
            className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
            placeholder="https://github.com/..."
          />
          <span className="text-xs text-rose-300">
            {form.formState.errors.repoUrl?.message ?? firstFieldError(serverFields, "repoUrl") ?? ""}
          </span>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span>데모 URL</span>
          <input
            {...form.register("demoUrl")}
            className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
            placeholder="https://..."
          />
          <span className="text-xs text-rose-300">
            {form.formState.errors.demoUrl?.message ?? firstFieldError(serverFields, "demoUrl") ?? ""}
          </span>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span>썸네일 URL</span>
          <input
            {...form.register("thumbnailUrl")}
            className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
            placeholder="https://..."
          />
          <span className="text-xs text-rose-300">
            {form.formState.errors.thumbnailUrl?.message ??
              firstFieldError(serverFields, "thumbnailUrl") ??
              ""}
          </span>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register("isFeatured")} />
          <span>대표 프로젝트</span>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span>정렬 순서</span>
          <input
            type="number"
            {...form.register("order", { valueAsNumber: true })}
            className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
            min={0}
            max={9999}
          />
          <span className="text-xs text-rose-300">
            {form.formState.errors.order?.message ?? firstFieldError(serverFields, "order") ?? ""}
          </span>
        </label>
      </div>

      {serverError ? (
        <p className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {serverError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-60"
      >
        {submitting ? "저장 중..." : submitLabel}
      </button>
    </form>
  );
}
