import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { GitMerge, ArrowLeft, Phone, User, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn, getFullName } from "@/lib/utils";

type DuplicatePair = NonNullable<ReturnType<typeof useQuery<typeof api.contacts.findDuplicates>>>[number];

function ContactCard({
  contact,
  messageCount,
  richness,
  isWinner,
  onSelect,
}: {
  contact: DuplicatePair["contactA"];
  messageCount: number;
  richness: number;
  isWinner: boolean;
  onSelect: () => void;
}) {
  const name = getFullName(contact);
  const tagCount = contact.tags?.length ?? 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex-1 rounded-xl border p-4 text-left transition-all ${
        isWinner
          ? "border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/30"
          : "border-zinc-700/50 bg-zinc-800/50 hover:border-zinc-600/50 hover:bg-zinc-800"
      }`}
    >
      {isWinner && (
        <div className="mb-2 flex items-center gap-1 text-xs font-medium text-emerald-400">
          <CheckCircle className="h-3 w-3" />
          Keep this contact
        </div>
      )}
      <div className="mb-1 flex items-center gap-2">
        <User className="h-4 w-4 text-zinc-400" />
        <span className="font-medium text-zinc-100">
          {name || <span className="italic text-zinc-500">No name</span>}
        </span>
      </div>
      <div className="mb-2 flex items-center gap-2 text-sm text-zinc-400">
        <Phone className="h-3.5 w-3.5" />
        {contact.phone}
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
        <span>{messageCount} message{messageCount !== 1 ? "s" : ""}</span>
        <span className="text-zinc-700">|</span>
        <span>{tagCount} tag{tagCount !== 1 ? "s" : ""}</span>
        <span className="text-zinc-700">|</span>
        <span>Richness: {richness}</span>
        {contact.engagementScore !== undefined && (
          <>
            <span className="text-zinc-700">|</span>
            <span>Engagement: {contact.engagementScore}</span>
          </>
        )}
      </div>
      {contact.status && (
        <div className="mt-2">
          <span
            className={cn(
              "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
              contact.status === "sent" && "bg-emerald-500/15 text-emerald-400",
              contact.status === "failed" && "bg-red-500/15 text-red-400",
              contact.status !== "sent" && contact.status !== "failed" && "bg-amber-500/15 text-amber-400",
            )}
          >
            {contact.status}
          </span>
        </div>
      )}
    </button>
  );
}

function DuplicatePairCard({
  pair,
  onMerged,
}: {
  pair: DuplicatePair;
  onMerged: () => void;
}) {
  const mergeContacts = useMutation(api.contacts.mergeContacts);
  const [merging, setMerging] = useState(false);

  // Auto-suggest: contact with higher combined score (richness + messages) is the winner
  const scoreA = pair.richnessA + pair.messageCountA;
  const scoreB = pair.richnessB + pair.messageCountB;
  const autoKeep = scoreA >= scoreB ? "A" : "B";
  const [selected, setSelected] = useState<"A" | "B">(autoKeep);

  const handleMerge = async () => {
    setMerging(true);
    try {
      const keepId = selected === "A" ? pair.contactA._id : pair.contactB._id;
      const removeId = selected === "A" ? pair.contactB._id : pair.contactA._id;
      await mergeContacts({
        keepId: keepId as Id<"contacts">,
        removeId: removeId as Id<"contacts">,
      });
      toast.success("Contacts merged successfully");
      onMerged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to merge contacts");
    } finally {
      setMerging(false);
    }
  };

  const nameA = getFullName(pair.contactA);
  const nameB = getFullName(pair.contactB);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
      {/* Reason badge */}
      <div className="mb-4 flex items-center gap-2">
        {pair.reason === "phone" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-400">
            <Phone className="h-3 w-3" />
            Same phone number
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-medium text-blue-400">
            <User className="h-3 w-3" />
            Similar name (distance: {pair.distance})
          </span>
        )}
      </div>

      {/* Contact cards side-by-side */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <ContactCard
          contact={pair.contactA}
          messageCount={pair.messageCountA}
          richness={pair.richnessA}
          isWinner={selected === "A"}
          onSelect={() => setSelected("A")}
        />
        <ContactCard
          contact={pair.contactB}
          messageCount={pair.messageCountB}
          richness={pair.richnessB}
          isWinner={selected === "B"}
          onSelect={() => setSelected("B")}
        />
      </div>

      {/* Merge button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          Click a card to choose which contact to keep. The other will be deleted
          and its data transferred.
        </p>
        <button
          type="button"
          onClick={handleMerge}
          disabled={merging}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
        >
          {merging ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GitMerge className="h-4 w-4" />
          )}
          Merge into {selected === "A" ? (nameA || "Contact A") : (nameB || "Contact B")}
        </button>
      </div>
    </div>
  );
}

export function ContactMergePage() {
  const duplicates = useQuery(api.contacts.findDuplicates);
  const [mergedKeys, setMergedKeys] = useState<Set<string>>(new Set());

  const visiblePairs = (duplicates ?? []).filter((p) => {
    const key = [p.contactA._id, p.contactB._id].sort().join(":");
    return !mergedKeys.has(key);
  });

  const handleMerged = (pair: DuplicatePair) => {
    const key = [pair.contactA._id, pair.contactB._id].sort().join(":");
    setMergedKeys((prev) => new Set(prev).add(key));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/contacts"
          className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contacts
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
            <GitMerge className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">
              Duplicate Contacts
            </h1>
            <p className="text-sm text-zinc-400">
              Review and merge duplicate contacts to keep your list clean
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {duplicates === undefined ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          <span className="ml-2 text-zinc-400">Scanning for duplicates...</span>
        </div>
      ) : visiblePairs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/50 py-16">
          <CheckCircle className="mb-3 h-10 w-10 text-emerald-400" />
          <h2 className="mb-1 text-lg font-semibold text-zinc-100">
            No duplicates found
          </h2>
          <p className="text-sm text-zinc-400">
            Your contact list looks clean. Great job!
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2.5 text-sm text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Found {visiblePairs.length} potential duplicate
            {visiblePairs.length !== 1 ? " pairs" : " pair"}. Review each and
            click Merge to combine them.
          </div>
          <div className="flex flex-col gap-4">
            {visiblePairs.map((pair) => {
              const key = [pair.contactA._id, pair.contactB._id]
                .sort()
                .join(":");
              return (
                <DuplicatePairCard
                  key={key}
                  pair={pair}
                  onMerged={() => handleMerged(pair)}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
