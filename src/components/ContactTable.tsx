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

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  sent: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No contacts yet</p>
        <p className="text-gray-400 text-sm mt-1">
          Add contacts manually or upload a CSV file.
        </p>
      </div>
    );
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {selected.size} selected
          </span>
          <button
            onClick={handleDeleteSelected}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
            aria-label="Delete selected"
          >
            Delete selected
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={
                    contacts.length > 0 && selected.size === contacts.length
                  }
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300"
                  aria-label="Select all"
                />
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                Name
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                Phone
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                Status
              </th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr
                key={contact._id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(contact._id)}
                    onChange={() => toggleSelect(contact._id)}
                    className="rounded border-gray-300"
                    aria-label={`Select ${contact.name || contact.phone}`}
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {contact.name || (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-gray-700">
                  {contact.phone}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-block px-2 py-0.5 rounded-full text-xs font-medium",
                      statusColors[contact.status] ??
                        "bg-gray-100 text-gray-800",
                    )}
                  >
                    {contact.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onEdit(contact)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(contact._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors ml-1"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canLoadMore && (
        <div className="mt-4 text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
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
