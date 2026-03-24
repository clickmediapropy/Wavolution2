import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { LayoutDashboard, Users, DollarSign, Tag, Megaphone, Zap, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { StatsCard } from "@/components/StatsCard";
import { RecentMessages } from "@/components/RecentMessages";
import { QuickActions } from "@/components/QuickActions";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { staggerContainerVariants, staggerItemVariants } from "@/lib/transitions";

const EMPTY_SPARKLINE: number[] = [0, 0, 0, 0, 0, 0, 0];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatResponseTime(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours}h`;
  return `${hours}h ${remaining}m`;
}

export function DashboardPage(): React.ReactElement {
  const contactCount = useQuery(api.contacts.count);
  const contactsThisWeek = useQuery(api.contacts.countThisWeek);
  const campaigns = useQuery(api.campaigns.listByUser);
  const instanceCounts = useQuery(api.instances.count);
  const offerStats = useQuery(api.offers.stats);
  const verticals = useQuery(api.verticals.list);

  const dashboardStats = useQuery(api.messages.dashboardStats);
  const messageDailyCounts = useQuery(api.messages.dailyCounts);
  const contactDailyCounts = useQuery(api.messages.contactDailyCounts);

  const campaignCount = campaigns?.length ?? 0;
  const connected = (instanceCounts?.connected ?? 0) > 0;

  const contactSparkline = contactDailyCounts ?? EMPTY_SPARKLINE;
  const messageSparkline = messageDailyCounts ?? EMPTY_SPARKLINE;

  const hasNewContacts = contactsThisWeek !== undefined && contactCount !== undefined && contactsThisWeek > 0;
  const contactTrend = hasNewContacts ? "up" as const : "neutral" as const;
  const contactTrendValue = contactsThisWeek !== undefined
    ? `+${contactsThisWeek} this week`
    : undefined;

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
            <p className="text-small text-zinc-500">Your affiliate performance at a glance.</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full">
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
          <span className="text-xs text-zinc-400">{connected ? "All systems operational" : "WhatsApp disconnected"}</span>
        </div>
      </motion.div>

      {/* Onboarding progress (hidden once all steps complete) */}
      <OnboardingProgress />

      {/* Stats grid */}
      <motion.div
        variants={staggerItemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatsCard
          icon={<Users className="w-5 h-5 text-blue-400" />}
          iconBg="bg-blue-500/10"
          label="Total Leads"
          value={contactCount ?? "..."}
          subtitle={contactsThisWeek !== undefined ? `+${contactsThisWeek} this week` : undefined}
          subtitleColor="text-blue-400/70"
          trend={contactTrend}
          trendValue={contactTrendValue}
          sparklineData={contactSparkline}
          sparklineColor="blue"
        />

        <StatsCard
          icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
          iconBg="bg-emerald-500/10"
          label="Total Revenue"
          value={offerStats ? currencyFormatter.format(offerStats.totalRevenue) : "..."}
          subtitle={offerStats ? `${offerStats.totalConversions} conversions` : undefined}
          subtitleColor="text-emerald-400/70"
          trend={offerStats && offerStats.totalRevenue > 0 ? "up" : "neutral"}
          sparklineData={messageSparkline}
          sparklineColor="emerald"
        />

        <StatsCard
          icon={<Tag className="w-5 h-5 text-violet-400" />}
          iconBg="bg-violet-500/10"
          label="Active Offers"
          value={offerStats?.activeOffers ?? "..."}
          subtitle={offerStats ? `${offerStats.totalOffers} total` : undefined}
          subtitleColor="text-violet-400/70"
          trend={offerStats && offerStats.activeOffers > 0 ? "up" : "neutral"}
        />

        <StatsCard
          icon={<Megaphone className="w-5 h-5 text-amber-400" />}
          iconBg="bg-amber-500/10"
          label="Campaigns Sent"
          value={campaignCount}
          subtitle={campaignCount > 0 ? `${campaignCount} total` : "No campaigns yet"}
          subtitleColor="text-amber-400/70"
          trend={campaignCount > 0 ? "up" : "neutral"}
        />
      </motion.div>

      {/* Leads by Vertical */}
      {verticals && verticals.length > 0 && (
        <motion.div
          variants={staggerItemVariants}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-violet-500/10 rounded-lg">
              <Layers className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-h3 text-zinc-100">Leads by Vertical</h3>
              <p className="text-small text-zinc-500">Distribution of leads across your verticals</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {verticals.map((v) => (
              <div
                key={v._id}
                className="flex items-center gap-3 p-4 bg-zinc-800/30 rounded-xl"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: v.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">{v.name}</p>
                  <p className="text-xs text-zinc-500">{v.leadCount ?? 0} leads</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

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

      {/* Performance metrics — real data */}
      <motion.div
        variants={staggerItemVariants}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-h3 text-zinc-100">Recent Offer Blasts</h3>
            <p className="text-small text-zinc-500">Performance overview based on your message history</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Delivery Rate",
              value: dashboardStats ? `${dashboardStats.deliveryRate}%` : "—",
              subtitle: dashboardStats
                ? `${dashboardStats.totalDelivered} of ${dashboardStats.totalSent}`
                : undefined,
            },
            {
              label: "Open Rate",
              value: dashboardStats ? `${dashboardStats.openRate}%` : "—",
              subtitle: dashboardStats
                ? `${dashboardStats.totalRead} read`
                : undefined,
            },
            {
              label: "Avg. Response",
              value: dashboardStats
                ? formatResponseTime(dashboardStats.avgResponseMinutes)
                : "—",
              subtitle: dashboardStats
                ? `${dashboardStats.totalIncoming} replies`
                : undefined,
            },
            {
              label: "Failure Rate",
              value: dashboardStats ? `${dashboardStats.failureRate}%` : "—",
              subtitle: dashboardStats
                ? `${dashboardStats.totalFailed} failed`
                : undefined,
            },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4 bg-zinc-800/30 rounded-xl">
              <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-zinc-100">{stat.value}</p>
              {stat.subtitle && (
                <p className="text-xs mt-1 text-zinc-500">
                  {stat.subtitle}
                </p>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
