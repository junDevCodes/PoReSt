"use client";

import { RefObject } from "react";
import { PortfolioFullPreview } from "@/components/portfolio/PortfolioFullPreview";

type PreviewLink = {
  label: string;
  url: string;
  order: number;
  type?: string;
};

export type PortfolioPreviewOverlayProps = {
  modalRef: RefObject<HTMLDivElement | null>;
  publicSlug: string;
  displayName: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  email: string;
  isEmailPublic: boolean;
  location: string;
  availabilityStatus: string;
  resumeUrl: string;
  featuredResumeTitle: string;
  links: PreviewLink[];
  onClose: () => void;
};

export default function PortfolioPreviewOverlay({
  modalRef,
  publicSlug,
  displayName,
  headline,
  bio,
  avatarUrl,
  email,
  isEmailPublic,
  location,
  availabilityStatus,
  resumeUrl,
  featuredResumeTitle,
  links,
  onClose,
}: PortfolioPreviewOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 md:p-8"
      onClick={onClose}
    >
      <div
        className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-[#f6f5f2] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 미리보기 툴바 */}
        <div
          ref={modalRef}
          className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-[#f6f5f2]/95 px-6 py-3 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-black/80">미리보기</span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              저장 전
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-full border border-black/20 px-4 py-1.5 text-sm font-medium hover:bg-black/5"
          >
            ✕ 닫기
          </button>
        </div>
        {/* 실제 크기 포트폴리오 렌더링 */}
        <PortfolioFullPreview
          publicSlug={publicSlug}
          displayName={displayName}
          headline={headline}
          bio={bio}
          avatarUrl={avatarUrl}
          email={email}
          isEmailPublic={isEmailPublic}
          location={location}
          availabilityStatus={availabilityStatus}
          resumeUrl={resumeUrl}
          featuredResumeTitle={featuredResumeTitle}
          links={links}
        />
      </div>
    </div>
  );
}
