import type { ReactNode } from "react";
import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { MessageSquare, CheckCircle2, XCircle, Clock, RotateCcw, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { relativeTime } from "@/lib/relativeTime";

type MessageStatus = "sent" | "failed" | "pending";

const STATUS_CONFIG: Record<MessageStatus, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  sent: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  failed: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
  pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
};

interface MessageItemProps {
  msg: { _id: string; status: string; phone: string; message: string; _creationTime: number };
  contactName?: string;
}

function MessageItem({ msg, contactName }: MessageItemProps): ReactNode {
  const status = msg.status as MessageStatus;
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-zinc-800/50 transition-colors cursor-pointer"
    >
      <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
        <StatusIcon className={`w-4 h-4 ${config.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-sm text-zinc-200 font-medium block truncate">
          {contactName ?? msg.phone}
        </span>
        {contactName && (
          <span className="text-xs text-zinc-500 block truncate">
            {msg.phone}
          </span>
        )}
      </div>

      <div className="hidden sm:block flex-[2] min-w-0">
        <p className="text-sm text-zinc-400 truncate max-w-[200px]">
          {msg.message}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-zinc-500">
          {relativeTime(msg._creationTime)}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {status === "failed" && (
            <button
              className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
              title="Retry"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}

function buildPhoneToNameMap(contacts: { page: Array<{ phone: string; firstName?: string; lastName?: string }> } | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!contacts?.page) return map;
  for (const c of contacts.page) {
    const fullName = [c.firstName, c.lastName].filter(Boolean).join(" ");
    if (fullName) map.set(c.phone, fullName);
  }
  return map;
}

export function RecentMessages(): ReactNode {
  const messages = usePaginatedQuery(
    api.messages.list,
    {},
    { initialNumItems: 5 },
  );

  const contacts = useQuery(api.contacts.list, {
    paginationOpts: { numItems: 500, cursor: null },
  });

  const phoneToName = buildPhoneToNameMap(contacts);
  const { results } = messages;
  const deliveredCount = results.filter((m) => m.status === "sent").length;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/10 rounded-xl">
            <MessageSquare className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-h3 text-zinc-100">Recent Messages</h2>
            <p className="text-small text-zinc-500">Last 5 messages sent</p>
          </div>
        </div>

        {results.length > 0 && (
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-zinc-400">
                {deliveredCount} delivered
              </span>
            </div>
          </div>
        )}
      </div>

      {results.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-zinc-600" />
          </div>
          <p className="text-zinc-400 font-medium">No messages sent yet</p>
          <p className="text-sm text-zinc-500 mt-1">Start by sending your first message</p>
          <Link
            to="/send"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Send Message
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-1">
            <AnimatePresence>
              {results.map((msg) => (
                <MessageItem
                  key={msg._id}
                  msg={msg}
                  contactName={phoneToName.get(msg.phone)}
                />
              ))}
            </AnimatePresence>
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-800 flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Showing last {results.length} messages
            </p>
            <Link
              to="/campaigns/new"
              className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors group"
            >
              New campaign
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
