import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { LayoutDashboard, Users, MessageSquare, Megaphone, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { StatsCard } from "@/components/StatsCard";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { RecentMessages } from "@/components/RecentMessages";
import { QuickActions } from "@/components/QuickActions";
import { staggerContainerVariants, staggerItemVariants } from "@/lib/transitions";

// Generate mock sparkline data
function generateSparklineData(baseValue: number, variance: number = 20): number[] {
  return Array.from({ length: 7 }, () => {
    const dayValue = baseValue + Math.random() * variance - variance / 2;
    return Math.max(0, Math.round(dayValue));
  });
}

export function DashboardPage() {
  const contactCount = useQuery(api.contacts.count);
  const contactsThisWeek = useQuery(api.contacts.countThisWeek);
  const messageCount = useQuery(api.messages.count);
  const messagesToday = useQuery(api.messages.countToday);
  const campaigns = useQuery(api.campaigns.listByUser);
  const instanceCounts = useQuery(api.instances.count);

  const campaignCount = campaigns?.length ?? 0;
  const activeCampaigns = campaigns?.filter(c => c.status === "running" || c.status === "paused").length ?? 0;
  const connected = (instanceCounts?.connected ?? 0) > 0;

  // Mock sparkline data (in production, this would come from the API)
  const contactSparkline = generateSparklineData(contactCount ? contactCount / 7 : 10);
  const messageSparkline = generateSparklineData(messageCount ? messageCount / 7 : 50);
  const campaignSparkline = generateSparklineData(campaignCount ? campaignCount / 7 : 2);

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
            <LayoutDashboard className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-h2 text-zinc-100">Dashboard</h1>
            <p className="text-small text-zinc-500">Welcome back! Here&apos;s what&apos;s happening today.</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full">
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
          <span className="text-xs text-zinc-400">{connected ? "All systems operational" : "WhatsApp disconnected"}</span>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div 
        variants={staggerItemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <ConnectionStatus 
          connected={connected} 
          href="/whatsapp"
          sparklineData={connected ? [1, 1, 1, 0.8, 1, 1, 1] : [0.3, 0.2, 0.1, 0.2, 0.1, 0.2, 0.3]}
        />

        <StatsCard
          icon={<Users className="w-5 h-5 text-blue-400" />}
          iconBg="bg-blue-500/10"
          label="Total Contacts"
          value={contactCount ?? "..."}
          subtitle={contactsThisWeek !== undefined ? `+${contactsThisWeek} this week` : undefined}
          subtitleColor="text-blue-400/70"
          trend="up"
          trendValue="12%"
          sparklineData={contactSparkline}
          sparklineColor="blue"
        />

        <StatsCard
          icon={<MessageSquare className="w-5 h-5 text-violet-400" />}
          iconBg="bg-violet-500/10"
          label="Messages Sent"
          value={messageCount ?? "..."}
          subtitle={messagesToday !== undefined ? `+${messagesToday} today` : undefined}
          subtitleColor="text-violet-400/70"
          trend="up"
          trendValue="8%"
          sparklineData={messageSparkline}
          sparklineColor="violet"
        />

        <StatsCard
          icon={<Megaphone className="w-5 h-5 text-amber-400" />}
          iconBg="bg-amber-500/10"
          label="Active Campaigns"
          value={activeCampaigns}
          subtitle={campaignCount > 0 ? `${campaignCount} total` : "No campaigns yet"}
          subtitleColor="text-amber-400/70"
          trend={activeCampaigns > 0 ? "up" : "neutral"}
          trendValue={activeCampaigns > 0 ? `${activeCampaigns} running` : undefined}
          sparklineData={campaignSparkline}
          sparklineColor="amber"
        />
      </motion.div>

      {/* Bottom row */}
      <motion.div 
        variants={staggerItemVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2">
          <RecentMessages />
        </div>
        <div>
          <QuickActions />
        </div>
      </motion.div>

      {/* Performance metrics (optional enhancement) */}
      <motion.div 
        variants={staggerItemVariants}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-h3 text-zinc-100">Quick Stats</h3>
            <p className="text-small text-zinc-500">Performance overview for the last 7 days</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Delivery Rate", value: "98.5%", change: "+2.1%", positive: true },
            { label: "Avg. Response", value: "2.3h", change: "-15m", positive: true },
            { label: "Open Rate", value: "87.2%", change: "+5.4%", positive: true },
            { label: "Bounce Rate", value: "1.2%", change: "-0.3%", positive: true },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4 bg-zinc-800/30 rounded-xl">
              <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-zinc-100">{stat.value}</p>
              <p className={`text-xs mt-1 ${stat.positive ? "text-emerald-400" : "text-red-400"}`}>
                {stat.change}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
