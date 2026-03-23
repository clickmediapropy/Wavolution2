import { useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { getFullName } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Phone,
  Tag,
  Plus,
  X,
  MessageSquare,
  Inbox,
  Loader2,
  Star,
  Clock,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { staggerContainerVariants, staggerItemVariants } from "@/lib/transitions";

function formatTimeAgo(timestamp: number): string {
  const delta = Date.now() - timestamp;
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function TagEditor({
  tags,
  contactId,
}: {
  tags: string[];
  contactId: Id<"contacts">;
}) {
  const addTag = useMutation(api.contacts.addTag);
  const removeTag = useMutation(api.contacts.removeTag);
  const [newTag, setNewTag] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = useCallback(async () => {
    const tag = newTag.trim();
    if (!tag) return;
    try {
      await addTag({ contactId, tag });
      setNewTag("");
      setIsAdding(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add tag");
    }
  }, [addTag, contactId, newTag]);

  const handleRemove = useCallback(
    async (tag: string) => {
      try {
        await removeTag({ contactId, tag });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to remove tag",
        );
      }
    },
    [removeTag, contactId],
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Tag className="w-4 h-4 text-zinc-500" />
        <span className="text-sm font-medium text-zinc-400">Tags</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-full group"
          >
            {tag}
            <button
              onClick={() => handleRemove(tag)}
              className="text-zinc-600 hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {isAdding ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") {
                  setIsAdding(false);
                  setNewTag("");
                }
              }}
              placeholder="Tag name..."
              className="w-24 px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-full focus:ring-1 focus:ring-emerald-500/50 outline-none"
              autoFocus
            />
            <button
              onClick={handleAdd}
              className="text-emerald-400 hover:text-emerald-300"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 border border-dashed border-zinc-700 text-zinc-500 rounded-full hover:border-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        )}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
}: {
  message: {
    _id: string;
    message: string;
    direction?: string;
    status: string;
    _creationTime: number;
    sentBy?: string;
    isNote?: boolean;
  };
}) {
  const isOutgoing = message.direction === "outgoing";
  const isNote = message.isNote;

  return (
    <div
      className={cn(
        "flex",
        isOutgoing ? "justify-end" : "justify-start",
        isNote && "justify-center",
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-xl px-3.5 py-2",
          isNote
            ? "bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs italic"
            : isOutgoing
              ? "bg-emerald-600/20 border border-emerald-500/20 text-zinc-100"
              : "bg-zinc-800 border border-zinc-700 text-zinc-100",
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.message}
        </p>
        <div
          className={cn(
            "flex items-center gap-1.5 mt-1",
            isOutgoing ? "justify-end" : "justify-start",
          )}
        >
          <span className="text-[10px] text-zinc-500">
            {formatTimeAgo(message._creationTime)}
          </span>
          {isOutgoing && message.sentBy && (
            <span className="text-[10px] text-zinc-600">
              {message.sentBy}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const detail = useQuery(
    api.contacts.getDetail,
    id ? { contactId: id as Id<"contacts"> } : "skip",
  );

  if (!id) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-zinc-500">No contact selected</p>
      </div>
    );
  }

  if (detail === undefined) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (detail === null) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-zinc-400">Contact not found</p>
        <Link
          to="/contacts"
          className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Back to contacts
        </Link>
      </div>
    );
  }

  const { contact, conversation, messages, pipelineStage } = detail;
  const name = getFullName(contact);
  const tags = contact.tags ?? [];
  const customFields = contact.customFields ?? {};

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className="p-4 md:p-6 space-y-6"
    >
      {/* Back link */}
      <motion.div variants={staggerItemVariants}>
        <Link
          to="/contacts"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to contacts
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Contact info */}
        <motion.div
          variants={staggerItemVariants}
          className="lg:col-span-1 space-y-4"
        >
          {/* Contact card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <User className="w-7 h-7 text-zinc-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-100">
                  {name || "Unknown"}
                </h1>
                <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                  <Phone className="w-3.5 h-3.5" />
                  {contact.phone}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs text-zinc-500">Engagement</span>
                </div>
                <p className="text-lg font-bold text-zinc-100">
                  {contact.engagementScore ?? "—"}
                </p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs text-zinc-500">Last Message</span>
                </div>
                <p className="text-sm font-medium text-zinc-100">
                  {contact.lastMessageAt
                    ? formatTimeAgo(contact.lastMessageAt)
                    : "—"}
                </p>
              </div>
            </div>

            {/* Pipeline stage */}
            {pipelineStage && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm font-medium text-zinc-400">
                    Pipeline Stage
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: pipelineStage.color ?? "#6b7280",
                    }}
                  />
                  <span className="text-sm text-zinc-100">
                    {pipelineStage.name}
                  </span>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="mb-4">
              <TagEditor tags={tags} contactId={contact._id} />
            </div>

            {/* Custom fields */}
            {Object.keys(customFields).length > 0 && (
              <div>
                <p className="text-sm font-medium text-zinc-400 mb-2">
                  Custom Fields
                </p>
                <div className="space-y-1.5">
                  {Object.entries(customFields).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-zinc-500">{key}</span>
                      <span className="text-zinc-200">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            {conversation && (
              <div className="mt-5 pt-4 border-t border-zinc-800">
                <Link
                  to={`/inbox/${conversation._id}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-600/20 transition-colors"
                >
                  <Inbox className="w-4 h-4" />
                  Open in Inbox
                </Link>
              </div>
            )}

            {/* AI Summary */}
            {contact.aiSummary && (
              <div className="mt-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                <p className="text-xs font-medium text-zinc-500 mb-1">
                  AI Summary
                </p>
                <p className="text-sm text-zinc-300">{contact.aiSummary}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right: Conversation history */}
        <motion.div variants={staggerItemVariants} className="lg:col-span-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col h-[calc(100vh-220px)]">
            {/* Conversation header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-500" />
                <h2 className="text-sm font-medium text-zinc-100">
                  Conversation History
                </h2>
                <span className="text-xs text-zinc-500">
                  {messages.length} messages
                </span>
              </div>
              {conversation && (
                <Link
                  to={`/inbox/${conversation._id}`}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Open full inbox
                </Link>
              )}
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="w-8 h-8 text-zinc-700 mb-3" />
                  <p className="text-sm text-zinc-500">
                    No messages yet with this contact
                  </p>
                </div>
              ) : (
                // Messages are returned newest first; reverse for chronological display
                [...messages].reverse().map((msg) => (
                  <MessageBubble key={msg._id} message={msg} />
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
