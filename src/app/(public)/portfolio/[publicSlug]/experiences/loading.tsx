export default function ExperiencesLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-14">
      <div className="mb-8 h-4 w-16 animate-pulse rounded bg-black/10 dark:bg-white/10" />
      <div className="h-9 w-24 animate-pulse rounded bg-black/10 dark:bg-white/10" />

      <div className="relative mt-8">
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-black/10 dark:bg-white/10" />
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="relative pl-10">
              <div className="absolute left-0 top-6 h-[22px] w-[22px] animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
              <div className="animate-pulse rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#1e1e1e]">
                <div className="h-6 w-40 rounded bg-black/10 dark:bg-white/10" />
                <div className="mt-2 h-4 w-28 rounded bg-black/10 dark:bg-white/10" />
                <div className="mt-2 h-3 w-36 rounded bg-black/10 dark:bg-white/10" />
                <div className="mt-4 h-16 w-full rounded bg-black/5 dark:bg-white/5" />
                <div className="mt-3 flex gap-1.5">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-6 w-16 rounded-full bg-black/5 dark:bg-white/5" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
