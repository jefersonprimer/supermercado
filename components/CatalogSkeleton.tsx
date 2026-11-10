export default function CatalogSkeleton() {
  return (
    <main className="flex-1 bg-gray-50" aria-busy="true" aria-label="Carregando departamento">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="h-3 w-52 animate-pulse rounded bg-gray-200" />
        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <div className="h-8 w-60 max-w-[70vw] animate-pulse rounded bg-gray-200 sm:h-9 sm:w-72" />
            <div className="mt-2 h-4 w-36 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="h-10 w-28 animate-pulse rounded-full bg-gray-200 lg:hidden" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="hidden self-start rounded-2xl border border-gray-200 bg-white p-4 lg:block">
            <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
            <div className="mt-5 space-y-5">
              {[0, 1, 2].map((section) => (
                <div key={section} className="border-t border-gray-100 pt-4">
                  <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                  <div className="mt-4 space-y-3">
                    {[0, 1, 2].map((row) => (
                      <div key={row} className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
                        <div className="h-3 w-32 max-w-[80%] animate-pulse rounded bg-gray-100" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <section className="min-w-0">
            <div className="mb-4 hidden h-10 animate-pulse rounded-xl bg-gray-100 sm:block" />
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
                  <div className="aspect-square animate-pulse rounded-xl bg-gray-100" />
                  <div className="mt-4 h-3 w-16 animate-pulse rounded bg-gray-100" />
                  <div className="mt-2 h-4 w-full animate-pulse rounded bg-gray-200" />
                  <div className="mt-1 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="mt-4 h-5 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="mt-3 h-9 animate-pulse rounded-lg bg-gray-100" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
