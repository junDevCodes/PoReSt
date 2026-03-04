"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";
import { toProjectCreatePayload, type ProjectFormValues } from "@/types/project-form";

type CreatedProjectDto = {
  id: string;
};

export default function NewProjectPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);

  async function handleCreate(values: ProjectFormValues) {
    setIsSubmitting(true);
    setError(null);
    setFieldErrors(null);

    const response = await fetch("/api/app/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toProjectCreatePayload(values)),
    });

    const parsed = await parseApiResponse<CreatedProjectDto>(response);
    if (parsed.error) {
      setError(parsed.error);
      setFieldErrors(parsed.fields);
      setIsSubmitting(false);
      return;
    }

    const createdId = parsed.data?.id;
    setIsSubmitting(false);
    if (createdId) {
      router.push(`/app/projects/${createdId}/edit`);
      return;
    }
    router.push("/app/projects");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/60">관리</p>
          <h1 className="mt-2 text-3xl font-semibold">프로젝트 생성</h1>
          <p className="mt-3 text-sm text-black/60">
            새 프로젝트를 작성하고 공개 설정을 지정합니다.
          </p>
        </div>
        <Link
          href="/app/projects"
          className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black/75 hover:text-black"
        >
          목록으로
        </Link>
      </header>

      <section className="mt-8 rounded-2xl border border-black/10 bg-[#faf9f6] p-6">
        <ProjectForm
          submitLabel="프로젝트 생성"
          submitting={isSubmitting}
          serverError={error}
          serverFields={fieldErrors}
          onSubmit={handleCreate}
        />
      </section>
    </main>
  );
}
