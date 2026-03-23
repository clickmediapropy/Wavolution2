import { useEffect, useRef, type ReactNode } from "react";
import CountUp from "react-countup";

interface StatsCardProps {
  icon: ReactNode;
  iconBg: string; // e.g. "bg-emerald-500/10"
  label: string;
  value: string | number;
}

export function StatsCard({ icon, iconBg, label, value }: StatsCardProps) {
  const prevValue = useRef<number>(0);

  useEffect(() => {
    if (typeof value === "number") {
      prevValue.current = value;
    }
  }, [value]);

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
      <span className="text-3xl font-bold text-zinc-100">
        {typeof value === "number" ? (
          <CountUp
            start={prevValue.current}
            end={value}
            duration={1}
            separator=","
          />
        ) : (
          value
        )}
      </span>
    </div>
  );
}
