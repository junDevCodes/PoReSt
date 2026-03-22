export default function BlogLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col" aria-busy="true" role="status" aria-label="페이지 로딩 중">
      {/* 헤더 */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="h-3 w-14 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-2 h-9 w-40 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-3 h-4 w-64 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        </div>
        <div className="h-10 w-24 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
      </div>

      {/* 블로그 리스트 */}
      <div className="mt-8 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-black/10 bg-[#faf9f6] dark:bg-zinc-800 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="h-5 w-56 rounded bg-black/10 dark:bg-white/10" />
                <div className="mt-2 flex gap-2">
                  <div className="h-5 w-14 rounded-full bg-black/5 dark:bg-white/5" />
                  <div className="h-5 w-14 rounded-full bg-black/5 dark:bg-white/5" />
                </div>
                <div className="mt-2 h-3 w-36 rounded bg-black/5 dark:bg-white/5" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-14 rounded-lg bg-black/5 dark:bg-white/5" />
                <div className="h-8 w-12 rounded-lg bg-black/5 dark:bg-white/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
