import { useState, useMemo } from "react";
import { Users, Clock, UserCheck } from "lucide-react";
import type { Doc } from "@convex/_generated/dataModel";

type RecipientType = "all" | "pending" | "manual";

interface RecipientSelectorProps {
  contacts: Doc<"contacts">[];
  recipientType: RecipientType;
  onRecipientTypeChange: (type: RecipientType) => void;
  selectedContactIds: string[];
  onSelectedContactIdsChange: (ids: string[]) => void;
}

const RECIPIENT_OPTIONS: {
  value: RecipientType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "all",
    label: "All Contacts",
    description: "Send to every contact in your list",
    icon: <Users className="w-5 h-5" />,
  },
  {
    value: "pending",
    label: "Pending Only",
    description: "Send to contacts that haven't received a message",
    icon: <Clock className="w-5 h-5" />,
  },
  {
    value: "manual",
    label: "Manual Selection",
    description: "Pick specific contacts from your list",
    icon: <UserCheck className="w-5 h-5" />,
  },
];

export function RecipientSelector({
  contacts,
  recipientType,
  onRecipientTypeChange,
  selectedContactIds,
  onSelectedContactIdsChange,
}: RecipientSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.phone.toLowerCase().includes(q) ||
        (c.firstName && c.firstName.toLowerCase().includes(q)) ||
        (c.lastName && c.lastName.toLowerCase().includes(q)),
    );
  }, [contacts, searchQuery]);

  const recipientCount = useMemo(() => {
    switch (recipientType) {
      case "all":
        return contacts.length;
      case "pending":
        return contacts.filter((c) => c.status === "pending").length;
      case "manual":
        return selectedContactIds.length;
    }
  }, [recipientType, contacts, selectedContactIds]);

  const toggleContact = (id: string) => {
    onSelectedContactIdsChange(
      selectedContactIds.includes(id)
        ? selectedContactIds.filter((cid) => cid !== id)
        : [...selectedContactIds, id],
    );
  };

  const toggleAll = () => {
    if (selectedContactIds.length === filteredContacts.length) {
      onSelectedContactIdsChange([]);
    } else {
      onSelectedContactIdsChange(filteredContacts.map((c) => c._id));
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-zinc-300">Choose Recipients</h3>

      {/* Radio cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {RECIPIENT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onRecipientTypeChange(opt.value)}
            className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-colors ${
              recipientType === opt.value
                ? "border-emerald-500 bg-emerald-500/5"
                : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
            }`}
            aria-pressed={recipientType === opt.value}
          >
            <span
              className={
                recipientType === opt.value
                  ? "text-emerald-400"
                  : "text-zinc-400"
              }
            >
              {opt.icon}
            </span>
            <span className="text-sm font-medium text-zinc-100">
              {opt.label}
            </span>
            <span className="text-xs text-zinc-500">{opt.description}</span>
          </button>
        ))}
      </div>

      {/* Recipient count */}
      <p className="text-sm text-zinc-400">
        <span className="font-medium text-emerald-400">{recipientCount}</span>{" "}
        {recipientCount === 1 ? "recipient" : "recipients"} selected
      </p>

      {/* Manual selection checkbox list */}
      {recipientType === "manual" && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none text-sm"
            aria-label="Search contacts"
          />

          {filteredContacts.length > 0 && (
            <div className="flex items-center gap-2 px-1">
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {selectedContactIds.length === filteredContacts.length
                  ? "Deselect all"
                  : "Select all"}
              </button>
            </div>
          )}

          <div
            className="max-h-60 overflow-y-auto space-y-1 rounded-lg border border-zinc-700 p-2"
            role="group"
            aria-label="Contact selection"
          >
            {filteredContacts.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">
                No contacts found
              </p>
            ) : (
              filteredContacts.map((contact) => (
                <label
                  key={contact._id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selectedContactIds.includes(contact._id)
                      ? "bg-emerald-500/10"
                      : "hover:bg-zinc-800"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedContactIds.includes(contact._id)}
                    onChange={() => toggleContact(contact._id)}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500/50"
                  />
                  <span className="text-sm text-zinc-200 truncate">
                    {(contact.firstName || contact.lastName)
                      ? `${[contact.firstName, contact.lastName].filter(Boolean).join(" ")} (${contact.phone})`
                      : contact.phone}
                  </span>
                  <span
                    className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                      contact.status === "pending"
                        ? "bg-amber-500/10 text-amber-400"
                        : contact.status === "sent"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {contact.status}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
