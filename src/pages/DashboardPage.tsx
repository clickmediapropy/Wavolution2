import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { LayoutDashboard, Users, MessageSquare, Megaphone } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { RecentMessages } from "@/components/RecentMessages";
import { QuickActions } from "@/components/QuickActions";

export function DashboardPage() {
  const contactCount = useQuery(api.contacts.count);
  const messageCount = useQuery(api.messages.count);
  const campaigns = useQuery(api.campaigns.listByUser);
  const instanceCounts = useQuery(api.instances.count);

  const campaignCount = campaigns?.length ?? 0;
  const connected = (instanceCounts?.connected ?? 0) > 0;

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <LayoutDashboard className="w-7 h-7 text-emerald-500" />
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ConnectionStatus connected={connected} href="/whatsapp" />

        <StatsCard
          icon={<Users className="w-5 h-5 text-blue-400" />}
          iconBg="bg-blue-500/10"
          label="Total Contacts"
          value={contactCount ?? "..."}
        />

        <StatsCard
          icon={<MessageSquare className="w-5 h-5 text-violet-400" />}
          iconBg="bg-violet-500/10"
          label="Messages Sent"
          value={messageCount ?? "..."}
        />

        <StatsCard
          icon={<Megaphone className="w-5 h-5 text-amber-400" />}
          iconBg="bg-amber-500/10"
          label="Campaigns"
          value={campaignCount}
        />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentMessages />
        <QuickActions />
      </div>
    </div>
  );
}
