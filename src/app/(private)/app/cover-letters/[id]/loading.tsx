export default function CoverLetterDetailLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col" aria-busy="true" role="status" aria-label="페이지 로딩 중">
      {/* 뒤로가기 */}
      <div className="h-4 w-32 animate-pulse rounded bg-black/10 dark:bg-white/10" />

      {/* 헤더 */}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1">
          <div className="h-8 w-64 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-3 flex gap-2">
            <div className="h-5 w-20 animate-pulse rounded-full bg-black/5 dark:bg-white/5" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-black/5 dark:bg-white/5" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-20 animate-pulse rounded-lg bg-black/10 dark:bg-white/10" />
          <div className="h-9 w-20 animate-pulse rounded-lg bg-black/10 dark:bg-white/10" />
          <div className="h-9 w-16 animate-pulse rounded-lg bg-black/10 dark:bg-white/10" />
        </div>
      </div>

      {/* 메타 필드 */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-16 animate-pulse rounded bg-black/5 dark:bg-white/5" />
            <div className="mt-2 h-9 w-full animate-pulse rounded-lg bg-black/10 dark:bg-white/10" />
          </div>
        ))}
      </div>

      {/* 본문 편집 영역 */}
      <div className="mt-6">
        <div className="h-3 w-12 animate-pulse rounded bg-black/5 dark:bg-white/5" />
        <div className="mt-2 h-64 w-full animate-pulse rounded-lg bg-black/10 dark:bg-white/10" />
      </div>
    </div>
  );
}
