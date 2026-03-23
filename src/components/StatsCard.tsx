import type { ReactNode } from "react";

interface StatsCardProps {
  icon: ReactNode;
  iconBg: string; // e.g. "bg-emerald-500/10"
  label: string;
  value: string | number;
}

export function StatsCard({ icon, iconBg, label, value }: StatsCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 transition-transform hover:-translate-y-0.5 hover:border-zinc-700">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}
        >
          {icon}
        </div>
        <span className="text-sm text-zinc-500">{label}</span>
      </div>
      <span className="text-3xl font-bold text-zinc-100">{value}</span>
    </div>
  );
}
