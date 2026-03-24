import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  ArrowDownToLine,
  Plus,
  Copy,
  X,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  TrendingUp,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  staggerContainerVariants,
  staggerItemVariants,
  scaleInVariants,
} from "@/lib/transitions";
import type { Id } from "@convex/_generated/dataModel";

type Tab = "config" | "log";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ConfigFormData {
  name: string;
  offerId: string;
  clickId: string;
  payout: string;
  transactionId: string;
  statusParam: string;
}

const EMPTY_FORM: ConfigFormData = {
  name: "",
  offerId: "",
  clickId: "clickid",
  payout: "payout",
  transactionId: "txid",
  statusParam: "",
};

export function PostbacksPage() {
  const [tab, setTab] = useState<Tab>("config");

  // Config tab
  const configs = useQuery(api.postbacks.listConfigs);
  const offers = useQuery(api.offers.list, {});
  const createConfig = useMutation(api.postbacks.createConfig);
  const updateConfig = useMutation(api.postbacks.updateConfig);
  const removeConfig = useMutation(api.postbacks.removeConfig);
  const pbStats = useQuery(api.postbacks.stats);

  // Log tab
  const [logOfferFilter, setLogOfferFilter] = useState<string>("all");
  const postbacks = useQuery(api.postbacks.listPostbacks, {
    offerId:
      logOfferFilter !== "all"
        ? (logOfferFilter as Id<"offers">)
        : undefined,
  });

  // Config modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ConfigFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Postback URL display
  const [viewingUrlFor, setViewingUrlFor] = useState<Id<"postbackConfigs"> | null>(null);
  const postbackUrl = useQuery(
    api.postbacks.getPostbackUrl,
    viewingUrlFor ? { configId: viewingUrlFor } : "skip",
  );

  const offerMap = new Map((offers ?? []).map((o) => [o._id, o]));

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      await createConfig({
        name: form.name,
        offerId: form.offerId
          ? (form.offerId as Id<"offers">)
          : undefined,
        paramMapping: {
          clickId: form.clickId || "clickid",
          payout: form.payout || "payout",
          transactionId: form.transactionId || "txid",
          status: form.statusParam || undefined,
        },
      });
      toast.success("Postback config created");
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create config");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: Id<"postbackConfigs">, isActive: boolean) => {
    try {
      await updateConfig({ id, isActive: !isActive });
      toast.success(isActive ? "Config paused" : "Config activated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Toggle failed");
    }
  };

  const handleRemove = async (id: Id<"postbackConfigs">) => {
    try {
      await removeConfig({ id });
      toast.success("Config removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    }
  };

  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={staggerItemVariants}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-xl">
            <ArrowDownToLine className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-h2 text-zinc-100">Postbacks</h1>
            <p className="text-small text-zinc-500">
              Conversion tracking and postback configuration
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={staggerItemVariants}
        className="grid grid-cols-3 gap-4"
      >
        {[
          {
            label: "Conversions Today",
            value: pbStats?.conversionsToday ?? 0,
            icon: TrendingUp,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Total Conversions",
            value: pbStats?.totalConversions ?? 0,
            icon: ArrowDownToLine,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            label: "Total Revenue",
            value: currencyFormatter.format(pbStats?.totalRevenue ?? 0),
            icon: DollarSign,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-1.5 rounded-lg", stat.bg)}>
                <stat.icon className={cn("w-4 h-4", stat.color)} />
              </div>
              <span className="text-xs text-zinc-500">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-zinc-100">{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div variants={staggerItemVariants}>
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 w-fit">
          {(["config", "log"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize",
                tab === t
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-zinc-500 hover:text-zinc-300",
              )}
            >
              {t === "config" ? "Configuration" : "Log"}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Configuration Tab */}
      {tab === "config" && (
        <motion.div variants={staggerItemVariants} className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Config
            </button>
          </div>

          {configs === undefined ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse h-24"
              />
            ))
          ) : configs.length === 0 ? (
            <div className="text-center py-12">
              <ArrowDownToLine className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400">
                No postback configs. Create one to start tracking conversions.
              </p>
            </div>
          ) : (
            configs.map((config) => {
              const offer = config.offerId
                ? offerMap.get(config.offerId)
                : null;
              return (
                <div
                  key={config._id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-zinc-100 font-semibold">
                          {config.name}
                        </h3>
                        {offer && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                            {offer.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        Params: clickId={config.paramMapping.clickId}, payout=
                        {config.paramMapping.payout}, txId=
                        {config.paramMapping.transactionId}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setViewingUrlFor(
                            viewingUrlFor === config._id ? null : config._id,
                          )
                        }
                        className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
                      >
                        {viewingUrlFor === config._id
                          ? "Hide URL"
                          : "Show URL"}
                      </button>
                      <button
                        onClick={() =>
                          void handleToggle(config._id, config.isActive)
                        }
                        className="text-zinc-400 hover:text-zinc-200 transition-colors"
                      >
                        {config.isActive ? (
                          <ToggleRight className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-6 h-6" />
                        )}
                      </button>
                      <button
                        onClick={() => void handleRemove(config._id)}
                        className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {viewingUrlFor === config._id && postbackUrl && (
                    <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg flex items-center gap-2">
                      <code className="text-xs text-emerald-400 flex-1 break-all">
                        {postbackUrl}
                      </code>
                      <button
                        onClick={() => handleCopy(postbackUrl)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </motion.div>
      )}

      {/* Log Tab */}
      {tab === "log" && (
        <motion.div variants={staggerItemVariants} className="space-y-4">
          <select
            value={logOfferFilter}
            onChange={(e) => setLogOfferFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Offers</option>
            {(offers ?? []).map((o) => (
              <option key={o._id} value={o._id}>
                {o.name}
              </option>
            ))}
          </select>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-4 text-zinc-500 font-medium">
                    Time
                  </th>
                  <th className="text-left py-3 px-4 text-zinc-500 font-medium">
                    Click ID
                  </th>
                  <th className="text-right py-3 px-4 text-zinc-500 font-medium">
                    Payout
                  </th>
                  <th className="text-left py-3 px-4 text-zinc-500 font-medium">
                    Source
                  </th>
                  <th className="text-left py-3 px-4 text-zinc-500 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {postbacks === undefined ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-zinc-500">
                      Loading...
                    </td>
                  </tr>
                ) : postbacks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-zinc-500">
                      No postbacks received yet
                    </td>
                  </tr>
                ) : (
                  postbacks.map((pb) => (
                    <tr
                      key={pb._id}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                    >
                      <td className="py-2.5 px-4 text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(pb.receivedAt)}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-zinc-300 font-mono text-xs">
                        {pb.clickId ?? "—"}
                      </td>
                      <td className="py-2.5 px-4 text-emerald-400 text-right font-semibold">
                        {pb.payout != null
                          ? currencyFormatter.format(pb.payout)
                          : "—"}
                      </td>
                      <td className="py-2.5 px-4 text-zinc-400">
                        {pb.source ?? "—"}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                            pb.status === "received"
                              ? "bg-blue-500/10 text-blue-400"
                              : pb.status === "validated"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400",
                          )}
                        >
                          {pb.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Create Config Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              variants={scaleInVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-zinc-100">
                    New Postback Config
                  </h2>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => void handleSubmit(e)}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, name: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. Pureads GLP1 Postback"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">
                      Offer
                    </label>
                    <select
                      value={form.offerId}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, offerId: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">None</option>
                      {(offers ?? []).map((o) => (
                        <option key={o._id} value={o._id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm text-zinc-400 font-medium">
                      Parameter Mapping
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">
                          Click ID param
                        </label>
                        <input
                          type="text"
                          value={form.clickId}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              clickId: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                          placeholder="clickid"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">
                          Payout param
                        </label>
                        <input
                          type="text"
                          value={form.payout}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              payout: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                          placeholder="payout"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">
                          Transaction ID param
                        </label>
                        <input
                          type="text"
                          value={form.transactionId}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              transactionId: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                          placeholder="txid"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">
                          Status param (optional)
                        </label>
                        <input
                          type="text"
                          value={form.statusParam}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              statusParam: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                          placeholder="status"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !form.name.trim()}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {submitting ? "Creating..." : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
