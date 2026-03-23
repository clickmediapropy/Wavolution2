import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Save,
  X,
  Clock,
  MessageCircle,
  Power,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  staggerContainerVariants,
  staggerItemVariants,
  scaleInVariants,
} from "@/lib/transitions";
import type { Id } from "@convex/_generated/dataModel";

interface StepForm {
  delayMinutes: number;
  messageTemplate: string;
}

interface SequenceForm {
  name: string;
  steps: StepForm[];
}

const emptyStep: StepForm = { delayMinutes: 30, messageTemplate: "" };
const emptyForm: SequenceForm = { name: "", steps: [{ ...emptyStep }] };

function formatDelay(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function AutoFollowupPage() {
  const sequences = useQuery(api.followups.list);
  const createSequence = useMutation(api.followups.create);
  const updateSequence = useMutation(api.followups.update);
  const removeSequence = useMutation(api.followups.remove);
  const toggleActive = useMutation(api.followups.toggleActive);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"followupSequences"> | null>(
    null,
  );
  const [form, setForm] = useState<SequenceForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<Id<"followupSequences"> | null>(
    null,
  );
  const [confirmDeleteId, setConfirmDeleteId] =
    useState<Id<"followupSequences"> | null>(null);
  const [expandedId, setExpandedId] = useState<Id<"followupSequences"> | null>(
    null,
  );
  const [togglingId, setTogglingId] = useState<Id<"followupSequences"> | null>(
    null,
  );

  const openCreateForm = () => {
    setEditingId(null);
    setForm({ name: "", steps: [{ ...emptyStep }] });
    setShowForm(true);
  };

  const openEditForm = (seq: {
    _id: Id<"followupSequences">;
    name: string;
    steps: StepForm[];
  }) => {
    setEditingId(seq._id);
    setForm({
      name: seq.name,
      steps: seq.steps.map((s) => ({ ...s })),
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  // Step management
  const addStep = () => {
    setForm({ ...form, steps: [...form.steps, { ...emptyStep }] });
  };

  const removeStep = (index: number) => {
    if (form.steps.length <= 1) return;
    setForm({
      ...form,
      steps: form.steps.filter((_, i) => i !== index),
    });
  };

  const updateStep = (index: number, field: keyof StepForm, value: string | number) => {
    const updated = form.steps.map((s, i) =>
      i === index ? { ...s, [field]: value } as StepForm : s,
    );
    setForm({ ...form, steps: updated });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Sequence name is required");
      return;
    }
    if (form.steps.length === 0) {
      toast.error("At least one step is required");
      return;
    }
    for (const [i, step] of form.steps.entries()) {
      if (step.delayMinutes < 1) {
        toast.error(`Step ${i + 1}: delay must be at least 1 minute`);
        return;
      }
      if (!step.messageTemplate.trim()) {
        toast.error(`Step ${i + 1}: message cannot be empty`);
        return;
      }
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await updateSequence({
          id: editingId,
          name: form.name,
          steps: form.steps,
        });
        toast.success("Sequence updated");
      } else {
        await createSequence({
          name: form.name,
          steps: form.steps,
        });
        toast.success("Sequence created");
      }
      closeForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: Id<"followupSequences">) => {
    setDeletingId(id);
    try {
      await removeSequence({ id });
      toast.success("Sequence deleted");
      setConfirmDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (id: Id<"followupSequences">) => {
    setTogglingId(id);
    try {
      await toggleActive({ id });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle");
    } finally {
      setTogglingId(null);
    }
  };

  if (sequences === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
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
      <motion.div
        variants={staggerItemVariants}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-xl">
            <Timer className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">
              Auto Follow-ups
            </h1>
            <p className="text-sm text-zinc-500">
              Create automated message sequences with timed delays.
            </p>
          </div>
        </div>
        <button
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Sequence
        </button>
      </motion.div>

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
                {editingId ? "Edit Sequence" : "New Sequence"}
              </h2>
              <button
                onClick={closeForm}
                className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Sequence Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. New Lead Follow-up"
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none text-sm"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-400">
                  Steps
                </label>
                <button
                  onClick={addStep}
                  className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Step
                </button>
              </div>

              {form.steps.map((step, index) => (
                <div
                  key={index}
                  className="relative bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-amber-400/80">
                      Step {index + 1}
                    </span>
                    {form.steps.length > 1 && (
                      <button
                        onClick={() => removeStep(index)}
                        className="p-1 text-zinc-600 hover:text-red-400 transition-colors rounded"
                        title="Remove step"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">
                      Delay (minutes)
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                      <input
                        type="number"
                        min={1}
                        value={step.delayMinutes}
                        onChange={(e) =>
                          updateStep(
                            index,
                            "delayMinutes",
                            parseInt(e.target.value) || 1,
                          )
                        }
                        className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none text-sm"
                      />
                    </div>
                    <p className="text-xs text-zinc-600 mt-1">
                      Sends {formatDelay(step.delayMinutes)} after{" "}
                      {index === 0 ? "trigger" : `step ${index}`}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">
                      Message
                    </label>
                    <textarea
                      value={step.messageTemplate}
                      onChange={(e) =>
                        updateStep(index, "messageTemplate", e.target.value)
                      }
                      rows={2}
                      placeholder="Hi {{name}}, just following up..."
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none text-sm resize-none"
                    />
                    <p className="text-xs text-zinc-600 mt-1">
                      Use {"{{name}}"} for the contact name.
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={closeForm}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      {sequences.length === 0 ? (
        <motion.div
          variants={staggerItemVariants}
          className="bg-zinc-900 rounded-xl border border-zinc-800 p-12 text-center"
        >
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-100 mb-2">
            No follow-up sequences yet
          </h2>
          <p className="text-zinc-400 mb-4">
            Create your first sequence to automate timed follow-up messages.
          </p>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Sequence
          </button>
        </motion.div>
      ) : (
        <motion.div variants={staggerItemVariants} className="space-y-3">
          {sequences.map((seq) => (
            <div
              key={seq._id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
            >
              <div className="flex items-center gap-4 px-5 py-4">
                <button
                  onClick={() => handleToggle(seq._id)}
                  disabled={togglingId === seq._id}
                  className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors ${
                    seq.isActive
                      ? "bg-amber-600"
                      : "bg-zinc-700"
                  }`}
                  title={seq.isActive ? "Active — click to deactivate" : "Inactive — click to activate"}
                >
                  {togglingId === seq._id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  ) : (
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        seq.isActive ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-zinc-100 truncate">
                      {seq.name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        seq.isActive
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      {seq.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {seq.steps.length}{" "}
                    {seq.steps.length === 1 ? "step" : "steps"} &middot; Total
                    delay:{" "}
                    {formatDelay(
                      seq.steps.reduce((sum, s) => sum + s.delayMinutes, 0),
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {confirmDeleteId === seq._id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(seq._id)}
                        disabled={deletingId === seq._id}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Confirm delete"
                      >
                        {deletingId === seq._id ? (
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
                        onClick={() => openEditForm(seq)}
                        className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(seq._id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() =>
                      setExpandedId(
                        expandedId === seq._id ? null : seq._id,
                      )
                    }
                    className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Toggle steps"
                  >
                    {expandedId === seq._id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedId === seq._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-zinc-800 px-5 py-4 space-y-3">
                      {seq.steps.map((step, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 pl-2"
                        >
                          <div className="flex flex-col items-center pt-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60 ring-2 ring-amber-500/20" />
                            {i < seq.steps.length - 1 && (
                              <div className="w-px flex-1 bg-zinc-700 mt-1 min-h-[24px]" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 pb-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-amber-400/80">
                                Step {i + 1}
                              </span>
                              <span className="text-xs text-zinc-600">
                                &middot; {formatDelay(step.delayMinutes)} delay
                              </span>
                            </div>
                            <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                              {step.messageTemplate}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          <div className="px-1">
            <p className="text-xs text-zinc-500">
              {sequences.length}{" "}
              {sequences.length === 1 ? "sequence" : "sequences"} &middot;{" "}
              {sequences.filter((s) => s.isActive).length} active
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
