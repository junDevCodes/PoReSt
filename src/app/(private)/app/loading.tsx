export default function AppHomeLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      {/* 헤더 카드 스켈레톤 */}
      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <div className="h-3 w-20 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-3 h-9 w-48 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-black/10 dark:bg-white/10" />
      </section>

      {/* 발행 체크리스트 스켈레톤 */}
      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-36 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="h-7 w-20 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-xl border border-black/10 bg-[#faf9f6]"
            />
          ))}
        </div>
      </section>

      {/* 메트릭 카드 4개 */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <article key={i} className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="h-3 w-16 animate-pulse rounded bg-black/10 dark:bg-white/10" />
            <div className="mt-3 h-8 w-20 animate-pulse rounded bg-black/10 dark:bg-white/10" />
            <div className="mt-2 h-3 w-28 animate-pulse rounded bg-black/5 dark:bg-white/5" />
          </article>
        ))}
      </section>
    </div>
  );
}
