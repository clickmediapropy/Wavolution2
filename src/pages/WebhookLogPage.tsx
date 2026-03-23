import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion } from "framer-motion";
import {
  Webhook,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  staggerContainerVariants,
  staggerItemVariants,
} from "@/lib/transitions";

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function StatusBadge({ status }: { status: "success" | "error" }) {
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        Success
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
      <XCircle className="h-3 w-3" />
      Error
    </span>
  );
}

function ExpandableData({ data }: { data: string }) {
  const [expanded, setExpanded] = useState(false);

  const formatted = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(data), null, 2);
    } catch {
      return data;
    }
  }, [data]);

  const preview = data.length > 80 ? data.slice(0, 80) + "..." : data;

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-left text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0" />
        )}
        <span className="font-mono truncate max-w-xs">{preview}</span>
      </button>
      {expanded && (
        <pre className="mt-2 max-h-60 overflow-auto rounded-md bg-zinc-900 p-3 text-xs text-zinc-300 font-mono border border-zinc-700/50">
          {formatted}
        </pre>
      )}
    </div>
  );
}

export function WebhookLogPage() {
  const logs = useQuery(api.webhooks.listRecentLogs);

  return (
    <motion.div
      className="mx-auto max-w-6xl px-4 py-8"
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-violet-500/10 p-2.5">
          <Webhook className="h-6 w-6 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Webhook Logs</h1>
          <p className="text-sm text-zinc-400">
            Recent webhook events received from Evolution API
          </p>
        </div>
      </div>

      {/* Loading */}
      {logs === undefined && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      )}

      {/* Empty */}
      {logs && logs.length === 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <Webhook className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-zinc-400">No webhook events recorded yet.</p>
          <p className="mt-1 text-sm text-zinc-500">
            Events will appear here as your WhatsApp instance receives them.
          </p>
        </div>
      )}

      {/* Table */}
      {logs && logs.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  <th className="px-4 py-3 font-medium text-zinc-400">
                    Event
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-400">
                    Instance
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-400">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-400">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-400">Data</th>
                </tr>
              </thead>
              <motion.tbody
                variants={staggerContainerVariants}
                initial="initial"
                animate="animate"
              >
                {logs.map((log) => (
                  <motion.tr
                    key={log._id}
                    variants={staggerItemVariants}
                    className="border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-200">
                        {log.event}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {log.instanceName}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={log.status as "success" | "error"}
                      />
                    </td>
                    <td className="px-4 py-3 max-w-md">
                      <ExpandableData data={log.data} />
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
          <div className="border-t border-zinc-800 px-4 py-2 text-xs text-zinc-500">
            Showing last {logs.length} events
          </div>
        </div>
      )}
    </motion.div>
  );
}
