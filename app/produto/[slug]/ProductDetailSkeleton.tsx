import SubHeader from "@/components/SubHeader";

function Placeholder({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded bg-gray-100 ${className}`}
    />
  );
}

export default function ProductDetailSkeleton() {
  return (
    <main className="flex-1 bg-white" aria-busy="true" aria-label="Carregando produto">
      <SubHeader />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 hidden items-center gap-2 lg:flex" aria-hidden="true">
          <Placeholder className="h-3 w-24" />
          <Placeholder className="h-3 w-3 rounded-full" />
          <Placeholder className="h-3 w-28" />
          <Placeholder className="h-3 w-3 rounded-full" />
          <Placeholder className="h-3 w-40" />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <section aria-hidden="true">
            <Placeholder className="aspect-square w-full max-w-md rounded-2xl" />
            <div className="mt-3 hidden gap-2 sm:flex">
              {[0, 1, 2, 3].map((item) => (
                <Placeholder key={item} className="h-16 w-16 rounded-lg" />
              ))}
            </div>
          </section>

          <section className="space-y-5 lg:mt-0" aria-hidden="true">
            <div className="space-y-2">
              <Placeholder className="h-6 w-5/6" />
              <Placeholder className="h-6 w-2/3" />
              <Placeholder className="h-4 w-1/2" />
            </div>
            <div className="space-y-2">
              <Placeholder className="h-4 w-full" />
              <Placeholder className="h-4 w-full" />
              <Placeholder className="h-4 w-4/5" />
            </div>
            <Placeholder className="h-4 w-36" />
            <div className="flex gap-2">
              <Placeholder className="h-8 w-20 rounded-lg" />
              <Placeholder className="h-8 w-24 rounded-lg" />
              <Placeholder className="h-8 w-16 rounded-lg" />
            </div>
          </section>

          <section aria-hidden="true">
            <div className="mt-4 space-y-5 rounded-2xl border border-gray-200 p-5">
              <Placeholder className="h-4 w-1/3" />
              <Placeholder className="h-8 w-2/3" />
              <Placeholder className="h-4 w-1/2" />
              <Placeholder className="h-12 w-full rounded-xl" />
              <Placeholder className="h-11 w-full rounded-xl" />
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <Placeholder className="h-4 w-4/5" />
                <Placeholder className="h-4 w-2/3" />
              </div>
            </div>
          </section>
        </div>

        <section className="mt-12 border-t border-gray-100 pt-8" aria-hidden="true">
          <Placeholder className="h-6 w-48" />
          <div className="mt-5 space-y-3">
            <Placeholder className="h-4 w-full" />
            <Placeholder className="h-4 w-11/12" />
            <Placeholder className="h-4 w-4/5" />
          </div>
        </section>
      </div>
    </main>
  );
}
