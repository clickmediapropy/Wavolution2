import { useState } from "react";
import { Pencil, Trash2, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Contact {
  _id: string;
  _creationTime: number;
  userId: string;
  phone: string;
  name?: string;
  status: string;
  sentAt?: number;
}

interface ContactTableProps {
  contacts: Contact[];
  canLoadMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onDeleteSelected: (ids: string[]) => void;
}

const statusConfig: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  pending: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  sent: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    dot: "bg-emerald-500",
  },
  failed: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    dot: "bg-red-400",
  },
};

const defaultStatus = {
  bg: "bg-zinc-500/10",
  text: "text-zinc-400",
  dot: "bg-zinc-400",
};

export function ContactTable({
  contacts,
  canLoadMore,
  isLoadingMore,
  onLoadMore,
  onEdit,
  onDelete,
  onDeleteSelected,
}: ContactTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === contacts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(contacts.map((c) => c._id)));
    }
  }

  function handleDeleteSelected() {
    onDeleteSelected(Array.from(selected));
    setSelected(new Set());
  }

  if (contacts.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-12 text-center">
        <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <p className="text-zinc-400 text-lg">No contacts yet</p>
        <p className="text-zinc-500 text-sm mt-1">
          Add contacts manually or upload a CSV file.
        </p>
      </div>
    );
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3">
          <span className="text-sm text-zinc-400">
            {selected.size} selected
          </span>
          <button
            onClick={handleDeleteSelected}
            className="text-sm text-red-400 hover:text-red-300 font-medium"
            aria-label="Delete selected"
          >
            Delete selected
          </button>
        </div>
      )}

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-800/50">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={
                    contacts.length > 0 && selected.size === contacts.length
                  }
                  onChange={toggleSelectAll}
                  className="rounded border-zinc-600 bg-zinc-800 accent-emerald-500"
                  aria-label="Select all"
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Name
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Phone
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Status
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => {
              const config = statusConfig[contact.status] ?? defaultStatus;
              return (
                <tr
                  key={contact._id}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(contact._id)}
                      onChange={() => toggleSelect(contact._id)}
                      className="rounded border-zinc-600 bg-zinc-800 accent-emerald-500"
                      aria-label={`Select ${contact.name || contact.phone}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-200">
                    {contact.name || (
                      <span className="text-zinc-600">&mdash;</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-zinc-300">
                    {contact.phone}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                        config.bg,
                        config.text,
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          config.dot,
                        )}
                      />
                      {contact.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onEdit(contact)}
                      className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors"
                      aria-label="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(contact._id)}
                      className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors ml-1"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {canLoadMore && (
        <div className="mt-4 text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-2 text-sm font-medium text-zinc-400 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </span>
            ) : (
              "Load more"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
