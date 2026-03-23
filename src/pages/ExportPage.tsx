import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Download, FileSpreadsheet, MessageSquare, Megaphone } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { staggerContainerVariants, staggerItemVariants } from "@/lib/transitions";
import type { Id } from "@convex/_generated/dataModel";

function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

interface ExportSectionProps {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  count: number | undefined;
  onExport: () => void;
  disabled: boolean;
}

function ExportSection({
  icon: Icon,
  iconColor,
  title,
  description,
  count,
  onExport,
  disabled,
}: ExportSectionProps) {
  return (
    <motion.div
      variants={staggerItemVariants}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className={`p-2.5 rounded-xl ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
            <p className="text-sm text-zinc-400 mt-1">{description}</p>
            {count !== undefined && (
              <p className="text-xs text-zinc-500 mt-2">
                {count.toLocaleString()} record{count !== 1 ? "s" : ""} available
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onExport}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Download className="w-4 h-4" />
          Download CSV
        </button>
      </div>
    </motion.div>
  );
}

export function ExportPage() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<Id<"campaigns"> | "">("");

  const contactsData = useQuery(api.exports.exportContacts);
  const messagesData = useQuery(api.exports.exportMessages);
  const campaigns = useQuery(api.campaigns.listByUser);
  const campaignData = useQuery(
    api.exports.exportCampaignMessages,
    selectedCampaignId ? { campaignId: selectedCampaignId as Id<"campaigns"> } : "skip",
  );

  function handleExportContacts(): void {
    if (!contactsData) return;
    try {
      downloadCsv(contactsData.csv, `contacts-${todayStamp()}.csv`);
      toast.success(`Exported ${contactsData.count} contacts`);
    } catch {
      toast.error("Failed to export contacts");
    }
  }

  function handleExportMessages(): void {
    if (!messagesData) return;
    try {
      downloadCsv(messagesData.csv, `messages-${todayStamp()}.csv`);
      toast.success(`Exported ${messagesData.count} messages`);
    } catch {
      toast.error("Failed to export messages");
    }
  }

  function handleExportCampaign(): void {
    if (!campaignData) return;
    try {
      const safeName = (campaignData.campaignName ?? "campaign")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .toLowerCase();
      downloadCsv(campaignData.csv, `campaign-${safeName}-${todayStamp()}.csv`);
      toast.success(`Exported ${campaignData.count} messages from "${campaignData.campaignName}"`);
    } catch {
      toast.error("Failed to export campaign results");
    }
  }

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={staggerItemVariants} className="flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 rounded-xl">
          <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Export Data</h1>
          <p className="text-sm text-zinc-500">
            Download your contacts, messages, and campaign results as CSV files.
          </p>
        </div>
      </motion.div>

      <ExportSection
        icon={FileSpreadsheet}
        iconColor="bg-blue-500/10 text-blue-400"
        title="Export Contacts"
        description="Phone, name, tags, status, and engagement score for all contacts."
        count={contactsData?.count}
        onExport={handleExportContacts}
        disabled={!contactsData || contactsData.count === 0}
      />

      <ExportSection
        icon={MessageSquare}
        iconColor="bg-purple-500/10 text-purple-400"
        title="Export Messages"
        description="Phone, message text, status, direction, and timestamp for all messages."
        count={messagesData?.count}
        onExport={handleExportMessages}
        disabled={!messagesData || messagesData.count === 0}
      />

      <motion.div
        variants={staggerItemVariants}
        className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Megaphone className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-zinc-100">Export Campaign Results</h3>
            <p className="text-sm text-zinc-400 mt-1">
              Select a campaign to download its message results as CSV.
            </p>
          </div>
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="campaign-select" className="block text-xs font-medium text-zinc-400 mb-1.5">
              Campaign
            </label>
            <select
              id="campaign-select"
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value as Id<"campaigns"> | "")}
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none appearance-none"
            >
              <option value="">Select a campaign...</option>
              {(campaigns ?? []).map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} — {c.status} ({c.sent}/{c.total} sent)
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExportCampaign}
            disabled={!selectedCampaignId || !campaignData || campaignData.count === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>
        </div>

        {selectedCampaignId && campaignData && (
          <p className="text-xs text-zinc-500 mt-3">
            {campaignData.count.toLocaleString()} message{campaignData.count !== 1 ? "s" : ""} in this campaign
          </p>
        )}

        {!campaigns || campaigns.length === 0 ? (
          <p className="text-xs text-zinc-500 mt-3">No campaigns found.</p>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
