export default function AnalyticsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      {/* 헤더 */}
      <div>
        <div className="h-3 w-14 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-2 h-9 w-32 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-3 h-4 w-64 animate-pulse rounded bg-black/10 dark:bg-white/10" />
      </div>

      {/* 요약 카드 4개 */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="h-3 w-16 animate-pulse rounded bg-black/10 dark:bg-white/10" />
            <div className="mt-3 h-8 w-20 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          </div>
        ))}
      </div>

      {/* 일별 차트 */}
      <div className="rounded-2xl border border-black/10 bg-white p-6">
        <div className="h-5 w-28 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-4 flex items-end gap-1">
          {[60, 35, 80, 45, 70, 25, 55, 90, 40, 65, 30, 75, 50, 85, 20].map((h, i) => (
            <div
              key={i}
              className="flex-1 animate-pulse rounded-t bg-black/5 dark:bg-white/5"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
      </div>

      {/* 페이지 분포 + 유입 경로 */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="h-5 w-24 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 animate-pulse rounded bg-black/5 dark:bg-white/5" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="h-5 w-24 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 animate-pulse rounded bg-black/5 dark:bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
