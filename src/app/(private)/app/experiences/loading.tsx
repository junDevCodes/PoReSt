export default function ExperiencesLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      {/* 헤더 */}
      <div>
        <div className="h-3 w-14 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-2 h-9 w-32 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-3 h-4 w-64 animate-pulse rounded bg-black/10 dark:bg-white/10" />
      </div>

      {/* 입력 폼 스켈레톤 */}
      <div className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
        <div className="h-5 w-28 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
          ))}
        </div>
        <div className="mt-3 flex justify-end">
          <div className="h-9 w-20 animate-pulse rounded-lg bg-black/10 dark:bg-white/10" />
        </div>
      </div>

      {/* 경력 리스트 */}
      <div className="mt-6 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-black/10 bg-[#faf9f6] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="h-5 w-44 rounded bg-black/10 dark:bg-white/10" />
                <div className="mt-2 h-3 w-32 rounded bg-black/5 dark:bg-white/5" />
                <div className="mt-1 h-3 w-24 rounded bg-black/5 dark:bg-white/5" />
              </div>
              <div className="h-8 w-8 rounded bg-black/5 dark:bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
