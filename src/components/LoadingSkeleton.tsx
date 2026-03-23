import { motion } from "framer-motion";

interface ShimmerPulseProps {
  className?: string;
  delay?: number;
}

function ShimmerPulse({ className = "", delay = 0 }: ShimmerPulseProps) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      className={`rounded-lg bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%] animate-shimmer ${className}`}
      aria-hidden="true"
    />
  );
}

interface DelayProps {
  delay?: number;
}

export function SkeletonCard({ delay = 0 }: DelayProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <ShimmerPulse delay={delay} className="w-10 h-10 rounded-full" />
        <ShimmerPulse delay={delay + 0.1} className="h-4 w-24" />
      </div>
      <ShimmerPulse delay={delay + 0.2} className="h-8 w-16" />
    </div>
  );
}

export function SkeletonStatsCard({ delay = 0 }: DelayProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <ShimmerPulse delay={delay} className="w-10 h-10 rounded-xl" />
            <ShimmerPulse delay={delay + 0.1} className="h-4 w-20" />
          </div>
          <ShimmerPulse delay={delay + 0.2} className="h-8 w-16" />
        </div>
        <ShimmerPulse delay={delay + 0.15} className="h-12 w-24 rounded-md" />
      </div>
    </div>
  );
}

function getColumnWidth(index: number, total: number): string {
  if (index === 0) return "w-4 rounded";
  if (index === total - 1) return "w-12 ml-auto";
  return "w-24";
}

interface SkeletonTableRowProps {
  columns?: number;
  delay?: number;
}

export function SkeletonTableRow({ columns = 5, delay = 0 }: SkeletonTableRowProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-zinc-800/50">
      {Array.from({ length: columns }).map((_, i) => (
        <ShimmerPulse
          key={i}
          delay={delay + i * 0.05}
          className={`h-4 ${getColumnWidth(i, columns)}`}
        />
      ))}
    </div>
  );
}

function getHeaderColumnWidth(index: number, total: number): string {
  if (index === 0) return "w-10";
  if (index === total - 1) return "w-16 ml-auto";
  return "w-24";
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 5 }: SkeletonTableProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-3 border-b border-zinc-800 bg-zinc-800/30">
        {Array.from({ length: columns }).map((_, i) => (
          <ShimmerPulse key={i} className={`h-4 ${getHeaderColumnWidth(i, columns)}`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} columns={columns} delay={i * 0.1} />
      ))}
    </div>
  );
}

export function SkeletonContactCard({ delay = 0 }: DelayProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <ShimmerPulse delay={delay} className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <ShimmerPulse delay={delay + 0.1} className="h-4 w-32 mb-2" />
          <ShimmerPulse delay={delay + 0.15} className="h-3 w-24" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
        <ShimmerPulse delay={delay + 0.2} className="h-5 w-16 rounded-full" />
        <ShimmerPulse delay={delay + 0.25} className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonFormField({ delay = 0 }: DelayProps) {
  return (
    <div className="space-y-2">
      <ShimmerPulse delay={delay} className="h-4 w-24" />
      <ShimmerPulse delay={delay + 0.1} className="h-10 w-full rounded-lg" />
    </div>
  );
}

export function SkeletonHeader({ delay = 0 }: DelayProps) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <ShimmerPulse delay={delay} className="w-8 h-8 rounded-lg" />
      <ShimmerPulse delay={delay + 0.1} className="h-8 w-48" />
    </div>
  );
}

export function SkeletonPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
      role="status"
      aria-label="Loading"
    >
      <SkeletonHeader />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonStatsCard delay={0} />
        <SkeletonStatsCard delay={0.1} />
        <SkeletonStatsCard delay={0.2} />
        <SkeletonStatsCard delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <ShimmerPulse className="h-6 w-32 mb-4" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <ShimmerPulse delay={i * 0.1} className="w-8 h-8 rounded-lg" />
                <div className="flex-1">
                  <ShimmerPulse delay={i * 0.1 + 0.05} className="h-4 w-32 mb-2" />
                  <ShimmerPulse delay={i * 0.1 + 0.1} className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <ShimmerPulse className="h-6 w-32 mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard">
      <div className="flex items-center justify-between">
        <SkeletonHeader />
        <ShimmerPulse className="h-8 w-32 rounded-full hidden sm:block" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatsCard key={i} delay={i * 0.1} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <ShimmerPulse className="h-6 w-40 mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-zinc-800/50 last:border-0">
              <ShimmerPulse delay={i * 0.1} className="w-8 h-8 rounded-lg" />
              <div className="flex-1">
                <ShimmerPulse delay={i * 0.1 + 0.05} className="h-4 w-40 mb-1" />
                <ShimmerPulse delay={i * 0.1 + 0.1} className="h-3 w-24" />
              </div>
              <ShimmerPulse delay={i * 0.1 + 0.15} className="h-3 w-16" />
            </div>
          ))}
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <ShimmerPulse className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <ShimmerPulse key={i} delay={i * 0.1} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonContactsPage() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading contacts">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SkeletonHeader />
        <div className="flex gap-3">
          <ShimmerPulse className="h-10 w-32 rounded-lg" />
          <ShimmerPulse className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <ShimmerPulse className="h-10 w-64 rounded-lg" />
        <ShimmerPulse className="h-10 w-32 rounded-lg" />
        <ShimmerPulse className="h-10 w-32 rounded-lg ml-auto" />
      </div>

      <SkeletonTable rows={8} columns={5} />

      <div className="flex items-center justify-between">
        <ShimmerPulse className="h-4 w-48" />
        <div className="flex gap-2">
          <ShimmerPulse className="h-8 w-8 rounded-lg" />
          <ShimmerPulse className="h-8 w-8 rounded-lg" />
          <ShimmerPulse className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonCampaignPage() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading campaign">
      <div className="flex items-center gap-4 py-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 flex-1">
            <ShimmerPulse delay={i * 0.1} className="w-10 h-10 rounded-full" />
            <ShimmerPulse delay={i * 0.1 + 0.05} className="h-1 flex-1" />
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
        <ShimmerPulse className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonFormField delay={0} />
          <SkeletonFormField delay={0.1} />
        </div>
        <SkeletonFormField delay={0.2} />
        <ShimmerPulse delay={0.3} className="h-32 w-full rounded-lg" />
        <div className="flex justify-end gap-3">
          <ShimmerPulse className="h-10 w-24 rounded-lg" />
          <ShimmerPulse className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
