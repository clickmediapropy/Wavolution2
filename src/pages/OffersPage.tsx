import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Tag, Plus, Pencil, Archive, Copy, X, DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { staggerContainerVariants, staggerItemVariants, scaleInVariants } from "@/lib/transitions";
import type { Id } from "@convex/_generated/dataModel";

const STATUS_OPTIONS = ["active", "paused", "archived"] as const;
type OfferStatus = (typeof STATUS_OPTIONS)[number];

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400" },
  paused: { bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400" },
  archived: { bg: "bg-zinc-500/10 border-zinc-500/30", text: "text-zinc-400" },
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

interface OfferFormData {
  name: string;
  verticalId: string;
  affiliateNetwork: string;
  url: string;
  status: OfferStatus;
  notes: string;
}

const EMPTY_FORM: OfferFormData = {
  name: "",
  verticalId: "",
  affiliateNetwork: "",
  url: "",
  status: "active",
  notes: "",
};

export function OffersPage() {
  const [statusFilter, setStatusFilter] = useState<OfferStatus | "all">("all");
  const [verticalFilter, setVerticalFilter] = useState<string>("all");

  const offers = useQuery(api.offers.list, {
    status: statusFilter !== "all" ? statusFilter : undefined,
    verticalId: verticalFilter !== "all" ? verticalFilter as Id<"verticals"> : undefined,
  });
  const verticals = useQuery(api.verticals.list);
  const stats = useQuery(api.offers.stats);
  const createOffer = useMutation(api.offers.create);
  const updateOffer = useMutation(api.offers.update);
  const removeOffer = useMutation(api.offers.remove);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"offers"> | null>(null);
  const [form, setForm] = useState<OfferFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Build vertical lookup map
  const verticalMap = new Map(
    (verticals ?? []).map((v) => [v._id, v]),
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (offer: {
    _id: Id<"offers">;
    name: string;
    verticalId: Id<"verticals">;
    affiliateNetwork: string;
    url?: string;
    status: string;
    notes?: string;
  }) => {
    setEditingId(offer._id);
    setForm({
      name: offer.name,
      verticalId: offer.verticalId,
      affiliateNetwork: offer.affiliateNetwork,
      url: offer.url ?? "",
      status: offer.status as OfferStatus,
      notes: offer.notes ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.verticalId || !form.affiliateNetwork.trim()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await updateOffer({
          id: editingId,
          name: form.name,
          affiliateNetwork: form.affiliateNetwork,
          url: form.url || undefined,
          status: form.status,
          notes: form.notes || undefined,
        });
        toast.success("Offer updated");
      } else {
        await createOffer({
          name: form.name,
          verticalId: form.verticalId as Id<"verticals">,
          affiliateNetwork: form.affiliateNetwork,
          url: form.url || undefined,
          status: form.status,
          notes: form.notes || undefined,
        });
        toast.success("Offer created");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save offer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id: Id<"offers">) => {
    try {
      await removeOffer({ id });
      toast.success("Offer archived");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to archive offer");
    }
  };

  const handleCopyUrl = (url: string) => {
    void navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

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
            <Tag className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-h2 text-zinc-100">Offers</h1>
            <p className="text-small text-zinc-500">Manage your affiliate offers</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Offer
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={staggerItemVariants} className="flex flex-wrap gap-3">
        <select
          value={verticalFilter}
          onChange={(e) => setVerticalFilter(e.target.value)}
          className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Verticals</option>
          {(verticals ?? []).map((v) => (
            <option key={v._id} value={v._id}>{v.name}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {(["all", ...STATUS_OPTIONS] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize",
                statusFilter === s
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={staggerItemVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: "Total Offers", value: stats?.totalOffers ?? 0, icon: Tag, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Active Offers", value: stats?.activeOffers ?? 0, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Total Revenue", value: currencyFormatter.format(stats?.totalRevenue ?? 0), icon: DollarSign, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Conversions", value: stats?.totalConversions ?? 0, icon: BarChart3, color: "text-violet-400", bg: "bg-violet-500/10" },
        ].map((stat) => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
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

      {/* Offers list */}
      <motion.div variants={staggerItemVariants} className="space-y-3">
        {offers === undefined ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse h-24" />
          ))
        ) : offers.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400">No offers found. Create one to get started.</p>
          </div>
        ) : (
          offers.map((offer) => {
            const vertical = verticalMap.get(offer.verticalId);
            const style = STATUS_STYLES[offer.status] ?? { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400" };
            return (
              <motion.div
                key={offer._id}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-zinc-100 font-semibold truncate">{offer.name}</h3>
                      {vertical && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${vertical.color}15`,
                            color: vertical.color,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: vertical.color }}
                          />
                          {vertical.name}
                        </span>
                      )}
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border capitalize", style.bg, style.text)}>
                        {offer.status}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500">{offer.affiliateNetwork}</p>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-zinc-100">
                        {currencyFormatter.format(offer.revenue ?? 0)}
                      </p>
                      <p className="text-xs text-zinc-500">{offer.conversionCount ?? 0} conv.</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(offer)}
                        className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {offer.url && (
                        <button
                          onClick={() => handleCopyUrl(offer.url!)}
                          className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                          title="Copy URL"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => void handleArchive(offer._id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                        title="Archive"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Modal */}
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
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-zinc-100">
                    {editingId ? "Edit Offer" : "New Offer"}
                  </h2>
                  <button onClick={() => setModalOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. Medvi CPM Andy - GLP1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Vertical</label>
                    <select
                      value={form.verticalId}
                      onChange={(e) => setForm((prev) => ({ ...prev, verticalId: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                      required
                    >
                      <option value="">Select vertical...</option>
                      {(verticals ?? []).map((v) => (
                        <option key={v._id} value={v._id}>{v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Affiliate Network</label>
                    <input
                      type="text"
                      value={form.affiliateNetwork}
                      onChange={(e) => setForm((prev) => ({ ...prev, affiliateNetwork: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. Pureads, RemedyMeds"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">URL</label>
                    <input
                      type="url"
                      value={form.url}
                      onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as OfferStatus }))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s} className="capitalize">{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                      rows={3}
                      placeholder="Optional notes"
                    />
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
                      disabled={submitting || !form.name.trim() || !form.verticalId || !form.affiliateNetwork.trim()}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {submitting ? "Saving..." : editingId ? "Update" : "Create"}
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
