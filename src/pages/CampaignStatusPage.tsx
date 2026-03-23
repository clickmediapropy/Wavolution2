import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Loader2,
  Megaphone,
  ArrowLeft,
  Square,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-zinc-700 text-zinc-300",
    running: "bg-emerald-500/10 text-emerald-400",
    completed: "bg-blue-500/10 text-blue-400",
    stopped: "bg-red-500/10 text-red-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${styles[status] ?? styles.draft}`}
    >
      {status === "running" && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function CampaignStatusPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const campaign = useQuery(
    api.campaigns.getStatus,
    id ? { id: id as Id<"campaigns"> } : "skip",
  );
  const stopCampaign = useMutation(api.campaigns.stop);

  const handleStop = async () => {
    if (!id) return;
    try {
      await stopCampaign({ id: id as Id<"campaigns"> });
      toast.success("Campaign stopped");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to stop campaign",
      );
    }
  };

  if (campaign === undefined) {
    return (
      <div role="status" className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (campaign === null) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-zinc-100 mb-2">
          Campaign Not Found
        </h2>
        <p className="text-zinc-400 mb-6">
          This campaign doesn&apos;t exist or you don&apos;t have access.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go to Dashboard
        </button>
      </div>
    );
  }

  const remaining = campaign.total - campaign.sent - campaign.failed;
  const progressPct =
    campaign.total > 0
      ? Math.round(((campaign.sent + campaign.failed) / campaign.total) * 100)
      : 0;

  const startedDate = campaign.startedAt
    ? new Date(campaign.startedAt).toLocaleString()
    : "—";
  const completedDate = campaign.completedAt
    ? new Date(campaign.completedAt).toLocaleString()
    : "—";

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Megaphone className="w-7 h-7 text-emerald-500" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">
              {campaign.name}
            </h1>
            <StatusBadge status={campaign.status} />
          </div>
        </div>

        {campaign.status === "running" && (
          <button
            onClick={handleStop}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <Square className="w-4 h-4" />
            Stop Campaign
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-300">Progress</span>
          <span className="text-sm font-mono text-zinc-400">
            {progressPct}%
          </span>
        </div>
        <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              campaign.status === "stopped"
                ? "bg-red-500"
                : campaign.status === "completed"
                  ? "bg-blue-500"
                  : "bg-emerald-500"
            }`}
            style={{ width: `${progressPct}%` }}
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Campaign progress"
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Send className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-zinc-500">Sent</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">
            {campaign.sent}
          </p>
        </div>

        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-zinc-500">Failed</span>
          </div>
          <p className="text-2xl font-bold text-red-400 font-mono">
            {campaign.failed}
          </p>
        </div>

        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-zinc-500">Remaining</span>
          </div>
          <p className="text-2xl font-bold text-amber-400 font-mono">
            {remaining}
          </p>
        </div>

        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-zinc-500">Total</span>
          </div>
          <p className="text-2xl font-bold text-blue-400 font-mono">
            {campaign.total}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <h3 className="text-sm font-medium text-zinc-300 mb-4">Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-zinc-500">Recipients</p>
            <p className="text-zinc-200">
              {campaign.recipientType.charAt(0).toUpperCase() +
                campaign.recipientType.slice(1)}
            </p>
          </div>
          <div>
            <p className="text-zinc-500">Delay</p>
            <p className="text-zinc-200">{campaign.delay / 1000}s</p>
          </div>
          <div>
            <p className="text-zinc-500">Started</p>
            <p className="text-zinc-200">{startedDate}</p>
          </div>
          <div>
            <p className="text-zinc-500">Completed</p>
            <p className="text-zinc-200">{completedDate}</p>
          </div>
          <div className="col-span-2">
            <p className="text-zinc-500">Message Template</p>
            <p className="text-zinc-200 whitespace-pre-wrap font-mono text-xs mt-1 bg-zinc-800 rounded-lg p-3">
              {campaign.messageTemplate}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
