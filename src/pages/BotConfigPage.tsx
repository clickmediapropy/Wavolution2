import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion } from "framer-motion";
import {
  Bot,
  Loader2,
  Save,
  ToggleLeft,
  ToggleRight,
  MessageSquare,
  Thermometer,
  FileText,
  Target,
  BookOpen,
  AlertCircle,
  Plus,
  Trash2,
  X,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { staggerContainerVariants, staggerItemVariants } from "@/lib/transitions";
import type { Doc, Id } from "@convex/_generated/dataModel";

function KnowledgeBaseSection() {
  const entries = useQuery(api.knowledgeBase.list);
  const createEntry = useMutation(api.knowledgeBase.create);
  const removeEntry = useMutation(api.knowledgeBase.remove);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setIsAdding(true);
    try {
      await createEntry({ title: title.trim(), content: content.trim() });
      toast.success("Knowledge base entry added");
      setTitle("");
      setContent("");
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add entry");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await removeEntry({ id: id as Id<"knowledgeBaseEntries"> });
      toast.success("Entry deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete entry");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <h4 className="text-sm font-medium text-zinc-300">Knowledge Base</h4>
          {entries && entries.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded-full">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </span>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Content
          </button>
        )}
      </div>

      {/* Inline add form */}
      {showForm && (
        <div className="bg-zinc-800/50 rounded-lg p-4 mb-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-300">New Entry</span>
            <button
              onClick={() => {
                setShowForm(false);
                setTitle("");
                setContent("");
              }}
              className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Entry title (e.g. Return Policy)"
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-sm"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Paste or type the knowledge content here..."
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-sm resize-none"
          />
          <div className="flex justify-end">
            <button
              onClick={handleAdd}
              disabled={isAdding || !title.trim() || !content.trim()}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAdding ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              {isAdding ? "Adding..." : "Add Entry"}
            </button>
          </div>
        </div>
      )}

      {/* Entry list */}
      {entries === undefined ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-zinc-800/50 rounded-lg p-6 text-center">
          <BookOpen className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-xs text-zinc-500">
            No knowledge base entries yet. Add content to give your bot domain knowledge.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry._id}
              className="flex items-center justify-between py-2.5 px-3 bg-zinc-800/50 rounded-lg group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-zinc-200 truncate">{entry.title}</p>
                <p className="text-[11px] text-zinc-500">
                  {(entry.wordCount ?? 0).toLocaleString()} {entry.wordCount === 1 ? "word" : "words"}
                </p>
              </div>
              <button
                onClick={() => handleDelete(entry._id)}
                disabled={deletingId === entry._id}
                className="ml-2 p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                aria-label={`Delete ${entry.title}`}
              >
                {deletingId === entry._id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GoalsSection() {
  const goals = useQuery(api.botGoals.list);
  const createGoal = useMutation(api.botGoals.create);
  const updateGoal = useMutation(api.botGoals.update);
  const removeGoal = useMutation(api.botGoals.remove);

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKeywords, setNewKeywords] = useState("");
  const [newStepMessage, setNewStepMessage] = useState("");
  const [newSteps, setNewSteps] = useState<{ message: string; delayMs?: number }[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const resetForm = () => {
    setNewName("");
    setNewKeywords("");
    setNewStepMessage("");
    setNewSteps([]);
    setShowForm(false);
  };

  const handleAddStep = () => {
    if (!newStepMessage.trim()) return;
    setNewSteps((prev) => [...prev, { message: newStepMessage.trim() }]);
    setNewStepMessage("");
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("Goal name is required");
      return;
    }
    const keywords = newKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    if (keywords.length === 0) {
      toast.error("At least one trigger keyword is required");
      return;
    }
    setIsCreating(true);
    try {
      await createGoal({
        name: newName.trim(),
        triggerKeywords: keywords,
        steps: newSteps.length > 0 ? newSteps : [{ message: "Default response" }],
        isActive: true,
      });
      toast.success("Goal created");
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create goal");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggle = async (goal: NonNullable<typeof goals>[number]) => {
    try {
      await updateGoal({ id: goal._id, isActive: !goal.isActive });
      toast.success(!goal.isActive ? "Goal activated" : "Goal deactivated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update goal");
    }
  };

  const handleRemove = async (goal: NonNullable<typeof goals>[number]) => {
    try {
      await removeGoal({ id: goal._id });
      toast.success("Goal removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove goal");
    }
  };

  return (
    <div className="border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-medium text-zinc-300">Goals</h4>
          {goals && goals.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded-full">
              {goals.length}
            </span>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-violet-400 bg-violet-500/10 rounded-lg hover:bg-violet-500/20 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Create Goal
          </button>
        )}
      </div>

      {/* Inline Create Form */}
      {showForm && (
        <div className="mb-3 p-3 bg-zinc-800/70 rounded-lg border border-zinc-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-300">New Goal</span>
            <button onClick={resetForm} className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Goal name (e.g. Human Handover)"
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none text-xs"
          />
          <div>
            <input
              type="text"
              value={newKeywords}
              onChange={(e) => setNewKeywords(e.target.value)}
              placeholder="Trigger keywords (comma-separated)"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none text-xs"
            />
            <p className="text-[10px] text-zinc-600 mt-1">e.g. help, support, agent</p>
          </div>
          {/* Steps */}
          <div>
            <label className="text-[11px] text-zinc-400 mb-1 block">Steps ({newSteps.length})</label>
            {newSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] text-zinc-500 w-4 text-right">{i + 1}.</span>
                <span className="text-xs text-zinc-300 flex-1 truncate">{step.message}</span>
                <button
                  onClick={() => setNewSteps((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-zinc-600 hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newStepMessage}
                onChange={(e) => setNewStepMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddStep();
                  }
                }}
                placeholder="Step message..."
                className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none text-xs"
              />
              <button
                onClick={handleAddStep}
                disabled={!newStepMessage.trim()}
                className="px-2 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-700 rounded-lg hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            {isCreating ? "Creating..." : "Create Goal"}
          </button>
        </div>
      )}

      {/* Goals List */}
      {goals === undefined ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
        </div>
      ) : goals.length === 0 && !showForm ? (
        <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
          <Target className="w-6 h-6 text-zinc-600 mx-auto mb-1.5" />
          <p className="text-xs text-zinc-500">No goals yet. Create one to automate bot responses.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {goals.map((goal) => (
            <div
              key={goal._id}
              className="flex items-center justify-between py-2.5 px-3 bg-zinc-800/50 rounded-lg group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-medium text-zinc-200 truncate">{goal.name}</p>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                    <Layers className="w-3 h-3" />
                    {goal.steps.length} step{goal.steps.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {goal.triggerKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-400/80 rounded"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5 ml-3">
                <button
                  onClick={() => handleRemove(goal)}
                  className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Remove goal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleToggle(goal)}
                  aria-label={goal.isActive ? "Deactivate goal" : "Activate goal"}
                >
                  {goal.isActive ? (
                    <ToggleRight className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-zinc-600" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BotSettingsCard({ instance }: { instance: Doc<"instances"> }) {
  const updateBotSettings = useMutation(api.instances.updateBotSettings);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(instance.botSystemPrompt ?? "");
  const [temperature, setTemperature] = useState(instance.temperature ?? 0.7);
  const [welcomeMessage, setWelcomeMessage] = useState(instance.welcomeMessage ?? "");
  const [fallbackMessage, setFallbackMessage] = useState(instance.fallbackMessage ?? "");

  const handleToggleBot = async () => {
    try {
      await updateBotSettings({
        id: instance._id,
        botEnabled: !instance.botEnabled,
      });
      toast.success(
        instance.botEnabled ? "Bot disabled" : "Bot enabled"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update bot");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateBotSettings({
        id: instance._id,
        botSystemPrompt: systemPrompt,
        temperature,
        welcomeMessage,
        fallbackMessage,
      });
      toast.success("Bot settings saved");
      setIsEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      variants={staggerItemVariants}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/10 rounded-lg">
            <Bot className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">{instance.name}</h3>
            <p className="text-xs text-zinc-500">
              {instance.whatsappConnected ? (
                <span className="text-emerald-400">Connected</span>
              ) : (
                <span className="text-amber-400">Disconnected</span>
              )}
              {instance.whatsappNumber && ` · ${instance.whatsappNumber}`}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggleBot}
          className="flex items-center gap-2 transition-colors"
          aria-label={instance.botEnabled ? "Disable bot" : "Enable bot"}
        >
          {instance.botEnabled ? (
            <ToggleRight className="w-8 h-8 text-emerald-400" />
          ) : (
            <ToggleLeft className="w-8 h-8 text-zinc-600" />
          )}
          <span className={`text-xs font-medium ${instance.botEnabled ? "text-emerald-400" : "text-zinc-500"}`}>
            {instance.botEnabled ? "Active" : "Off"}
          </span>
        </button>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        {/* System Prompt */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
            <MessageSquare className="w-3.5 h-3.5" />
            System Prompt
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => {
              setSystemPrompt(e.target.value);
              if (!isEditing) setIsEditing(true);
            }}
            rows={4}
            placeholder="You are a helpful customer service agent for our company..."
            className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none text-sm resize-none"
          />
          <p className="text-xs text-zinc-600 mt-1">
            Define the bot's personality, knowledge, and behavior rules.
          </p>
        </div>

        {/* Temperature */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
            <Thermometer className="w-3.5 h-3.5" />
            Temperature: {temperature.toFixed(1)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => {
              setTemperature(parseFloat(e.target.value));
              if (!isEditing) setIsEditing(true);
            }}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
          />
          <div className="flex justify-between text-xs text-zinc-600 mt-1">
            <span>Precise</span>
            <span>Creative</span>
          </div>
        </div>

        {/* Welcome Message */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
            <FileText className="w-3.5 h-3.5" />
            Welcome Message
          </label>
          <input
            type="text"
            value={welcomeMessage}
            onChange={(e) => {
              setWelcomeMessage(e.target.value);
              if (!isEditing) setIsEditing(true);
            }}
            placeholder="Hello! How can I help you today?"
            className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none text-sm"
          />
          <p className="text-xs text-zinc-600 mt-1">
            Sent automatically when a new conversation starts.
          </p>
        </div>

        {/* Fallback Message */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
            <AlertCircle className="w-3.5 h-3.5" />
            Fallback Message
          </label>
          <input
            type="text"
            value={fallbackMessage}
            onChange={(e) => {
              setFallbackMessage(e.target.value);
              if (!isEditing) setIsEditing(true);
            }}
            placeholder="I'm sorry, I couldn't understand that. Let me connect you with a human agent."
            className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none text-sm"
          />
          <p className="text-xs text-zinc-600 mt-1">
            Sent when the bot cannot generate a suitable response.
          </p>
        </div>

        {/* Goals Section */}
        <GoalsSection />

        {/* Knowledge Base Section */}
        <KnowledgeBaseSection />

        {/* Save button */}
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end"
          >
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export function BotConfigPage() {
  const instances = useQuery(api.instances.list);

  if (instances === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
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
          <div className="p-2 bg-violet-500/10 rounded-xl">
            <Bot className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Bot Configuration</h1>
            <p className="text-sm text-zinc-500">
              Configure AI auto-reply bots for your WhatsApp instances.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Info banner */}
      <motion.div
        variants={staggerItemVariants}
        className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4 flex items-start gap-3"
      >
        <Bot className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-zinc-400">
          <p>
            When a bot is enabled on an instance, incoming messages are automatically replied to using AI.
            Conversations in <span className="text-zinc-200 font-medium">bot</span> mode get auto-replies;
            switch to <span className="text-zinc-200 font-medium">human</span> mode in the inbox to take over manually.
          </p>
        </div>
      </motion.div>

      {/* Instance bot cards */}
      {instances.length === 0 ? (
        <motion.div
          variants={staggerItemVariants}
          className="bg-zinc-900 rounded-xl border border-zinc-800 p-12 text-center"
        >
          <div className="w-16 h-16 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-violet-500" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-100 mb-2">No instances yet</h2>
          <p className="text-zinc-400 mb-2">
            Create a WhatsApp instance first to configure a bot.
          </p>
          <a
            href="/whatsapp"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors"
          >
            Go to WhatsApp Instances
          </a>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {instances.map((instance) => (
            <BotSettingsCard key={instance._id} instance={instance} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
