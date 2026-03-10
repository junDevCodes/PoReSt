"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";
import { ErrorBanner, LoadingBlock } from "@/components/ui/AsyncState";
import { PortfolioFullPreview } from "@/components/portfolio/PortfolioFullPreview";

const PORTFOLIO_LINK_TYPES = [
  { value: "GITHUB", label: "GitHub" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "TWITTER", label: "Twitter / X" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "VELOG", label: "Velog" },
  { value: "TISTORY", label: "Tistory" },
  { value: "WEBSITE", label: "개인 웹사이트" },
  { value: "CUSTOM", label: "기타" },
] as const;

const LOCATION_PRESETS = [
  "서울, 대한민국",
  "부산, 대한민국",
  "대구, 대한민국",
  "인천, 대한민국",
  "광주, 대한민국",
  "대전, 대한민국",
  "울산, 대한민국",
  "수원, 대한민국",
  "성남, 대한민국",
  "고양, 대한민국",
  "용인, 대한민국",
  "창원, 대한민국",
  "Remote (원격 근무)",
  "Seoul, South Korea",
] as const;

type PortfolioLinkFormItem = {
  id?: string;
  label: string;
  url: string;
  order: number;
  type: string;
};

type PortfolioSettingsDto = {
  id: string;
  publicSlug: string;
  isPublic: boolean;
  displayName: string | null;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  email: string | null;
  isEmailPublic: boolean;
  location: string | null;
  availabilityStatus: string | null;
  resumeUrl: string | null;
  featuredResumeId: string | null;
  featuredResumeTitle: string | null;
  links: Array<{
    id: string;
    label: string;
    url: string;
    order: number;
    type: string;
  }>;
};

type ResumeListItem = {
  id: string;
  title: string;
  status: string;
};

type PortfolioSettingsFormState = {
  publicSlug: string;
  isPublic: boolean;
  displayName: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  email: string;
  isEmailPublic: boolean;
  location: string;
  availabilityStatus: string;
  resumeUrl: string;
  featuredResumeId: string;
  links: PortfolioLinkFormItem[];
};

const DEFAULT_FORM: PortfolioSettingsFormState = {
  publicSlug: "",
  isPublic: true,
  displayName: "",
  headline: "",
  bio: "",
  avatarUrl: "",
  email: "",
  isEmailPublic: false,
  location: "",
  availabilityStatus: "",
  resumeUrl: "",
  featuredResumeId: "",
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
    email: dto.email ?? "",
    isEmailPublic: dto.isEmailPublic,
    location: dto.location ?? "",
    availabilityStatus: dto.availabilityStatus ?? "",
    resumeUrl: dto.resumeUrl ?? "",
    featuredResumeId: dto.featuredResumeId ?? "",
    links: dto.links.map((link) => ({
      id: link.id,
      label: link.label,
      url: link.url,
      order: link.order,
      type: link.type ?? "CUSTOM",
    })),
  };
}

export default function PortfolioSettingsPage() {
  const [form, setForm] = useState<PortfolioSettingsFormState>(DEFAULT_FORM);
  const [originalPublicSlug, setOriginalPublicSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeUploadError, setResumeUploadError] = useState<string | null>(null);
  const [resumeMode, setResumeMode] = useState<"upload" | "internal">("upload");
  const [availableResumes, setAvailableResumes] = useState<ResumeListItem[]>([]);
  const [featuredResumeTitle, setFeaturedResumeTitle] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

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
        if (parsed.data?.featuredResumeId) {
          setResumeMode("internal");
          setFeaturedResumeTitle(parsed.data.featuredResumeTitle ?? "");
        }
      }

      // 이력서 목록 병렬 로드
      try {
        const resumeResponse = await fetch("/api/app/resumes", { method: "GET" });
        const resumeParsed = await parseApiResponse<ResumeListItem[]>(resumeResponse);
        if (!resumeParsed.error && resumeParsed.data) {
          setAvailableResumes(resumeParsed.data);
        }
      } catch {
        // 이력서 목록 로드 실패는 설정 로딩 실패로 처리하지 않음
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

  const handleModalClose = useCallback(() => setShowPreview(false), []);

  useEffect(() => {
    if (!showPreview) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleModalClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showPreview, handleModalClose]);

  function selectFeaturedResume(resume: ResumeListItem) {
    setForm((prev) => ({ ...prev, featuredResumeId: resume.id }));
    setFeaturedResumeTitle(resume.title);
  }

  function clearFeaturedResume() {
    setForm((prev) => ({ ...prev, featuredResumeId: "" }));
    setFeaturedResumeTitle("");
  }

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
          type: "CUSTOM",
        },
      ],
    }));
  }

  async function handleResumeUpload(file: File) {
    setIsUploadingResume(true);
    setResumeUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    const parsed = await (async () => {
      try {
        const response = await fetch("/api/app/portfolio/resume", {
          method: "POST",
          body: formData,
        });
        return await parseApiResponse<{ url: string }>(response);
      } catch (err) {
        return parseApiResponse<{ url: string }>(err);
      }
    })();

    if (parsed.error) {
      setResumeUploadError(parsed.error);
    } else if (parsed.data?.url) {
      setForm((prev) => ({ ...prev, resumeUrl: parsed.data!.url }));
    }

    setIsUploadingResume(false);
  }

  function removeLink(index: number) {
    setForm((prev) => ({
      ...prev,
      links: prev.links.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  async function handleAvatarUpload(file: File) {
    setIsUploadingAvatar(true);
    setAvatarUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    const parsed = await (async () => {
      try {
        const response = await fetch("/api/app/portfolio/avatar", {
          method: "POST",
          body: formData,
        });
        return await parseApiResponse<{ url: string }>(response);
      } catch (err) {
        return parseApiResponse<{ url: string }>(err);
      }
    })();

    if (parsed.error) {
      setAvatarUploadError(parsed.error);
    } else if (parsed.data?.url) {
      setForm((prev) => ({ ...prev, avatarUrl: parsed.data!.url }));
    }

    setIsUploadingAvatar(false);
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
      email: form.email || null,
      isEmailPublic: form.isEmailPublic,
      location: form.location || null,
      availabilityStatus: form.availabilityStatus || null,
      resumeUrl: resumeMode === "upload" ? (form.resumeUrl || null) : null,
      featuredResumeId: resumeMode === "internal" ? (form.featuredResumeId || null) : null,
      links: form.links.map((link) => ({
        label: link.label,
        url: link.url,
        order: link.order,
        type: link.type || "CUSTOM",
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
    <main className="mx-auto flex w-full max-w-3xl flex-col px-2 py-2">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/45">관리</p>
          <h1 className="mt-2 text-3xl font-semibold">포트폴리오 설정</h1>
          <p className="mt-3 text-sm text-black/65">
            공개 포트폴리오의 기본 정보, 공개 여부, 링크를 관리합니다.
          </p>
        </div>
        <div className="mt-6 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="rounded-full border border-black/20 px-5 py-2 text-sm font-semibold hover:bg-black/5"
          >
            미리보기
          </button>
          {form.isPublic && form.publicSlug ? (
            <a
              href={`/portfolio/${encodeURIComponent(form.publicSlug)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-black/20 px-5 py-2 text-sm font-semibold text-black/70 hover:bg-black/5"
            >
              포트폴리오 보기 ↗
            </a>
          ) : null}
        </div>
      </header>

      {isLoading ? (
        <LoadingBlock message="설정 정보를 불러오는 중입니다." className="mt-6" />
      ) : (
        <>
        <div className="mt-8">
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

              <div className="flex flex-col gap-2 text-sm md:col-span-2">
                <span>아바타 이미지</span>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/10">
                    {form.avatarUrl.trim().length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.avatarUrl}
                        alt="아바타 미리보기"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-black/50">없음</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="cursor-pointer rounded-full border border-black/20 px-4 py-2 text-sm hover:bg-black/5">
                      {isUploadingAvatar ? "업로드 중..." : "파일 선택"}
                      <input
                        type="file"
                        className="sr-only"
                        disabled={isUploadingAvatar}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
                          if (!ALLOWED.includes(file.type)) {
                            setAvatarUploadError("JPEG, PNG, WebP, GIF 형식만 업로드할 수 있습니다.");
                            event.target.value = "";
                            return;
                          }
                          void handleAvatarUpload(file);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    {avatarUploadError ? (
                      <p className="text-xs text-rose-700">{avatarUploadError}</p>
                    ) : null}
                    {form.avatarUrl.trim().length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, avatarUrl: "" }))}
                        className="text-xs text-black/50 hover:text-black/70"
                      >
                        이미지 제거
                      </button>
                    ) : null}
                  </div>
                </div>
                <p className="text-xs text-black/45">JPEG, PNG, WebP, GIF · 최대 5MB</p>
              </div>
            </section>

            <section className="grid gap-4 rounded-2xl border border-black/10 bg-white p-6 md:grid-cols-2">
              <h2 className="text-lg font-semibold md:col-span-2">연락처</h2>

              <label className="flex flex-col gap-2 text-sm">
                <span>이메일</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="rounded-lg border border-black/15 bg-white px-3 py-2"
                  placeholder="me@example.com"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span>위치</span>
                <input
                  value={form.location}
                  onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                  className="rounded-lg border border-black/15 bg-white px-3 py-2"
                  placeholder="서울, 대한민국"
                  list="location-presets"
                />
                <datalist id="location-presets">
                  {LOCATION_PRESETS.map((preset) => (
                    <option key={preset} value={preset} />
                  ))}
                </datalist>
              </label>

              <label className="flex items-center gap-2 text-sm md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isEmailPublic}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, isEmailPublic: event.target.checked }))
                  }
                />
                <span>포트폴리오에 이메일 공개</span>
              </label>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">구직 상태</h2>
              <div className="flex flex-wrap gap-3">
                {(
                  [
                    { value: "OPEN", label: "채용 제안 환영" },
                    { value: "CONSIDERING", label: "검토 중" },
                    { value: "NOT_OPEN", label: "구직 중 아님" },
                    { value: "HIDDEN", label: "표시 안 함" },
                  ] as const
                ).map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="availabilityStatus"
                      value={option.value}
                      checked={form.availabilityStatus === option.value}
                      onChange={() =>
                        setForm((prev) => ({ ...prev, availabilityStatus: option.value }))
                      }
                    />
                    {option.label}
                  </label>
                ))}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="availabilityStatus"
                    value=""
                    checked={form.availabilityStatus === ""}
                    onChange={() => setForm((prev) => ({ ...prev, availabilityStatus: "" }))}
                  />
                  미설정
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">포트폴리오 이력서</h2>

              {/* 탭 선택 */}
              <div className="mb-4 flex gap-2 rounded-xl border border-black/10 bg-black/5 p-1">
                <button
                  type="button"
                  onClick={() => setResumeMode("upload")}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    resumeMode === "upload"
                      ? "bg-white text-black shadow-sm"
                      : "text-black/60 hover:text-black"
                  }`}
                >
                  PDF 파일 업로드
                </button>
                <button
                  type="button"
                  onClick={() => setResumeMode("internal")}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    resumeMode === "internal"
                      ? "bg-white text-black shadow-sm"
                      : "text-black/60 hover:text-black"
                  }`}
                >
                  내 이력서 선택
                </button>
              </div>

              {resumeMode === "upload" ? (
                <div className="flex flex-col gap-3">
                  {form.resumeUrl ? (
                    <div className="flex items-center gap-3 rounded-lg border border-black/10 bg-black/5 px-4 py-3">
                      <span className="flex-1 truncate text-sm text-black/70">{form.resumeUrl}</span>
                      <a
                        href={form.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-black/60 hover:text-black"
                      >
                        보기
                      </a>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, resumeUrl: "" }))}
                        className="text-xs text-rose-700 hover:text-rose-900"
                      >
                        삭제
                      </button>
                    </div>
                  ) : null}
                  <label className="cursor-pointer rounded-full border border-black/20 px-4 py-2 text-sm hover:bg-black/5 w-fit">
                    {isUploadingResume ? "업로드 중..." : "PDF 파일 선택"}
                    <input
                      type="file"
                      className="sr-only"
                      disabled={isUploadingResume}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        if (file.type !== "application/pdf") {
                          setResumeUploadError("PDF 형식만 업로드할 수 있습니다.");
                          event.target.value = "";
                          return;
                        }
                        void handleResumeUpload(file);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {resumeUploadError ? (
                    <p className="text-xs text-rose-700">{resumeUploadError}</p>
                  ) : null}
                  <p className="text-xs text-black/45">PDF · 최대 10MB</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {availableResumes.length === 0 ? (
                    <p className="text-sm text-black/60">
                      등록된 이력서가 없습니다.{" "}
                      <a href="/app/resumes/new" className="underline">
                        이력서 만들기
                      </a>
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {availableResumes.map((resume) => (
                        <label key={resume.id} className="flex items-center gap-3 rounded-lg border border-black/10 px-4 py-3 cursor-pointer hover:bg-black/5">
                          <input
                            type="radio"
                            name="featuredResumeId"
                            value={resume.id}
                            checked={form.featuredResumeId === resume.id}
                            onChange={() => selectFeaturedResume(resume)}
                          />
                          <span className="flex-1 text-sm">{resume.title}</span>
                          <span className="text-xs text-black/50">{resume.status}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {form.featuredResumeId ? (
                    <button
                      type="button"
                      onClick={clearFeaturedResume}
                      className="text-xs text-black/50 hover:text-black/70 w-fit"
                    >
                      선택 해제
                    </button>
                  ) : null}
                  <p className="text-xs text-black/45">
                    선택한 이력서는 포트폴리오에서 공유 링크로 제공됩니다.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-black/10 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">소셜 링크</h2>
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
                      className="grid gap-2 md:grid-cols-[140px_1fr_2fr_80px_80px]"
                    >
                      <select
                        value={link.type}
                        onChange={(event) => updateLink(index, { type: event.target.value })}
                        className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                      >
                        {PORTFOLIO_LINK_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
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

        </div>

        {/* 미리보기 — 전체 화면 오버레이 (공백 클릭 시 닫기) */}
        {showPreview ? (
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-[#f6f5f2]"
            onClick={handleModalClose}
          >
            {/* 미리보기 툴바 */}
            <div
              ref={modalRef}
              className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-[#f6f5f2]/95 px-6 py-3 backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-black/80">미리보기</span>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  저장 전
                </span>
              </div>
              <button
                type="button"
                onClick={handleModalClose}
                className="flex items-center gap-1.5 rounded-full border border-black/20 px-4 py-1.5 text-sm font-medium hover:bg-black/5"
              >
                ✕ 닫기
              </button>
            </div>
            {/* 실제 크기 포트폴리오 렌더링 */}
            <div onClick={(e) => e.stopPropagation()}>
            <PortfolioFullPreview
              publicSlug={form.publicSlug}
              displayName={form.displayName}
              headline={form.headline}
              bio={form.bio}
              avatarUrl={form.avatarUrl}
              email={form.email}
              isEmailPublic={form.isEmailPublic}
              location={form.location}
              availabilityStatus={form.availabilityStatus}
              resumeUrl={resumeMode === "upload" ? form.resumeUrl : ""}
              featuredResumeTitle={resumeMode === "internal" ? featuredResumeTitle : ""}
              links={form.links}
            />
            </div>
          </div>
        ) : null}
        </>
      )}
    </main>
  );
}
