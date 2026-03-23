import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface ConnectionStatusProps {
  connected: boolean;
  href?: string;
  sparklineData?: number[];
  successRate?: number;
  lastDisconnectedAt?: number | null;
}

interface ConnectionSparklineProps {
  data: number[];
  connected: boolean;
}

function ConnectionSparkline({ data, connected }: ConnectionSparklineProps) {
  const chartData = data.map((value, index) => ({ value, index }));
  const strokeColor = connected ? "#10b981" : "#ef4444";

  return (
    <div className="h-10 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="connection-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            fill="url(#connection-gradient)"
            isAnimationActive={true}
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const delta = Date.now() - timestamp;
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getHealthColors(rate: number): { bg: string; text: string } {
  if (rate >= 90) return { bg: "bg-emerald-500", text: "text-emerald-400" };
  if (rate >= 70) return { bg: "bg-amber-500", text: "text-amber-400" };
  return { bg: "bg-red-500", text: "text-red-400" };
}

export function ConnectionStatus({
  connected,
  href,
  sparklineData,
  successRate = 100,
  lastDisconnectedAt,
}: ConnectionStatusProps) {
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsReconnecting(true);
    setTimeout(() => setIsReconnecting(false), 2000);
  };

  const { bg: healthColor, text: healthTextColor } = getHealthColors(successRate);

  const card = (
    <motion.div
      whileHover={{ y: -4 }}
      className={`bg-zinc-900 border rounded-2xl p-5 transition-colors cursor-pointer group ${
        connected ? "border-zinc-800 hover:border-emerald-500/30" : "border-red-500/30 hover:border-red-500/50"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                connected ? "bg-emerald-500/10 group-hover:bg-emerald-500/20" : "bg-red-500/10 group-hover:bg-red-500/20"
              }`}
            >
              {connected ? (
                <Wifi className="w-5 h-5 text-emerald-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-400" />
              )}
            </div>
            <span className="text-sm text-zinc-500 font-medium">WhatsApp</span>
          </div>

          <div className="flex items-center gap-2">
            {connected ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            ) : (
              <span className="inline-flex rounded-full h-2.5 w-2.5 bg-red-500 animate-pulse" />
            )}
            <span className="text-lg font-bold text-zinc-100">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>

          <p className="text-xs text-zinc-500 mt-1">
            {connected
              ? "Ready to send messages"
              : "Click to connect your WhatsApp"
            }
          </p>

          {!connected && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isReconnecting ? "animate-spin" : ""}`} />
              {isReconnecting ? "Retrying..." : "Try reconnect"}
            </motion.button>
          )}
        </div>

        {sparklineData && (
          <div className="ml-2">
            <ConnectionSparkline data={sparklineData} connected={connected} />
          </div>
        )}
      </div>

      {connected && (
        <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-2">
          <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${successRate}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className={`h-full ${healthColor} rounded-full`}
            />
          </div>
          <span className={`text-xs ${healthTextColor} font-medium`}>
            {successRate}%
          </span>
        </div>
      )}

      {!connected && !isReconnecting && lastDisconnectedAt && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-400/80">
          <AlertCircle className="w-3 h-3" />
          <span>Connection lost {formatTimeAgo(lastDisconnectedAt)}</span>
        </div>
      )}
    </motion.div>
  );

  if (href) {
    return <Link to={href} className="block">{card}</Link>;
  }
  return card;
}
