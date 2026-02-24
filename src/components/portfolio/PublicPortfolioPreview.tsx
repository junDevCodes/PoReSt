import Link from "next/link";

type PreviewLink = {
  label: string;
  url: string;
  order: number;
};

type PublicPortfolioPreviewProps = {
  publicSlug: string;
  isPublic: boolean;
  displayName: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  links: PreviewLink[];
};

function toProfilePath(publicSlug: string) {
  const normalized = publicSlug.trim();
  if (normalized.length === 0) {
    return null;
  }
  return `/u/${encodeURIComponent(normalized)}`;
}

export function PublicPortfolioPreview({
  publicSlug,
  isPublic,
  displayName,
  headline,
  bio,
  avatarUrl,
  links,
}: PublicPortfolioPreviewProps) {
  const profilePath = toProfilePath(publicSlug);
  const sortedLinks = [...links].sort((a, b) => a.order - b.order);

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
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black/10 text-xs text-black/60">
            {avatarUrl.trim().length > 0 ? "IMG" : "NO IMG"}
          </div>
          <div>
            <p className="text-base font-semibold">{displayName.trim() || "표시 이름 미설정"}</p>
            <p className="text-sm text-black/60">{headline.trim() || "헤드라인 미설정"}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-black/70">{bio.trim() || "자기소개를 입력하면 이 영역에 표시됩니다."}</p>

        <div className="mt-4 flex flex-wrap gap-2">
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

      <div className="mt-4 flex flex-wrap gap-2">
        {profilePath ? (
          <Link
            href={profilePath}
            target="_blank"
            className="rounded-full border border-black/20 px-4 py-2 text-sm font-semibold text-black"
          >
            실제 공개 URL 열기
          </Link>
        ) : null}
      </div>
    </section>
  );
}
