import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { BarChart3, Loader2, Megaphone, MessageSquare, TrendingUp, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { staggerContainerVariants, staggerItemVariants } from "@/lib/transitions";
import { CAMPAIGN_STATUS_STYLES } from "@/lib/types";

const PIE_COLORS = ["#10b981", "#ef4444", "#6b7280"];

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDeliveryRateColor(rate: number): string {
  if (rate >= 90) return "text-emerald-400";
  if (rate >= 70) return "text-amber-400";
  return "text-red-400";
}

export function CampaignAnalyticsPage() {
  const campaigns = useQuery(api.campaigns.listByUser);
  const dashboardStats = useQuery(api.messages.dashboardStats);

  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return [];
    let list = [...campaigns];

    if (rangeStart) {
      const start = new Date(rangeStart).getTime();
      list = list.filter((c) => (c.startedAt ?? c._creationTime) >= start);
    }
    if (rangeEnd) {
      const end = new Date(rangeEnd).setHours(23, 59, 59, 999);
      list = list.filter((c) => (c.startedAt ?? c._creationTime) <= end);
    }

    return list;
  }, [campaigns, rangeStart, rangeEnd]);

  const totalCampaigns = filteredCampaigns.length;
  const totalSent = filteredCampaigns.reduce((sum, c) => sum + c.sent, 0);
  const totalFailed = filteredCampaigns.reduce((sum, c) => sum + c.failed, 0);
  const totalProcessed = totalSent + totalFailed;
  const overallDeliveryRate =
    totalProcessed > 0 ? Math.round((totalSent / totalProcessed) * 1000) / 10 : 0;

  const totalPending = filteredCampaigns.reduce(
    (sum, c) => sum + Math.max(0, c.total - c.processed),
    0,
  );
  const pieData = [
    { name: "Sent", value: totalSent },
    { name: "Failed", value: totalFailed },
    { name: "Pending", value: totalPending },
  ].filter((d) => d.value > 0);

  if (campaigns === undefined || dashboardStats === undefined) {
    return (
      <div role="status" className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6 max-w-5xl mx-auto"
    >
      <motion.div variants={staggerItemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl">
            <BarChart3 className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Campaign Analytics</h1>
            <p className="text-sm text-zinc-500">
              Performance overview across all campaigns.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={staggerItemVariants}
        className="flex flex-wrap items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl"
      >
        <CalendarDays className="w-4 h-4 text-zinc-400" />
        <span className="text-sm text-zinc-400">Date range:</span>
        <input
          type="date"
          value={rangeStart}
          onChange={(e) => setRangeStart(e.target.value)}
          className="px-3 py-1.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <span className="text-zinc-500">to</span>
        <input
          type="date"
          value={rangeEnd}
          onChange={(e) => setRangeEnd(e.target.value)}
          className="px-3 py-1.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        {(rangeStart || rangeEnd) && (
          <button
            onClick={() => {
              setRangeStart("");
              setRangeEnd("");
            }}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 border border-zinc-700 rounded-lg transition-colors"
          >
            Clear
          </button>
        )}
      </motion.div>

      <motion.div variants={staggerItemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Megaphone className="w-5 h-5 text-emerald-500" />}
          label="Total Campaigns"
          value={totalCampaigns}
        />
        <SummaryCard
          icon={<MessageSquare className="w-5 h-5 text-blue-400" />}
          label="Messages Sent"
          value={dashboardStats.totalSent}
          subtitle={`${totalSent} from filtered campaigns`}
        />
        <SummaryCard
          icon={<TrendingUp className="w-5 h-5 text-amber-400" />}
          label="Delivery Rate"
          value={`${overallDeliveryRate}%`}
        />
        <SummaryCard
          icon={<BarChart3 className="w-5 h-5 text-red-400" />}
          label="Total Failed"
          value={totalFailed}
        />
      </motion.div>

      <motion.div variants={staggerItemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
          <h2 className="text-sm font-medium text-zinc-400 mb-4">Delivery Breakdown</h2>
          {pieData.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-10">No message data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                    color: "#e4e4e7",
                    fontSize: "13px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex justify-center gap-6 mt-2">
            {PIE_LEGEND.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs text-zinc-400">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
          <h2 className="text-sm font-medium text-zinc-400 mb-4">Global Message Stats</h2>
          <div className="space-y-4">
            <StatRow label="Total Sent" value={dashboardStats.totalSent} />
            <StatRow label="Total Delivered" value={dashboardStats.totalDelivered} />
            <StatRow label="Total Read" value={dashboardStats.totalRead} />
            <StatRow label="Total Failed" value={dashboardStats.totalFailed} />
            <StatRow label="Total Incoming" value={dashboardStats.totalIncoming} />
            <StatRow label="Delivery Rate" value={`${dashboardStats.deliveryRate}%`} />
            <StatRow label="Open Rate" value={`${dashboardStats.openRate}%`} />
            <StatRow label="Failure Rate" value={`${dashboardStats.failureRate}%`} />
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={staggerItemVariants}
        className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-400">Per-Campaign Breakdown</h2>
        </div>
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No campaigns match the selected date range.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Sent</th>
                  <th className="px-6 py-3 font-medium text-right">Failed</th>
                  <th className="px-6 py-3 font-medium text-right">Delivery Rate</th>
                  <th className="px-6 py-3 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredCampaigns.map((campaign) => {
                  const processed = campaign.sent + campaign.failed;
                  const rate =
                    processed > 0
                      ? Math.round((campaign.sent / processed) * 1000) / 10
                      : 0;

                  return (
                    <tr
                      key={campaign._id}
                      className="hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-6 py-3 text-zinc-200 font-medium truncate max-w-[200px]">
                        {campaign.name}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full capitalize ${
                            CAMPAIGN_STATUS_STYLES[campaign.status] ?? "bg-zinc-700 text-zinc-300"
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-zinc-300 tabular-nums">
                        {campaign.sent}
                      </td>
                      <td className="px-6 py-3 text-right text-zinc-300 tabular-nums">
                        {campaign.failed}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums">
                        <span className={getDeliveryRateColor(rate)}>
                          {processed > 0 ? `${rate}%` : "--"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-zinc-500 text-xs">
                        {formatDate(campaign.startedAt ?? campaign._creationTime)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

const PIE_LEGEND = [
  { label: "Sent", color: "#10b981" },
  { label: "Failed", color: "#ef4444" },
  { label: "Pending", color: "#6b7280" },
];

function SummaryCard({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
}): React.ReactElement {
  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-zinc-100 tabular-nums">{value}</p>
      {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }): React.ReactElement {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className="text-sm font-medium text-zinc-200 tabular-nums">{value}</span>
    </div>
  );
}
