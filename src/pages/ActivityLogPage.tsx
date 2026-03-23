import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion } from "framer-motion";
import {
  Activity,
  Megaphone,
  CheckCircle2,
  Send,
  XCircle,
  UserPlus,
  Bot,
  Archive,
} from "lucide-react";
import { staggerContainerVariants, staggerItemVariants } from "@/lib/transitions";

const ACTIVITY_ICONS: Record<string, { icon: typeof Activity; color: string; bg: string }> = {
  campaign_started: {
    icon: Megaphone,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  campaign_completed: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  message_sent: {
    icon: Send,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
  },
  message_failed: {
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
  contact_imported: {
    icon: UserPlus,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  bot_replied: {
    icon: Bot,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  conversation_archived: {
    icon: Archive,
    color: "text-zinc-400",
    bg: "bg-zinc-500/10",
  },
};

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatFullDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getDateLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTypeLabel(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function ActivityLogPage() {
  const activities = useQuery(api.activityLog.listRecent, { limit: 100 });

  // Group activities by date
  const grouped: { label: string; items: NonNullable<typeof activities> }[] = [];
  if (activities) {
    let currentLabel = "";
    for (const activity of activities) {
      const label = getDateLabel(activity._creationTime);
      if (label !== currentLabel) {
        currentLabel = label;
        grouped.push({ label, items: [] });
      }
      grouped[grouped.length - 1].items.push(activity);
    }
  }

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className="p-6 max-w-3xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={staggerItemVariants} className="flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 rounded-xl">
          <Activity className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-h2 text-zinc-100">Activity Log</h1>
          <p className="text-small text-zinc-500">
            A timeline of everything that happened in your account.
          </p>
        </div>
      </motion.div>

      {/* Loading state */}
      {activities === undefined && (
        <motion.div variants={staggerItemVariants} className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-zinc-800" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 w-3/4 bg-zinc-800 rounded" />
                <div className="h-3 w-1/3 bg-zinc-800/60 rounded" />
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Empty state */}
      {activities !== undefined && activities.length === 0 && (
        <motion.div
          variants={staggerItemVariants}
          className="text-center py-16 space-y-3"
        >
          <div className="mx-auto w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center">
            <Activity className="w-8 h-8 text-zinc-600" />
          </div>
          <p className="text-zinc-400 text-sm">No activity yet.</p>
          <p className="text-zinc-600 text-xs">
            Actions like sending campaigns, importing contacts, and bot replies will
            appear here.
          </p>
        </motion.div>
      )}

      {/* Timeline */}
      {grouped.map((group) => (
        <motion.div key={group.label} variants={staggerItemVariants} className="space-y-1">
          {/* Date header */}
          <div className="sticky top-0 z-10 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-950 pr-3">
              {group.label}
            </span>
          </div>

          {/* Items */}
          <div className="relative ml-5 border-l border-zinc-800 space-y-0">
            {group.items.map((activity) => {
              const config = ACTIVITY_ICONS[activity.type] ?? {
                icon: Activity,
                color: "text-zinc-400",
                bg: "bg-zinc-800",
              };
              const Icon = config.icon;

              return (
                <motion.div
                  key={activity._id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative pl-8 py-3 group"
                >
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-5 top-3.5 w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center ring-4 ring-zinc-950 transition-transform group-hover:scale-110`}
                  >
                    <Icon className={`w-4.5 h-4.5 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl px-4 py-3 hover:border-zinc-700/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-zinc-200 leading-relaxed">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider ${config.bg} ${config.color}`}
                          >
                            {formatTypeLabel(activity.type)}
                          </span>
                          <span
                            className="text-xs text-zinc-600"
                            title={formatFullDate(activity._creationTime)}
                          >
                            {formatRelativeTime(activity._creationTime)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata badges */}
                    {activity.metadata &&
                      Object.keys(activity.metadata).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {Object.entries(activity.metadata).map(([key, val]) => (
                            <span
                              key={key}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800/80 text-zinc-400 text-[11px] rounded-md"
                            >
                              <span className="text-zinc-600">{key}:</span>{" "}
                              {String(val)}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
