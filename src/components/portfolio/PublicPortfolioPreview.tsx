import Link from "next/link";

type PreviewLink = {
  label: string;
  url: string;
  order: number;
  type?: string;
};

type PublicPortfolioPreviewProps = {
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
  featuredResumeTitle: string;
  links: PreviewLink[];
};

function toProfilePath(publicSlug: string) {
  const normalized = publicSlug.trim();
  if (normalized.length === 0) {
    return null;
  }
  return `/portfolio/${encodeURIComponent(normalized)}`;
}

const AVAILABILITY_LABEL: Record<string, string> = {
  OPEN: "채용 제안 환영",
  CONSIDERING: "검토 중",
  NOT_OPEN: "구직 중 아님",
};

export function PublicPortfolioPreview({
  publicSlug,
  isPublic,
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
}: PublicPortfolioPreviewProps) {
  const profilePath = toProfilePath(publicSlug);
  const sortedLinks = [...links].sort((a, b) => a.order - b.order);
  const hasResume = resumeUrl.trim().length > 0 || featuredResumeTitle.trim().length > 0;

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">공개될 포트폴리오 미리보기</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isPublic ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700"
          }`}
        >
          {isPublic ? "PUBLIC" : "PRIVATE"}
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-black/10 bg-[#faf9f6] p-4">
        {/* 프로필 헤더 */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/10 text-xs text-black/60">
            {avatarUrl.trim().length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName || "아바타"} className="h-full w-full object-cover" />
            ) : (
              "NO IMG"
            )}
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold">{displayName.trim() || "표시 이름 미설정"}</p>
            <p className="text-sm text-black/60">{headline.trim() || "헤드라인 미설정"}</p>
          </div>
        </div>

        {/* 가용성 배지 */}
        {availabilityStatus && availabilityStatus !== "HIDDEN" && AVAILABILITY_LABEL[availabilityStatus] ? (
          <div className="mt-3 flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                availabilityStatus === "OPEN" ? "bg-emerald-500" : "bg-amber-400"
              }`}
            />
            <span className="text-xs text-black/70">{AVAILABILITY_LABEL[availabilityStatus]}</span>
          </div>
        ) : null}

        {/* 위치 + 이메일 */}
        {(location.trim() || (isEmailPublic && email.trim())) ? (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {location.trim() ? (
              <span className="text-xs text-black/60">📍 {location}</span>
            ) : null}
            {isEmailPublic && email.trim() ? (
              <span className="text-xs text-black/60">✉ {email}</span>
            ) : null}
          </div>
        ) : null}

        {/* 자기소개 */}
        <p className="mt-3 text-sm text-black/70">{bio.trim() || "자기소개를 입력하면 이 영역에 표시됩니다."}</p>

        {/* CTA 버튼 모의 */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-black/10 px-3 py-1 text-xs text-black/60">프로젝트 보기</span>
          {hasResume ? (
            <span className="rounded-full border border-black/15 px-3 py-1 text-xs text-black/60">
              {featuredResumeTitle.trim() ? "이력서 보기" : "이력서 다운로드"}
            </span>
          ) : null}
        </div>

        {/* 소셜 링크 */}
        <div className="mt-3 flex flex-wrap gap-2">
          {sortedLinks.length === 0 ? (
            <span className="text-xs text-black/55">공개 링크가 없습니다.</span>
          ) : (
            sortedLinks.map((link, index) => (
              <span
                key={`${link.label}-${link.url}-${index}`}
                className="rounded-full border border-black/20 px-3 py-1 text-xs"
              >
                {link.label || "라벨 없음"}
              </span>
            ))
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-black/55">
        공개 주소: {profilePath ? profilePath : "publicSlug를 입력하면 주소가 생성됩니다."}
      </p>

      {profilePath ? (
        <div className="mt-3">
          <Link
            href={profilePath}
            target="_blank"
            className="rounded-full border border-black/20 px-4 py-2 text-sm font-semibold text-black"
          >
            실제 공개 URL 열기 →
          </Link>
        </div>
      ) : null}
    </section>
  );
}
