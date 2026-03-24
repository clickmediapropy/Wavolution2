import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Layers, Plus, Pencil, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { staggerContainerVariants, staggerItemVariants, scaleInVariants } from "@/lib/transitions";
import type { Id } from "@convex/_generated/dataModel";

const PRESET_COLORS = [
  "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface VerticalFormData {
  name: string;
  slug: string;
  description: string;
  color: string;
}

const EMPTY_FORM: VerticalFormData = {
  name: "",
  slug: "",
  description: "",
  color: "#10b981",
};

export function VerticalsPage() {
  const verticals = useQuery(api.verticals.list);
  const createVertical = useMutation(api.verticals.create);
  const updateVertical = useMutation(api.verticals.update);
  const removeVertical = useMutation(api.verticals.remove);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"verticals"> | null>(null);
  const [form, setForm] = useState<VerticalFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (v: { _id: Id<"verticals">; name: string; description?: string; color: string }) => {
    setEditingId(v._id);
    setForm({
      name: v.name,
      slug: "", // not editable
      description: v.description ?? "",
      color: v.color,
    });
    setModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : slugify(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await updateVertical({
          id: editingId,
          name: form.name,
          description: form.description || undefined,
          color: form.color,
        });
        toast.success("Vertical updated");
      } else {
        await createVertical({
          name: form.name,
          slug: form.slug || slugify(form.name),
          description: form.description || undefined,
          color: form.color,
        });
        toast.success("Vertical created");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save vertical");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: Id<"verticals">) => {
    try {
      await removeVertical({ id });
      toast.success("Vertical deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete vertical");
    }
  };

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
          <div className="p-2 bg-violet-500/10 rounded-xl">
            <Layers className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <h1 className="text-h2 text-zinc-100">Verticals</h1>
            <p className="text-small text-zinc-500">Categorize your leads and offers by niche</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Vertical
        </button>
      </motion.div>

      {/* Grid */}
      <motion.div
        variants={staggerItemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {verticals === undefined ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse h-40" />
          ))
        ) : verticals.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Layers className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400">No verticals yet. Create one to get started.</p>
          </div>
        ) : (
          verticals.map((v) => (
            <motion.div
              key={v._id}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: v.color }}
                  />
                  <h3 className="text-zinc-100 font-semibold">{v.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(v)}
                    className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => void handleDelete(v._id)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {v.description && (
                <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{v.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-zinc-400">
                <span>{v.offerCount ?? 0} offers</span>
                <span>{v.leadCount ?? 0} leads</span>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              variants={scaleInVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-zinc-100">
                    {editingId ? "Edit Vertical" : "New Vertical"}
                  </h2>
                  <button onClick={() => setModalOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. GLP-1 / Ozempic"
                      required
                    />
                  </div>

                  {!editingId && (
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Slug</label>
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                        placeholder="auto-generated"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                      rows={3}
                      placeholder="Optional description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, color }))}
                          className={cn(
                            "w-8 h-8 rounded-lg transition-all",
                            form.color === color && "ring-2 ring-white ring-offset-2 ring-offset-zinc-900"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !form.name.trim()}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {submitting ? "Saving..." : editingId ? "Update" : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
