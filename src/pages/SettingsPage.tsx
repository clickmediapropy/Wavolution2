import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Settings,
  User,
  Webhook,
  Key,
  ArrowRight,
  Bot,
  MessageSquareText,
  BookOpen,
  Target,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
import { staggerContainerVariants, staggerItemVariants } from "@/lib/transitions";
import { toast } from "sonner";

function MaskedValue({ value, label }: { value: string; label: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const masked = value.slice(0, 8) + "..." + value.slice(-4);

  const handleCopy = () => {
    void navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <code className="text-sm text-zinc-300 bg-zinc-800/50 px-3 py-1.5 rounded-lg font-mono">
        {revealed ? value : masked}
      </code>
      <button
        onClick={() => setRevealed(!revealed)}
        className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
        title={revealed ? "Hide" : "Reveal"}
      >
        {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
      <button
        onClick={handleCopy}
        className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
        title="Copy"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

const quickLinks = [
  {
    to: "/bots",
    label: "Bots",
    description: "Configure AI auto-reply bots for your instances",
    icon: Bot,
    color: "emerald",
  },
  {
    to: "/quick-replies",
    label: "Quick Replies",
    description: "Manage saved message templates for fast responses",
    icon: MessageSquareText,
    color: "blue",
  },
  {
    to: "/knowledge-base",
    label: "Knowledge Base",
    description: "Upload documents to train your AI bots",
    icon: BookOpen,
    color: "violet",
  },
  {
    to: "/bot-goals",
    label: "Bot Goals",
    description: "Define objectives and conversation flows for bots",
    icon: Target,
    color: "amber",
  },
] as const;

const colorMap: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-400",
  blue: "bg-blue-500/10 text-blue-400",
  violet: "bg-violet-500/10 text-violet-400",
  amber: "bg-amber-500/10 text-amber-400",
};

export function SettingsPage() {
  const user = useQuery(api.users.currentUser);
  const instances = useQuery(api.instances.list);

  const connectedInstance = instances?.find((i) => i.connectionStatus === "open");
  const evolutionApiUrl = "wavolution.agentifycrm.io";
  const webhookUrl = connectedInstance
    ? `${window.location.origin.replace("http://", "https://").replace(/:\d+$/, "")}/webhooks/evolution`
    : null;

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={staggerItemVariants} className="flex items-center gap-3">
        <div className="p-2 bg-zinc-800 rounded-xl">
          <Settings className="w-6 h-6 text-zinc-400" />
        </div>
        <div>
          <h1 className="text-h2 text-zinc-100">Settings</h1>
          <p className="text-small text-zinc-500">Manage your account and integrations</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Section */}
        <motion.div
          variants={staggerItemVariants}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">Profile</h2>
          </div>

          {user === undefined ? (
            <div className="space-y-4">
              <div className="h-5 bg-zinc-800 rounded animate-pulse w-48" />
              <div className="h-5 bg-zinc-800 rounded animate-pulse w-64" />
            </div>
          ) : user === null ? (
            <p className="text-sm text-zinc-500">Unable to load profile</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Name
                </label>
                <p className="text-sm text-zinc-200 mt-1">{user.name || "Not set"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Email
                </label>
                <p className="text-sm text-zinc-200 mt-1">{user.email || "Not set"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  WhatsApp Number
                </label>
                <p className="text-sm text-zinc-200 mt-1">
                  {connectedInstance?.whatsappNumber || user.whatsappNumber || "Not connected"}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Connection Status
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className={`w-2 h-2 rounded-full ${connectedInstance ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
                  />
                  <span className="text-sm text-zinc-200">
                    {connectedInstance ? "Connected" : "Disconnected"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Webhook Status Section */}
        <motion.div
          variants={staggerItemVariants}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-violet-500/10 rounded-lg">
              <Webhook className="w-5 h-5 text-violet-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">Webhook Status</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Webhook Endpoint
              </label>
              {webhookUrl ? (
                <div className="mt-1">
                  <code className="text-sm text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg font-mono block break-all">
                    {webhookUrl}
                  </code>
                </div>
              ) : (
                <p className="text-sm text-zinc-500 mt-1">
                  No active webhook — connect a WhatsApp instance first
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Events Subscribed
              </label>
              {connectedInstance ? (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["MESSAGES_UPDATE", "MESSAGES_UPSERT", "CONNECTION_UPDATE", "SEND_MESSAGE"].map(
                    (event) => (
                      <span
                        key={event}
                        className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md font-mono"
                      >
                        {event}
                      </span>
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 mt-1">No events registered</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Active Instance
              </label>
              <p className="text-sm text-zinc-200 mt-1">
                {connectedInstance?.name || "None"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* API Keys Section */}
        <motion.div
          variants={staggerItemVariants}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Key className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">API Configuration</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Evolution API URL
              </label>
              <p className="text-sm text-zinc-300 mt-1 font-mono bg-zinc-800/50 px-3 py-1.5 rounded-lg">
                {evolutionApiUrl}
              </p>
            </div>

            {connectedInstance?.apiKey && (
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Instance API Key
                </label>
                <div className="mt-1">
                  <MaskedValue value={connectedInstance.apiKey} label="API Key" />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Convex Backend
              </label>
              <p className="text-sm text-zinc-300 mt-1 font-mono bg-zinc-800/50 px-3 py-1.5 rounded-lg">
                wandering-blackbird-22.convex.cloud
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick Links Section */}
        <motion.div
          variants={staggerItemVariants}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <ArrowRight className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">Quick Links</h2>
          </div>

          <div className="space-y-2">
            {quickLinks.map(({ to, label, description, icon: Icon, color }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-800/30 hover:bg-zinc-800/60 transition-all group"
              >
                <div className={`p-2 rounded-lg ${colorMap[color]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 group-hover:text-zinc-100">
                    {label}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">{description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
