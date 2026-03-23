function Pulse({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-zinc-800 ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Pulse className="w-10 h-10 rounded-full" />
        <Pulse className="h-4 w-24" />
      </div>
      <Pulse className="h-8 w-16" />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
        <Pulse className="h-4 w-10" />
        <Pulse className="h-4 w-20" />
        <Pulse className="h-4 w-24" />
        <Pulse className="h-4 w-16" />
        <Pulse className="h-4 w-16 ml-auto" />
      </div>
      {/* Rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3 border-b border-zinc-800/50"
        >
          <Pulse className="h-4 w-4 rounded" />
          <Pulse className="h-4 w-28" />
          <Pulse className="h-4 w-32" />
          <Pulse className="h-5 w-16 rounded-full" />
          <Pulse className="h-4 w-12 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="animate-fadeIn space-y-6" role="status" aria-label="Loading">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Pulse className="w-7 h-7 rounded-lg" />
        <Pulse className="h-7 w-48" />
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      {/* Content */}
      <SkeletonTable />
    </div>
  );
}
