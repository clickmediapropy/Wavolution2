import { usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { MessageSquare, CheckCircle2, XCircle } from "lucide-react";

export function RecentMessages() {
  const messages = usePaginatedQuery(
    api.messages.list,
    {},
    { initialNumItems: 5 },
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-violet-400" />
        <h2 className="text-sm font-medium text-zinc-300">Recent Messages</h2>
      </div>

      {messages.results.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-6">
          No messages sent yet
        </p>
      ) : (
        <div className="space-y-2">
          {messages.results.map((msg) => (
            <div
              key={msg._id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-800/50"
            >
              {msg.status === "sent" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <span className="text-sm text-zinc-300 truncate flex-1">
                {msg.phone}
              </span>
              <span className="text-xs text-zinc-500 truncate max-w-[40%]">
                {msg.message}
              </span>
              <span className="text-xs text-zinc-600 flex-shrink-0">
                {new Date(msg._creationTime).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
