import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Plus,
  Loader2,
  Trash2,
  Pencil,
  X,
  ToggleLeft,
  ToggleRight,
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { staggerContainerVariants, staggerItemVariants } from "@/lib/transitions";
import type { Id } from "@convex/_generated/dataModel";

interface Step {
  message: string;
  delay?: number;
}

interface GoalFormData {
  name: string;
  triggerKeywords: string;
  steps: Step[];
}

const emptyForm: GoalFormData = {
  name: "",
  triggerKeywords: "",
  steps: [{ message: "", delay: undefined }],
};

function parseKeywords(raw: string): string[] {
  return raw.split(",").map((k) => k.trim()).filter(Boolean);
}

function parseSteps(steps: Step[]): Array<{ message: string; delay?: number }> {
  return steps.map((s) => ({
    message: s.message,
    ...(s.delay !== undefined ? { delay: s.delay } : {}),
  }));
}

function StepRow({
  step,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  step: Step;
  index: number;
  onChange: (index: number, step: Step) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}) {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex items-center justify-center w-6 h-6 mt-2.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold flex-shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 space-y-2">
        <textarea
          value={step.message}
          onChange={(e) => onChange(index, { ...step, message: e.target.value })}
          placeholder="Message text..."
          rows={2}
          className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none text-sm resize-none"
        />
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <input
            type="number"
            min={0}
            value={step.delay ?? ""}
            onChange={(e) =>
              onChange(index, {
                ...step,
                delay: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="Delay (seconds)"
            className="w-40 px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none text-xs"
          />
          <span className="text-xs text-zinc-600">optional</span>
        </div>
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="mt-2.5 p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
          aria-label="Remove step"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function GoalForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial: GoalFormData;
  onSubmit: (data: GoalFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<GoalFormData>(initial);
  const [saving, setSaving] = useState(false);

  const updateStep = (index: number, step: Step) => {
    const next = [...form.steps];
    next[index] = step;
    setForm({ ...form, steps: next });
  };

  const removeStep = (index: number) => {
    setForm({ ...form, steps: form.steps.filter((_, i) => i !== index) });
  };

  const addStep = () => {
    setForm({ ...form, steps: [...form.steps, { message: "", delay: undefined }] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (form.steps.some((s) => !s.message.trim())) {
      toast.error("All steps must have a message");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
          <Target className="w-3.5 h-3.5" />
          Goal Name
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Welcome Sequence"
          className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none text-sm"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
          <MessageSquare className="w-3.5 h-3.5" />
          Trigger Keywords
        </label>
        <input
          type="text"
          value={form.triggerKeywords}
          onChange={(e) => setForm({ ...form, triggerKeywords: e.target.value })}
          placeholder="hello, hi, start (comma separated)"
          className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none text-sm"
        />
        <p className="text-xs text-zinc-600 mt-1">
          Separate multiple keywords with commas.
        </p>
      </div>

      <div>
        <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-3">
          Steps
        </label>
        <div className="space-y-4">
          {form.steps.map((step, i) => (
            <StepRow
              key={i}
              step={step}
              index={i}
              onChange={updateStep}
              onRemove={removeStep}
              canRemove={form.steps.length > 1}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addStep}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg hover:bg-amber-500/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Step
        </button>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-900 bg-amber-500 rounded-lg hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function GoalCard({
  goal,
}: {
  goal: {
    _id: Id<"botGoals">;
    name: string;
    triggerKeywords: string[];
    steps: Step[];
    isActive: boolean;
  };
}) {
  const update = useMutation(api.botGoals.update);
  const remove = useMutation(api.botGoals.remove);
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleToggle = async () => {
    try {
      await update({ id: goal._id, isActive: !goal.isActive });
      toast.success(goal.isActive ? "Goal deactivated" : "Goal activated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleDelete = async () => {
    try {
      await remove({ id: goal._id });
      toast.success("Goal deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleUpdate = async (data: GoalFormData) => {
    try {
      await update({
        id: goal._id,
        name: data.name,
        triggerKeywords: parseKeywords(data.triggerKeywords),
        steps: parseSteps(data.steps),
      });
      toast.success("Goal updated");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  if (editing) {
    return (
      <motion.div
        variants={staggerItemVariants}
        className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Pencil className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Edit Goal</h3>
        </div>
        <GoalForm
          initial={{
            name: goal.name,
            triggerKeywords: goal.triggerKeywords.join(", "),
            steps: goal.steps,
          }}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          submitLabel="Save Changes"
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={staggerItemVariants}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between p-5 border-b border-zinc-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-amber-500/10 rounded-lg flex-shrink-0">
            <Target className="w-5 h-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-100 truncate">{goal.name}</h3>
            <p className="text-xs text-zinc-500">
              {goal.steps.length} step{goal.steps.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggle}
            className="flex items-center gap-2 transition-colors"
            aria-label={goal.isActive ? "Deactivate goal" : "Activate goal"}
          >
            {goal.isActive ? (
              <ToggleRight className="w-8 h-8 text-emerald-400" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-zinc-600" />
            )}
            <span
              className={`text-xs font-medium ${goal.isActive ? "text-emerald-400" : "text-zinc-500"}`}
            >
              {goal.isActive ? "Active" : "Off"}
            </span>
          </button>
        </div>
      </div>

      <div className="px-5 pt-4 pb-3">
        <p className="text-xs font-medium text-zinc-500 mb-2">Trigger Keywords</p>
        <div className="flex flex-wrap gap-1.5">
          {goal.triggerKeywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full"
            >
              {kw}
            </span>
          ))}
          {goal.triggerKeywords.length === 0 && (
            <span className="text-xs text-zinc-600 italic">No keywords set</span>
          )}
        </div>
      </div>

      <div className="px-5 pb-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? "Hide steps" : "Show steps"}
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-3">
                {goal.steps.map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex items-center justify-center w-5 h-5 mt-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-zinc-300">{step.message}</p>
                      {step.delay !== undefined && step.delay > 0 && (
                        <p className="text-xs text-zinc-600 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {step.delay}s delay
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 px-5 pb-4">
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-lg hover:text-zinc-100 hover:border-zinc-600 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              Confirm Delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label="Cancel delete"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-500 bg-zinc-800 border border-zinc-700 rounded-lg hover:text-red-400 hover:border-red-500/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function BotGoalsPage() {
  const goals = useQuery(api.botGoals.list);
  const create = useMutation(api.botGoals.create);
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (data: GoalFormData) => {
    try {
      await create({
        name: data.name,
        triggerKeywords: parseKeywords(data.triggerKeywords),
        steps: parseSteps(data.steps),
        isActive: true,
      });
      toast.success("Goal created");
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create goal");
    }
  };

  if (goals === undefined) {
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
      className="space-y-6 p-6"
    >
      <motion.div variants={staggerItemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-xl">
            <Target className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Bot Goals</h1>
            <p className="text-sm text-zinc-500">
              Define automated conversation flows triggered by keywords.
            </p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-900 bg-amber-500 rounded-lg hover:bg-amber-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Goal
          </button>
        )}
      </motion.div>

      <motion.div
        variants={staggerItemVariants}
        className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3"
      >
        <Target className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-zinc-400">
          <p>
            Goals are multi-step message sequences triggered when an incoming message matches any of the
            defined keywords. Each step can include an optional delay before sending.
          </p>
        </div>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-zinc-100">Create New Goal</h3>
            </div>
            <GoalForm
              initial={emptyForm}
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              submitLabel="Create Goal"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {goals.length === 0 && !showForm ? (
        <motion.div
          variants={staggerItemVariants}
          className="bg-zinc-900 rounded-xl border border-zinc-800 p-12 text-center"
        >
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-100 mb-2">No goals yet</h2>
          <p className="text-zinc-400 mb-4">
            Create your first bot goal to automate conversation flows.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-900 bg-amber-500 rounded-lg hover:bg-amber-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Goal
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {goals.map((goal) => (
            <GoalCard key={goal._id} goal={goal} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
