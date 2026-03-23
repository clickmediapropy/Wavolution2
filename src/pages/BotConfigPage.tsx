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
} from "lucide-react";
import { toast } from "sonner";
import { staggerContainerVariants, staggerItemVariants } from "@/lib/transitions";
import type { Doc } from "@convex/_generated/dataModel";

function BotSettingsCard({ instance }: { instance: Doc<"instances"> }) {
  const updateBotSettings = useMutation(api.instances.updateBotSettings);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(instance.botSystemPrompt ?? "");
  const [temperature, setTemperature] = useState(0.7);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [fallbackMessage, setFallbackMessage] = useState("");

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

        {/* Goals Section (placeholder — backend pending) */}
        <div className="border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-medium text-zinc-300">Goals</h4>
            <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded-full">Coming soon</span>
          </div>
          <div className="space-y-2">
            {[
              { label: "Human Handover", desc: "Transfer to agent when confidence is low" },
              { label: "Auto Follow-up", desc: "Send follow-up if no reply after delay" },
              { label: "Manage Tags", desc: "Auto-tag contacts based on conversation" },
              { label: "Update Lead Score", desc: "Adjust engagement score from interactions" },
              { label: "Send Notification", desc: "Alert team on key events" },
            ].map((goal) => (
              <div
                key={goal.label}
                className="flex items-center justify-between py-2 px-3 bg-zinc-800/50 rounded-lg opacity-60 cursor-not-allowed"
              >
                <div>
                  <p className="text-xs font-medium text-zinc-300">{goal.label}</p>
                  <p className="text-[11px] text-zinc-500">{goal.desc}</p>
                </div>
                <ToggleLeft className="w-6 h-6 text-zinc-700" />
              </div>
            ))}
          </div>
        </div>

        {/* Knowledge Base Section (placeholder — backend pending) */}
        <div className="border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-medium text-zinc-300">Knowledge Base</h4>
            <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded-full">Coming soon</span>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-6 text-center opacity-60">
            <BookOpen className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">
              Upload documents and text content to give your bot domain knowledge.
            </p>
            <button
              disabled
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-500 bg-zinc-800 border border-zinc-700 rounded-lg cursor-not-allowed"
            >
              Upload Content
            </button>
          </div>
        </div>

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
