import { useRef, type ReactNode } from "react";
import { useCountUp } from "react-countup";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface StatsCardProps {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  subtitle?: string;
  subtitleColor?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  sparklineData?: number[];
  sparklineColor?: string;
}

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useCountUp({ ref: ref as React.RefObject<HTMLElement>, end: value, duration: 1.5, separator: "," });
  return <span ref={ref} />;
}

function TrendIndicator({ trend, value }: { trend: "up" | "down" | "neutral"; value?: string }) {
  const icons = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  };
  
  const colors = {
    up: "text-emerald-400 bg-emerald-500/10",
    down: "text-red-400 bg-red-500/10",
    neutral: "text-zinc-400 bg-zinc-500/10",
  };
  
  const Icon = icons[trend];
  
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors[trend]}`}>
      <Icon className="w-3 h-3" />
      {value && <span>{value}</span>}
    </div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((value, index) => ({ value, index }));
  
  // Get color hex from Tailwind class
  const colorMap: Record<string, string> = {
    "emerald": "#34d399",
    "blue": "#60a5fa",
    "violet": "#a78bfa",
    "amber": "#fbbf24",
    "red": "#f87171",
  };
  
  const strokeColor = colorMap[color] || "#34d399";
  
  return (
    <div className="h-12 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            fill={`url(#gradient-${color})`}
            isAnimationActive={true}
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatsCard({ 
  icon, 
  iconBg, 
  label, 
  value, 
  subtitle, 
  subtitleColor,
  trend,
  trendValue,
  sparklineData,
  sparklineColor = "emerald"
}: StatsCardProps) {
  const numericValue = typeof value === "number" ? value : 0;
  const hasSparkline = sparklineData && sparklineData.length > 0;
  
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 transition-colors hover:border-zinc-700 hover:shadow-xl hover:shadow-black/20"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
              {icon}
            </div>
            <span className="text-sm text-zinc-500 font-medium">{label}</span>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-100">
              {typeof value === "number" ? <AnimatedNumber value={numericValue} /> : value}
            </span>
            
            {trend && (
              <TrendIndicator trend={trend} value={trendValue} />
            )}
          </div>
          
          {subtitle && (
            <p className={`text-xs mt-1 ${subtitleColor || "text-zinc-500"}`}>
              {subtitle}
            </p>
          )}
        </div>
        
        {hasSparkline && (
          <div className="ml-2">
            <Sparkline data={sparklineData!} color={sparklineColor} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Compact version for dense layouts
export function StatsCardCompact({ 
  icon, 
  iconBg, 
  label, 
  value,
  trend,
  trendValue 
}: Omit<StatsCardProps, "subtitle" | "subtitleColor" | "sparklineData" | "sparklineColor">) {
  const numericValue = typeof value === "number" ? value : 0;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 hover:border-zinc-700 transition-colors cursor-pointer"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-500 font-medium truncate">{label}</p>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-zinc-100">
            {typeof value === "number" ? <AnimatedNumber value={numericValue} /> : value}
          </span>
          {trend && trendValue && (
            <span className={cn(
              "text-xs font-medium",
              trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-zinc-400"
            )}>
              {trend === "up" ? "+" : trend === "down" ? "-" : ""}{trendValue}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Helper function
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
