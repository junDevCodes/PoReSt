export default function ProjectsLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-14">
      <div className="flex items-center justify-between gap-4">
        <div className="h-9 w-28 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="h-4 w-24 animate-pulse rounded bg-black/10 dark:bg-white/10" />
      </div>

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-[#1e1e1e]"
          >
            <div className="h-6 w-48 rounded bg-black/10 dark:bg-white/10" />
            <div className="mt-3 space-y-2">
              <div className="h-4 w-full rounded bg-black/5 dark:bg-white/5" />
              <div className="h-4 w-3/4 rounded bg-black/5 dark:bg-white/5" />
            </div>
            <div className="mt-3 flex gap-1.5">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-6 w-14 rounded-full bg-black/5 dark:bg-white/5" />
              ))}
            </div>
            <div className="mt-3 h-3 w-24 rounded bg-black/5 dark:bg-white/5" />
          </div>
        ))}
      </section>
    </main>
  );
}
