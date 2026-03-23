import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Save,
  X,
  MessageSquareText,
} from "lucide-react";
import { toast } from "sonner";
import { staggerContainerVariants, staggerItemVariants, scaleInVariants } from "@/lib/transitions";
import type { Id } from "@convex/_generated/dataModel";

interface FormState {
  shortcut: string;
  text: string;
  category: string;
}

const emptyForm: FormState = { shortcut: "", text: "", category: "" };

export function QuickRepliesPage() {
  const replies = useQuery(api.quickReplies.list);
  const createReply = useMutation(api.quickReplies.create);
  const updateReply = useMutation(api.quickReplies.update);
  const removeReply = useMutation(api.quickReplies.remove);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"quickReplies"> | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<Id<"quickReplies"> | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<Id<"quickReplies"> | null>(null);

  function openCreateForm(): void {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditForm(reply: {
    _id: Id<"quickReplies">;
    shortcut: string;
    text: string;
    category?: string;
  }): void {
    setEditingId(reply._id);
    setForm({
      shortcut: reply.shortcut.replace(/^\//, ""),
      text: reply.text,
      category: reply.category ?? "",
    });
    setShowForm(true);
  }

  function closeForm(): void {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSave(): Promise<void> {
    const shortcut = form.shortcut.trim();
    const text = form.text.trim();

    if (!shortcut || !text) {
      toast.error("Shortcut and text are required");
      return;
    }

    const prefixedShortcut = shortcut.startsWith("/") ? shortcut : `/${shortcut}`;

    setIsSaving(true);
    try {
      if (editingId) {
        await updateReply({
          id: editingId,
          shortcut: prefixedShortcut,
          text,
          ...(form.category.trim() ? { category: form.category.trim() } : {}),
        });
        toast.success("Quick reply updated");
      } else {
        await createReply({
          shortcut: prefixedShortcut,
          text,
          ...(form.category.trim() ? { category: form.category.trim() } : {}),
        });
        toast.success("Quick reply created");
      }
      closeForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: Id<"quickReplies">): Promise<void> {
    setDeletingId(id);
    try {
      await removeReply({ id });
      toast.success("Quick reply deleted");
      setConfirmDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  if (replies === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={staggerItemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl">
            <Zap className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Quick Replies</h1>
            <p className="text-sm text-zinc-500">
              Manage reusable message templates with shortcut triggers.
            </p>
          </div>
        </div>
        <button
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Reply
        </button>
      </motion.div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            variants={scaleInVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100">
                {editingId ? "Edit Quick Reply" : "New Quick Reply"}
              </h2>
              <button
                onClick={closeForm}
                className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Shortcut */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Shortcut
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">/</span>
                  <input
                    type="text"
                    value={form.shortcut}
                    onChange={(e) => setForm({ ...form, shortcut: e.target.value.replace(/^\//, "") })}
                    placeholder="greeting"
                    className="w-full pl-7 pr-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none text-sm"
                  />
                </div>
                <p className="text-xs text-zinc-600 mt-1">
                  Type /{form.shortcut || "shortcut"} to insert this reply.
                </p>
              </div>

              {/* Category (optional) */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Category <span className="text-zinc-600">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Sales, Support, Follow-up..."
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none text-sm"
                />
              </div>
            </div>

            {/* Text */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Message Text
              </label>
              <textarea
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                rows={3}
                placeholder="Hello! Thanks for reaching out. How can I help you today?"
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none text-sm resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={closeForm}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply list */}
      {replies.length === 0 ? (
        <motion.div
          variants={staggerItemVariants}
          className="bg-zinc-900 rounded-xl border border-zinc-800 p-12 text-center"
        >
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquareText className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-100 mb-2">No quick replies yet</h2>
          <p className="text-zinc-400 mb-4">
            Create your first quick reply template to speed up conversations.
          </p>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Quick Reply
          </button>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerItemVariants}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
        >
          {/* Table header */}
          <div className="grid grid-cols-[140px_1fr_100px_80px] sm:grid-cols-[160px_1fr_120px_100px] gap-4 px-5 py-3 border-b border-zinc-800 bg-zinc-900/50">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Shortcut</span>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Message</span>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider hidden sm:block">Category</span>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">Actions</span>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-zinc-800/50">
            {replies.map((reply) => (
              <div
                key={reply._id}
                className="grid grid-cols-[140px_1fr_100px_80px] sm:grid-cols-[160px_1fr_120px_100px] gap-4 px-5 py-3.5 items-center hover:bg-zinc-800/30 transition-colors"
              >
                <span className="text-sm font-mono text-emerald-400 truncate">
                  {reply.shortcut}
                </span>
                <span className="text-sm text-zinc-300 truncate">
                  {reply.text}
                </span>
                <span className="text-xs text-zinc-500 truncate hidden sm:block">
                  {reply.category || "--"}
                </span>
                <div className="flex items-center justify-end gap-1">
                  {confirmDeleteId === reply._id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(reply._id)}
                        disabled={deletingId === reply._id}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Confirm delete"
                      >
                        {deletingId === reply._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => openEditForm(reply)}
                        className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(reply._id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer count */}
          <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/50">
            <p className="text-xs text-zinc-500">
              {replies.length} {replies.length === 1 ? "template" : "templates"}
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
