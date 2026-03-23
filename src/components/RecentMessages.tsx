import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { MessageSquare, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { relativeTime } from "@/lib/relativeTime";

export function RecentMessages() {
  const messages = usePaginatedQuery(
    api.messages.list,
    {},
    { initialNumItems: 5 },
  );

  const contacts = useQuery(api.contacts.list, {
    paginationOpts: { numItems: 500, cursor: null },
  });
  const phoneToName = new Map<string, string>();
  if (contacts?.page) {
    for (const c of contacts.page) {
      const fullName = [c.firstName, c.lastName].filter(Boolean).join(" ");
      if (fullName) phoneToName.set(c.phone, fullName);
    }
  }

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
        <div className="divide-y divide-zinc-800">
          {messages.results.map((msg) => {
            const contactName = phoneToName.get(msg.phone);
            return (
              <div key={msg._id} className="flex items-center gap-3 px-3 py-3">
                {msg.status === "sent" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-zinc-300 block truncate">
                    {contactName ?? msg.phone}
                  </span>
                  {contactName && (
                    <span className="text-xs font-mono text-zinc-500 block truncate">
                      {msg.phone}
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-500 truncate max-w-[30%]">
                  {msg.message}
                </span>
                <span className="text-xs text-zinc-600 flex-shrink-0">
                  {relativeTime(msg._creationTime)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {messages.results.length > 0 && (
        <div className="pt-3 border-t border-zinc-800 mt-1">
          <Link
            to="/campaigns/new"
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Send new campaign &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
