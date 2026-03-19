export default function NotesLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      {/* 헤더 */}
      <div>
        <div className="h-3 w-14 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-2 h-9 w-32 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-3 h-4 w-72 animate-pulse rounded bg-black/10 dark:bg-white/10" />
      </div>

      {/* 2열 레이아웃 */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* 왼쪽: 노트북 */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <div className="h-5 w-20 animate-pulse rounded bg-black/10 dark:bg-white/10" />
            <div className="mt-4 h-10 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
            <div className="mt-3 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-[#faf9f6]" />
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽: 노트 작성 폼 */}
        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="h-5 w-24 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-4 space-y-3">
            <div className="h-10 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
            <div className="h-10 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
            <div className="h-10 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
            <div className="h-32 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
          </div>
        </div>
      </div>

      {/* 노트 목록 */}
      <div className="mt-8 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-black/10 bg-[#faf9f6] p-4"
          >
            <div className="h-5 w-48 rounded bg-black/10 dark:bg-white/10" />
            <div className="mt-2 h-3 w-32 rounded bg-black/5 dark:bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
