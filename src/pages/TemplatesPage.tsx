import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Save,
  X,
  Copy,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import {
  staggerContainerVariants,
  staggerItemVariants,
  scaleInVariants,
} from "@/lib/transitions";
import type { Id } from "@convex/_generated/dataModel";

const CATEGORIES = ["Greeting", "Follow-up", "Promotion", "Support"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<Category, string> = {
  Greeting: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Follow-up": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Promotion: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Support: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

interface FormState {
  name: string;
  category: Category;
  content: string;
}

const emptyForm: FormState = { name: "", category: "Greeting", content: "" };

/** Renders template content with {{variable}} placeholders highlighted. */
function TemplatePreview({ content }: { content: string }) {
  const parts = content.split(/(\{\{\w+\}\})/g);
  return (
    <span>
      {parts.map((part, i) =>
        /^\{\{\w+\}\}$/.test(part) ? (
          <span
            key={i}
            className="inline-block px-1.5 py-0.5 mx-0.5 text-xs font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded"
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

export function TemplatesPage() {
  const templates = useQuery(api.templates.list);
  const createTemplate = useMutation(api.templates.create);
  const updateTemplate = useMutation(api.templates.update);
  const removeTemplate = useMutation(api.templates.remove);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"templates"> | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<Id<"templates"> | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<Id<"templates"> | null>(null);
  const [filterCategory, setFilterCategory] = useState<Category | "All">("All");

  // Group templates by category
  const grouped = useMemo(() => {
    if (!templates) return {};
    const filtered =
      filterCategory === "All"
        ? templates
        : templates.filter((t) => t.category === filterCategory);
    const groups: Record<string, typeof templates> = {};
    for (const t of filtered) {
      const cat = t.category || "Uncategorized";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    }
    return groups;
  }, [templates, filterCategory]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (template: {
    _id: Id<"templates">;
    name: string;
    category: string;
    content: string;
  }) => {
    setEditingId(template._id);
    setForm({
      name: template.name,
      category: (CATEGORIES.includes(template.category as Category)
        ? template.category
        : "Greeting") as Category,
      content: template.content,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const content = form.content.trim();

    if (!name || !content) {
      toast.error("Name and content are required");
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await updateTemplate({
          id: editingId,
          name,
          category: form.category,
          content,
        });
        toast.success("Template updated");
      } else {
        await createTemplate({
          name,
          category: form.category,
          content,
        });
        toast.success("Template created");
      }
      closeForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: Id<"templates">) => {
    setDeletingId(id);
    try {
      await removeTemplate({ id });
      toast.success("Template deleted");
      setConfirmDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  // Extract live variables from the form content for preview
  const liveVariables = useMemo(() => {
    const matches = form.content.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    return [...new Set(matches.map((m) => m.slice(2, -2)))];
  }, [form.content]);

  if (templates === undefined) {
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
            <FileText className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Message Templates</h1>
            <p className="text-sm text-zinc-500">
              Reusable campaign templates with variable placeholders.
            </p>
          </div>
        </div>
        <button
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </motion.div>

      {/* Category filter */}
      <motion.div variants={staggerItemVariants} className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilterCategory("All")}
          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
            filterCategory === "All"
              ? "bg-zinc-100 text-zinc-900 border-zinc-100"
              : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500"
          }`}
        >
          All ({templates.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = templates.filter((t) => t.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                filterCategory === cat
                  ? CATEGORY_COLORS[cat]
                  : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500"
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
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
                {editingId ? "Edit Template" : "New Template"}
              </h2>
              <button
                onClick={closeForm}
                className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Template Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Welcome message"
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none text-sm"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none text-sm"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Message Content
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={4}
                placeholder="Hello {{firstName}}, thanks for your interest in {{product}}! We'd love to help you get started."
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none text-sm resize-none font-mono"
              />
              <p className="text-xs text-zinc-600 mt-1">
                Use {"{{variableName}}"} for dynamic placeholders.
              </p>
            </div>

            {/* Live variable preview */}
            {liveVariables.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-zinc-500">Variables:</span>
                {liveVariables.map((v) => (
                  <span
                    key={v}
                    className="inline-block px-2 py-0.5 text-xs font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded"
                  >
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            )}

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

      {/* Templates grouped by category */}
      {Object.keys(grouped).length === 0 ? (
        <motion.div
          variants={staggerItemVariants}
          className="bg-zinc-900 rounded-xl border border-zinc-800 p-12 text-center"
        >
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-100 mb-2">
            {templates.length === 0 ? "No templates yet" : "No templates in this category"}
          </h2>
          <p className="text-zinc-400 mb-4">
            {templates.length === 0
              ? "Create your first campaign message template to get started."
              : "Try a different category filter or create a new template."}
          </p>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </motion.div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <motion.div key={category} variants={staggerItemVariants} className="space-y-3">
            {/* Category heading */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full border ${
                  CATEGORY_COLORS[category as Category] ??
                  "bg-zinc-800 text-zinc-400 border-zinc-700"
                }`}
              >
                {category}
              </span>
              <span className="text-xs text-zinc-600">
                {items.length} {items.length === 1 ? "template" : "templates"}
              </span>
            </div>

            {/* Template cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {items.map((template) => (
                <div
                  key={template._id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 hover:border-zinc-700 transition-colors"
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-zinc-100 truncate">
                        {template.name}
                      </h3>
                      {template.variables.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {template.variables.map((v) => (
                            <span
                              key={v}
                              className="inline-block px-1.5 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded"
                            >
                              {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => handleCopy(template.content)}
                        className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Copy content"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditForm(template)}
                        className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {confirmDeleteId === template._id ? (
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => handleDelete(template._id)}
                            disabled={deletingId === template._id}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Confirm delete"
                          >
                            {deletingId === template._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(template._id)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Content preview with highlighted variables */}
                  <div className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap break-words">
                    <TemplatePreview content={template.content} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))
      )}

      {/* Footer count */}
      {templates.length > 0 && (
        <motion.div variants={staggerItemVariants}>
          <p className="text-xs text-zinc-500">
            {templates.length} {templates.length === 1 ? "template" : "templates"} total
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
