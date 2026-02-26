"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";
import { ErrorBanner, LoadingBlock } from "@/components/ui/AsyncState";
import { PublicPortfolioPreview } from "@/components/portfolio/PublicPortfolioPreview";

type PortfolioLinkFormItem = {
  id?: string;
  label: string;
  url: string;
  order: number;
};

type PortfolioSettingsDto = {
  id: string;
  publicSlug: string;
  isPublic: boolean;
  displayName: string | null;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  links: Array<{
    id: string;
    label: string;
    url: string;
    order: number;
  }>;
};

type PortfolioSettingsFormState = {
  publicSlug: string;
  isPublic: boolean;
  displayName: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  links: PortfolioLinkFormItem[];
};

const DEFAULT_FORM: PortfolioSettingsFormState = {
  publicSlug: "",
  isPublic: true,
  displayName: "",
  headline: "",
  bio: "",
  avatarUrl: "",
  links: [],
};

function toFormState(dto: PortfolioSettingsDto | null): PortfolioSettingsFormState {
  if (!dto) {
    return DEFAULT_FORM;
  }

  return {
    publicSlug: dto.publicSlug,
    isPublic: dto.isPublic,
    displayName: dto.displayName ?? "",
    headline: dto.headline ?? "",
    bio: dto.bio ?? "",
    avatarUrl: dto.avatarUrl ?? "",
    links: dto.links.map((link) => ({
      id: link.id,
      label: link.label,
      url: link.url,
      order: link.order,
    })),
  };
}

export default function PortfolioSettingsPage() {
  const [form, setForm] = useState<PortfolioSettingsFormState>(DEFAULT_FORM);
  const [originalPublicSlug, setOriginalPublicSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      setIsLoading(true);
      setError(null);
      setMessage(null);

      const parsed = await (async () => {
        try {
          const response = await fetch("/api/app/portfolio/settings", {
            method: "GET",
          });
          return await parseApiResponse<PortfolioSettingsDto | null>(response);
        } catch (error) {
          return parseApiResponse<PortfolioSettingsDto | null>(error);
        }
      })();

      if (!isMounted) {
        return;
      }

      if (parsed.error) {
        setError(parsed.error);
      } else {
        const nextForm = toFormState(parsed.data);
        setForm(nextForm);
        setOriginalPublicSlug(nextForm.publicSlug);
      }

      setIsLoading(false);
    }

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const hasSlugChanged = useMemo(() => {
    if (originalPublicSlug === null) {
      return false;
    }
    return form.publicSlug.trim() !== originalPublicSlug.trim();
  }, [form.publicSlug, originalPublicSlug]);

  function updateLink(index: number, next: Partial<PortfolioLinkFormItem>) {
    setForm((prev) => {
      const nextLinks = prev.links.map((link, currentIndex) =>
        currentIndex === index ? { ...link, ...next } : link,
      );
      return { ...prev, links: nextLinks };
    });
  }

  function addLink() {
    setForm((prev) => ({
      ...prev,
      links: [
        ...prev.links,
        {
          label: "",
          url: "",
          order: prev.links.length,
        },
      ],
    }));
  }

  function removeLink(index: number) {
    setForm((prev) => ({
      ...prev,
      links: prev.links.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);

    if (hasSlugChanged) {
      const confirmed = window.confirm(
        "publicSlug를 변경하면 기존 공유 링크가 깨질 수 있습니다. 리다이렉트는 제공되지 않습니다. 계속하시겠습니까?",
      );

      if (!confirmed) {
        setIsSaving(false);
        return;
      }
    }

    const payload = {
      publicSlug: form.publicSlug,
      isPublic: form.isPublic,
      displayName: form.displayName || null,
      headline: form.headline || null,
      bio: form.bio || null,
      avatarUrl: form.avatarUrl || null,
      links: form.links.map((link) => ({
        label: link.label,
        url: link.url,
        order: link.order,
      })),
    };

    const parsed = await (async () => {
      try {
        const response = await fetch("/api/app/portfolio/settings", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        return await parseApiResponse<PortfolioSettingsDto>(response);
      } catch (error) {
        return parseApiResponse<PortfolioSettingsDto>(error);
      }
    })();

    if (parsed.error) {
      setError(parsed.error);
      setIsSaving(false);
      return;
    }

    const nextForm = toFormState(parsed.data);
    setForm(nextForm);
    setOriginalPublicSlug(nextForm.publicSlug);
    setMessage("포트폴리오 설정이 저장되었습니다.");
    setIsSaving(false);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-2 py-2">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-black/45">관리</p>
        <h1 className="mt-2 text-3xl font-semibold">포트폴리오 설정</h1>
        <p className="mt-3 text-sm text-black/65">
          공개 포트폴리오의 기본 정보, 공개 여부, 링크를 관리하고 실시간 미리보기를 확인할 수
          있습니다.
        </p>
      </header>

      {isLoading ? (
        <LoadingBlock message="설정 정보를 불러오는 중입니다." className="mt-6" />
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {hasSlugChanged ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                publicSlug 변경이 감지되었습니다. 저장하면 기존 공유 링크가 깨질 수 있으며
                리다이렉트는 제공되지 않습니다.
              </div>
            ) : null}

            <section className="grid gap-4 rounded-2xl border border-black/10 bg-white p-6 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm">
                <span>공개 슬러그</span>
                <input
                  value={form.publicSlug}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, publicSlug: event.target.value }))
                  }
                  className="rounded-lg border border-black/15 bg-white px-3 py-2"
                  placeholder="owner-portfolio"
                />
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, isPublic: event.target.checked }))
                  }
                />
                <span>공개 상태 유지</span>
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span>표시 이름</span>
                <input
                  value={form.displayName}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, displayName: event.target.value }))
                  }
                  className="rounded-lg border border-black/15 bg-white px-3 py-2"
                  placeholder="홍길동"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span>헤드라인</span>
                <input
                  value={form.headline}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, headline: event.target.value }))
                  }
                  className="rounded-lg border border-black/15 bg-white px-3 py-2"
                  placeholder="문제 해결 중심 개발자"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm md:col-span-2">
                <span>자기소개</span>
                <textarea
                  value={form.bio}
                  onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
                  className="min-h-28 rounded-lg border border-black/15 bg-white px-3 py-2"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm md:col-span-2">
                <span>아바타 URL</span>
                <input
                  value={form.avatarUrl}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, avatarUrl: event.target.value }))
                  }
                  className="rounded-lg border border-black/15 bg-white px-3 py-2"
                  placeholder="https://example.com/avatar.png"
                />
              </label>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">외부 링크</h2>
                <button
                  type="button"
                  onClick={addLink}
                  className="rounded-full border border-black/20 px-4 py-1 text-sm"
                >
                  링크 추가
                </button>
              </div>

              {form.links.length === 0 ? (
                <p className="mt-4 text-sm text-black/60">등록된 링크가 없습니다.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {form.links.map((link, index) => (
                    <div
                      key={`${link.id ?? "new"}-${index}`}
                      className="grid gap-2 md:grid-cols-[1fr_2fr_96px_96px]"
                    >
                      <input
                        value={link.label}
                        onChange={(event) => updateLink(index, { label: event.target.value })}
                        placeholder="GitHub"
                        className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                      />
                      <input
                        value={link.url}
                        onChange={(event) => updateLink(index, { url: event.target.value })}
                        placeholder="https://github.com/..."
                        className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        value={link.order}
                        onChange={(event) =>
                          updateLink(index, { order: Number(event.target.value) || 0 })
                        }
                        className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeLink(index)}
                        className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-800"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {error ? <ErrorBanner message={error} /> : null}

            {message ? (
              <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSaving ? "저장 중..." : "설정 저장"}
            </button>
          </form>

          <div className="lg:sticky lg:top-6 lg:h-fit">
            <PublicPortfolioPreview
              publicSlug={form.publicSlug}
              isPublic={form.isPublic}
              displayName={form.displayName}
              headline={form.headline}
              bio={form.bio}
              avatarUrl={form.avatarUrl}
              links={form.links}
            />
          </div>
        </div>
      )}
    </main>
  );
}
