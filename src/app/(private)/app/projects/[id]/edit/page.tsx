"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";
import {
  fromOwnerProjectToFormValues,
  toProjectUpdatePayload,
  type ProjectFormValues,
  type ProjectFormVisibility,
} from "@/types/project-form";

type OwnerProjectDto = {
  id: string;
  slug: string;
  title: string;
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
  updatedAt: string;
};

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<OwnerProjectDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const projectId = typeof params?.id === "string" ? params.id : "";
  const initialValues = useMemo<ProjectFormValues | undefined>(() => {
    if (!project) {
      return undefined;
    }
    return fromOwnerProjectToFormValues(project);
  }, [project]);

  useEffect(() => {
    let mounted = true;

    async function loadProject() {
      if (!projectId) {
        setError("프로젝트 식별자가 올바르지 않습니다.");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/app/projects/${projectId}`, { method: "GET" });
      const parsed = await parseApiResponse<OwnerProjectDto>(response);
      if (!mounted) {
        return;
      }

      if (parsed.error || !parsed.data) {
        setError(parsed.error ?? "프로젝트를 불러오지 못했습니다.");
        setIsLoading(false);
        return;
      }

      setProject(parsed.data);
      setIsLoading(false);
    }

    void loadProject();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  async function handleUpdate(values: ProjectFormValues) {
    if (!projectId) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFieldErrors(null);
    setMessage(null);

    const response = await fetch(`/api/app/projects/${projectId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toProjectUpdatePayload(values)),
    });
    const parsed = await parseApiResponse<OwnerProjectDto>(response);
    if (parsed.error || !parsed.data) {
      setError(parsed.error ?? "프로젝트 수정에 실패했습니다.");
      setFieldErrors(parsed.fields);
      setIsSubmitting(false);
      return;
    }

    setProject(parsed.data);
    setMessage("프로젝트가 수정되었습니다.");
    setIsSubmitting(false);
  }

  async function handleDelete() {
    if (!projectId || !project) {
      return;
    }

    const shouldDelete = confirm(`"${project.title}" 프로젝트를 삭제하시겠습니까?`);
    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/app/projects/${projectId}`, { method: "DELETE" });
    const parsed = await parseApiResponse<{ id: string }>(response);
    if (parsed.error) {
      setError(parsed.error);
      setFieldErrors(parsed.fields);
      setIsDeleting(false);
      return;
    }

    setIsDeleting(false);
    router.push("/app/projects");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">관리</p>
          <h1 className="mt-2 text-3xl font-semibold">프로젝트 편집</h1>
          <p className="mt-3 text-sm text-white/65">
            제목, 공개 상태, 대표 노출 여부를 포함한 프로젝트 정보를 수정합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/app/projects" className="rounded-full border border-white/30 px-4 py-2 text-sm">
            목록으로
          </Link>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={isDeleting || isLoading}
            className="rounded-full border border-rose-400/50 px-4 py-2 text-sm text-rose-200 disabled:opacity-60"
          >
            {isDeleting ? "삭제 중..." : "삭제"}
          </button>
        </div>
      </header>

      {message ? (
        <p className="mt-6 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        {isLoading ? (
          <p className="text-sm text-white/60">프로젝트 정보를 불러오는 중입니다.</p>
        ) : initialValues ? (
          <ProjectForm
            initialValues={initialValues}
            submitLabel="프로젝트 저장"
            submitting={isSubmitting}
            serverError={error}
            serverFields={fieldErrors}
            onSubmit={handleUpdate}
          />
        ) : (
          <p className="text-sm text-rose-200">{error ?? "프로젝트를 불러올 수 없습니다."}</p>
        )}
      </section>
    </main>
  );
}
