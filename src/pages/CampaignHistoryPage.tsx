import { useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "@convex/_generated/api";
import { Megaphone, Plus, Clock, Loader2 } from "lucide-react";

const statusStyles: Record<string, string> = {
  draft: "bg-zinc-700 text-zinc-300",
  running: "bg-emerald-500/10 text-emerald-400",
  paused: "bg-amber-500/10 text-amber-400",
  completed: "bg-blue-500/10 text-blue-400",
  stopped: "bg-red-500/10 text-red-400",
};

export function CampaignHistoryPage() {
  const navigate = useNavigate();
  const campaigns = useQuery(api.campaigns.listByUser);

  if (campaigns === undefined) {
    return (
      <div role="status" className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Megaphone className="w-7 h-7 text-emerald-500" />
          <h1 className="text-2xl font-bold text-zinc-100">Campaigns</h1>
        </div>
        <button
          onClick={() => navigate("/campaigns/new")}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Campaign list */}
      {campaigns.length === 0 ? (
        <div className="text-center py-20">
          <Megaphone className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-zinc-300 mb-2">
            No campaigns yet
          </h2>
          <p className="text-zinc-500 mb-6">
            Create your first campaign to start sending messages.
          </p>
          <button
            onClick={() => navigate("/campaigns/new")}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {campaigns.map((campaign) => (
            <button
              key={campaign._id}
              onClick={() => navigate(`/campaigns/${campaign._id}`)}
              className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 hover:border-zinc-700 cursor-pointer transition-colors text-left w-full"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-zinc-100">
                  {campaign.name}
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[campaign.status] ?? statusStyles.draft}`}
                >
                  {campaign.status.charAt(0).toUpperCase() +
                    campaign.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span>
                  {campaign.sent} sent / {campaign.failed} failed of{" "}
                  {campaign.total} total
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(campaign._creationTime).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
