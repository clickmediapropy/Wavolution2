import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Users,
  MessageCircleReply,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Tag,
  PhoneOff,
} from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainerVariants, staggerItemVariants } from "@/lib/transitions";

type SegmentCounts = { total: number; replied: number; engaged: number; pending: number; sent: number; failed: number; tagged: number; noWhatsApp: number };
type SegmentCountKey = keyof SegmentCounts;

interface Segment {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  borderColor: string;
  countKey: SegmentCountKey;
  filter: string;
}

const segments: Segment[] = [
  {
    key: "all",
    label: "All Contacts",
    description: "Every contact in your database",
    icon: <Users className="w-5 h-5 text-zinc-300" />,
    iconBg: "bg-zinc-500/10",
    borderColor: "border-zinc-700",
    countKey: "total",
    filter: "all",
  },
  {
    key: "replied",
    label: "Replied",
    description: "Contacts who have replied at least once",
    icon: <MessageCircleReply className="w-5 h-5 text-emerald-400" />,
    iconBg: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    countKey: "replied",
    filter: "replied",
  },
  {
    key: "engaged",
    label: "Engaged",
    description: "Engagement score above 50",
    icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
    iconBg: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    countKey: "engaged",
    filter: "engaged",
  },
  {
    key: "pending",
    label: "Pending",
    description: "Awaiting first message delivery",
    icon: <Clock className="w-5 h-5 text-amber-400" />,
    iconBg: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    countKey: "pending",
    filter: "pending",
  },
  {
    key: "sent",
    label: "Sent",
    description: "Message successfully delivered",
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    iconBg: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    countKey: "sent",
    filter: "sent",
  },
  {
    key: "failed",
    label: "Failed",
    description: "Message delivery failed",
    icon: <XCircle className="w-5 h-5 text-red-400" />,
    iconBg: "bg-red-500/10",
    borderColor: "border-red-500/30",
    countKey: "failed",
    filter: "failed",
  },
  {
    key: "tagged",
    label: "Tagged",
    description: "Contacts with one or more tags",
    icon: <Tag className="w-5 h-5 text-violet-400" />,
    iconBg: "bg-violet-500/10",
    borderColor: "border-violet-500/30",
    countKey: "tagged",
    filter: "tagged",
  },
  {
    key: "no-whatsapp",
    label: "No WhatsApp",
    description: "Failed validation — number not on WhatsApp",
    icon: <PhoneOff className="w-5 h-5 text-rose-400" />,
    iconBg: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    countKey: "noWhatsApp",
    filter: "no-whatsapp",
  },
];

export function ContactSegmentsPage() {
  const navigate = useNavigate();
  const counts = useQuery(api.contacts.segmentCounts);

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={staggerItemVariants} className="flex items-center gap-3">
        <div className="p-2 bg-violet-500/10 rounded-xl">
          <Users className="w-6 h-6 text-violet-500" />
        </div>
        <div>
          <h1 className="text-h2 text-zinc-100">Contact Segments</h1>
          <p className="text-small text-zinc-500">
            Filter and explore your contacts by predefined segments.
          </p>
        </div>
      </motion.div>

      {/* Segments grid */}
      <motion.div
        variants={staggerItemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {segments.map((segment) => {
          const count = counts?.[segment.countKey as keyof typeof counts];
          const isLoading = counts === undefined;

          return (
            <motion.button
              key={segment.key}
              variants={staggerItemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/contacts?segment=${segment.filter}`)}
              className={`relative text-left p-5 bg-zinc-900 border ${segment.borderColor} rounded-2xl transition-colors hover:bg-zinc-800/80 cursor-pointer group`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${segment.iconBg}`}>
                  {segment.icon}
                </div>
                <span
                  className={`text-2xl font-bold text-zinc-100 tabular-nums ${
                    isLoading ? "animate-pulse" : ""
                  }`}
                >
                  {isLoading ? "--" : count}
                </span>
              </div>
              <h3 className="text-sm font-medium text-zinc-200 mb-1">
                {segment.label}
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {segment.description}
              </p>

              {/* Hover arrow indicator */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-4 h-4 text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Summary bar */}
      {counts && (
        <motion.div
          variants={staggerItemVariants}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
        >
          <h3 className="text-sm font-medium text-zinc-400 mb-3">
            Distribution Overview
          </h3>
          <div className="space-y-2">
            {(
              [
                { label: "Pending", value: counts.pending, color: "bg-amber-500" },
                { label: "Sent", value: counts.sent, color: "bg-emerald-500" },
                { label: "Failed", value: counts.failed, color: "bg-red-500" },
              ] as const
            ).map((bar) => {
              const pct = counts.total > 0 ? (bar.value / counts.total) * 100 : 0;
              return (
                <div key={bar.label} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 w-16">{bar.label}</span>
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${bar.color} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                    />
                  </div>
                  <span className="text-xs text-zinc-400 tabular-nums w-12 text-right">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
