export default function PortfolioSettingsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col px-2 py-2" aria-busy="true" role="status" aria-label="페이지 로딩 중">
      {/* 헤더 */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="h-3 w-10 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-2 h-9 w-44 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        </div>
        <div className="mt-6 flex items-center gap-2">
          <div className="h-10 w-24 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
          <div className="h-10 w-32 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
        </div>
      </header>

      <div className="mt-8 space-y-6">
        {/* 기본 정보 섹션 */}
        <section className="grid gap-4 rounded-2xl border border-black/10 bg-white p-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <div className="h-4 w-20 animate-pulse rounded bg-black/10 dark:bg-white/10" />
            <div className="h-10 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded bg-black/10 dark:bg-white/10" />
            <div className="h-4 w-28 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-4 w-16 animate-pulse rounded bg-black/10 dark:bg-white/10" />
            <div className="h-10 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-4 w-16 animate-pulse rounded bg-black/10 dark:bg-white/10" />
            <div className="h-10 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <div className="h-4 w-16 animate-pulse rounded bg-black/10 dark:bg-white/10" />
            <div className="h-28 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
          </div>
          <div className="flex items-center gap-4 md:col-span-2">
            <div className="h-16 w-16 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
            <div className="h-10 w-24 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
          </div>
        </section>

        {/* 연락처 섹션 */}
        <section className="grid gap-4 rounded-2xl border border-black/10 bg-white p-6 md:grid-cols-2">
          <div className="h-6 w-16 animate-pulse rounded bg-black/10 dark:bg-white/10 md:col-span-2" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-12 animate-pulse rounded bg-black/10 dark:bg-white/10" />
            <div className="h-10 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-4 w-8 animate-pulse rounded bg-black/10 dark:bg-white/10" />
            <div className="h-10 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
          </div>
        </section>

        {/* 구직 상태 섹션 */}
        <section className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="h-6 w-20 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-4 flex flex-wrap gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-6 w-28 animate-pulse rounded bg-black/5 dark:bg-white/5"
              />
            ))}
          </div>
        </section>

        {/* 섹션 레이아웃 */}
        <section className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="h-6 w-28 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-xl border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.02]"
              />
            ))}
          </div>
        </section>

        {/* 저장 버튼 */}
        <div className="h-10 w-24 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
      </div>
    </main>
  );
}
