export default function SeoRouteLoading() {
  return (
    <main className="mx-auto min-h-[50vh] w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-busy="true">
      <div className="h-8 w-64 animate-pulse rounded bg-gray-100" />
      <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-gray-100" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="aspect-[3/4] animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    </main>
  );
}
