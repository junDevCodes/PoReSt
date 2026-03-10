import Link from "next/link";

type PrivatePortfolioPageProps = {
  publicSlug: string;
};

export function PrivatePortfolioPage({ publicSlug }: PrivatePortfolioPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f5f2] px-6">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/8">
          <LockIcon />
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-black/85">비공개 포트폴리오</h1>
        <p className="mt-3 text-sm leading-6 text-black/60">
          <span className="font-medium text-black/80">{publicSlug}</span> 포트폴리오는 현재 비공개
          상태입니다. 소유자가 공개 전환 전까지 열람할 수 없습니다.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-full border border-black/20 px-5 py-2.5 text-sm font-medium text-black/70 hover:bg-black/5"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7 text-black/45"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
