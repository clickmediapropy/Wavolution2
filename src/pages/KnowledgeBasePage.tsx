import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Trash2,
  Loader2,
  FileText,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { staggerContainerVariants, staggerItemVariants } from "@/lib/transitions";
import type { Id } from "@convex/_generated/dataModel";

export function KnowledgeBasePage() {
  const entries = useQuery(api.knowledgeBase.list);
  const createEntry = useMutation(api.knowledgeBase.create);
  const removeEntry = useMutation(api.knowledgeBase.remove);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<Id<"knowledgeBaseEntries"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setIsCreating(true);
    try {
      await createEntry({
        title: title.trim(),
        content: content.trim(),
        category: category.trim() || undefined,
      });
      toast.success("Knowledge base entry created");
      setTitle("");
      setContent("");
      setCategory("");
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create entry");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: Id<"knowledgeBaseEntries">) => {
    setIsDeleting(true);
    try {
      await removeEntry({ id });
      toast.success("Entry deleted");
      setConfirmDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete entry");
    } finally {
      setIsDeleting(false);
    }
  };

  if (entries === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
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
      <motion.div variants={staggerItemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <BookOpen className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Knowledge Base</h1>
            <p className="text-sm text-zinc-500">
              Manage content your AI bot can reference when answering questions.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add Entry
            </>
          )}
        </button>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 overflow-hidden"
          >
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
                <FileText className="w-3.5 h-3.5" />
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Return Policy, Pricing Plans, FAQ..."
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="Paste or type the knowledge content here..."
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-sm resize-none"
              />
              {content.trim() && (
                <p className="text-xs text-zinc-600 mt-1">
                  {content.trim().split(/\s+/).length} words
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 mb-2 block">
                Category (optional)
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Policies, Products, Support..."
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-sm"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isCreating || !title.trim() || !content.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {isCreating ? "Creating..." : "Create Entry"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {entries.length === 0 ? (
        <motion.div
          variants={staggerItemVariants}
          className="bg-zinc-900 rounded-xl border border-zinc-800 p-12 text-center"
        >
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-100 mb-2">No entries yet</h2>
          <p className="text-zinc-400 mb-4">
            Add knowledge base entries so your AI bot can reference them when answering customer questions.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Your First Entry
          </button>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerItemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {entries.map((entry) => (
            <motion.div
              key={entry._id}
              layout
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between group hover:border-zinc-700 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2">
                    {entry.title}
                  </h3>
                  {entry.category && (
                    <span className="flex-shrink-0 text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full">
                      {entry.category}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 line-clamp-4 leading-relaxed">
                  {entry.content}
                </p>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800">
                <span className="text-[11px] text-zinc-600">
                  {entry.wordCount} word{entry.wordCount !== 1 ? "s" : ""}
                </span>

                {confirmDeleteId === entry._id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(entry._id)}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-red-400 bg-red-500/10 rounded-md hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(entry._id)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-zinc-600 hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={`Delete ${entry.title}`}
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {entries.length > 0 && (
        <motion.div
          variants={staggerItemVariants}
          className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-5 py-3 flex items-center justify-between"
        >
          <span className="text-xs text-zinc-500">
            {entries.length} entr{entries.length === 1 ? "y" : "ies"} &middot;{" "}
            {entries.reduce((sum, e) => sum + (e.wordCount ?? 0), 0).toLocaleString()} total words
          </span>
          <span className="text-xs text-zinc-600">
            Used by AI bots for contextual answers
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
