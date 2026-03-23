import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Wifi,
  WifiOff,
  ArrowLeft,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Activity,
} from "lucide-react";
import {
  staggerContainerVariants,
  staggerItemVariants,
} from "@/lib/transitions";

function formatUptime(ms: number | null): string {
  if (ms === null) return "---";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

function formatTimeAgo(timestamp: number | null): string {
  if (timestamp === null) return "Never";
  const delta = Date.now() - timestamp;
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function StatusIndicator({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
      </span>
    );
  }
  return (
    <span className="relative flex h-3 w-3">
      <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-50" />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
    </span>
  );
}

function SuccessRateBar({ rate }: { rate: number }) {
  const color =
    rate >= 90 ? "bg-emerald-500" : rate >= 70 ? "bg-amber-500" : "bg-red-500";
  const textColor =
    rate >= 90
      ? "text-emerald-400"
      : rate >= 70
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${rate}%` }}
          transition={{ duration: 1, delay: 0.3 }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
      <span className={`text-sm font-semibold ${textColor} tabular-nums w-12 text-right`}>
        {rate}%
      </span>
    </div>
  );
}

interface InstanceStatus {
  _id: string;
  name: string;
  connectionStatus: string;
  whatsappConnected: boolean;
  whatsappNumber: string | null;
  uptimeMs: number | null;
  lastDisconnectedAt: number | null;
  successRate: number;
  sentToday: number;
}

function InstanceCard({ instance }: { instance: InstanceStatus }) {
  const connected = instance.whatsappConnected;
  const borderColor = connected
    ? "border-zinc-800 hover:border-emerald-500/30"
    : "border-red-500/20 hover:border-red-500/40";

  return (
    <motion.div
      variants={staggerItemVariants}
      whileHover={{ y: -2 }}
      className={`bg-zinc-900 border ${borderColor} rounded-2xl p-6 transition-colors`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              connected ? "bg-emerald-500/10" : "bg-red-500/10"
            }`}
          >
            {connected ? (
              <Wifi className="w-5 h-5 text-emerald-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-100">
              {instance.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusIndicator connected={connected} />
              <span
                className={`text-xs font-medium ${
                  connected ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {instance.connectionStatus === "open"
                  ? "Connected"
                  : instance.connectionStatus === "close"
                    ? "Disconnected"
                    : instance.connectionStatus === "connecting"
                      ? "Connecting..."
                      : instance.connectionStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Phone number */}
        <div className="bg-zinc-800/40 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Phone className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500">Phone</span>
          </div>
          <p className="text-sm font-medium text-zinc-200 truncate">
            {instance.whatsappNumber ?? "Not linked"}
          </p>
        </div>

        {/* Uptime */}
        <div className="bg-zinc-800/40 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500">Uptime</span>
          </div>
          <p className="text-sm font-medium text-zinc-200 tabular-nums">
            {connected ? formatUptime(instance.uptimeMs) : "Offline"}
          </p>
        </div>

        {/* Last disconnect */}
        <div className="bg-zinc-800/40 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <XCircle className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500">Last Disconnect</span>
          </div>
          <p className="text-sm font-medium text-zinc-200">
            {formatTimeAgo(instance.lastDisconnectedAt)}
          </p>
        </div>

        {/* Messages today */}
        <div className="bg-zinc-800/40 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500">Sent Today</span>
          </div>
          <p className="text-sm font-medium text-zinc-200 tabular-nums">
            {instance.sentToday}
          </p>
        </div>
      </div>

      {/* Success rate */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-xs text-zinc-500">Message Success Rate</span>
        </div>
        <SuccessRateBar rate={instance.successRate} />
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl bg-zinc-800" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-zinc-800 rounded" />
          <div className="h-3 w-20 bg-zinc-800 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-zinc-800/40 rounded-xl p-3 h-16" />
        ))}
      </div>
      <div className="h-2 bg-zinc-800 rounded-full" />
    </div>
  );
}

export function WhatsAppStatusPage() {
  const detailedStatus = useQuery(api.instances.getDetailedStatus);

  const totalInstances = detailedStatus?.length ?? 0;
  const connectedCount =
    detailedStatus?.filter((i) => i.whatsappConnected).length ?? 0;
  const totalSentToday =
    detailedStatus?.reduce((sum, i) => sum + i.sentToday, 0) ?? 0;
  const avgSuccessRate =
    detailedStatus && detailedStatus.length > 0
      ? Math.round(
          detailedStatus.reduce((sum, i) => sum + i.successRate, 0) /
            detailedStatus.length,
        )
      : 0;

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={staggerItemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/whatsapp"
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div className="p-2 bg-emerald-500/10 rounded-xl">
            <Activity className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">
              WhatsApp Status
            </h1>
            <p className="text-sm text-zinc-500">
              Connection health and instance monitoring
            </p>
          </div>
        </div>

        {/* Summary badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full">
          <div
            className={`w-2 h-2 rounded-full ${
              connectedCount === totalInstances && totalInstances > 0
                ? "bg-emerald-500 animate-pulse"
                : connectedCount > 0
                  ? "bg-amber-500 animate-pulse"
                  : "bg-red-500"
            }`}
          />
          <span className="text-xs text-zinc-400">
            {connectedCount}/{totalInstances} connected
          </span>
        </div>
      </motion.div>

      {/* Summary stats */}
      <motion.div
        variants={staggerItemVariants}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {[
          {
            label: "Total Instances",
            value: totalInstances,
            icon: <Wifi className="w-4 h-4 text-blue-400" />,
            bg: "bg-blue-500/10",
          },
          {
            label: "Connected",
            value: connectedCount,
            icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
            bg: "bg-emerald-500/10",
          },
          {
            label: "Sent Today",
            value: totalSentToday,
            icon: <MessageSquare className="w-4 h-4 text-violet-400" />,
            bg: "bg-violet-500/10",
          },
          {
            label: "Avg Success Rate",
            value: `${avgSuccessRate}%`,
            icon: <Activity className="w-4 h-4 text-amber-400" />,
            bg: "bg-amber-500/10",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 ${stat.bg} rounded-lg`}>{stat.icon}</div>
              <span className="text-xs text-zinc-500">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-zinc-100 tabular-nums">
              {detailedStatus === undefined ? "..." : stat.value}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Instance cards */}
      {detailedStatus === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : detailedStatus.length === 0 ? (
        <motion.div
          variants={staggerItemVariants}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center"
        >
          <WifiOff className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-300 mb-2">
            No Instances Found
          </h3>
          <p className="text-sm text-zinc-500 mb-4">
            Create a WhatsApp instance to start monitoring connection status.
          </p>
          <Link
            to="/whatsapp"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Wifi className="w-4 h-4" />
            Set Up Instance
          </Link>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainerVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {detailedStatus.map((instance) => (
            <InstanceCard key={instance._id} instance={instance} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}