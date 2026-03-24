import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Link2,
  Plus,
  Pencil,
  Archive,
  Copy,
  X,
  MousePointerClick,
  DollarSign,
  BarChart3,
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

const STATUS_OPTIONS = ["active", "paused", "archived"] as const;
type LinkStatus = (typeof STATUS_OPTIONS)[number];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

interface LinkFormData {
  name: string;
  originalUrl: string;
  offerId: string;
  verticalId: string;
  status: LinkStatus;
  tags: string;
}

const EMPTY_FORM: LinkFormData = {
  name: "",
  originalUrl: "",
  offerId: "",
  verticalId: "",
  status: "active",
  tags: "",
};

export function LinksPage() {
  const [statusFilter, setStatusFilter] = useState<LinkStatus | "all">("all");
  const [offerFilter, setOfferFilter] = useState<string>("all");

  const links = useQuery(api.links.list, {
    status: statusFilter !== "all" ? statusFilter : undefined,
    offerId:
      offerFilter !== "all"
        ? (offerFilter as Id<"offers">)
        : undefined,
  });
  const offers = useQuery(api.offers.list, {});
  const verticals = useQuery(api.verticals.list);
  const stats = useQuery(api.links.stats);
  const createLink = useMutation(api.links.create);
  const updateLink = useMutation(api.links.update);
  const removeLink = useMutation(api.links.remove);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"affiliateLinks"> | null>(null);
  const [form, setForm] = useState<LinkFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const offerMap = new Map((offers ?? []).map((o) => [o._id, o]));
  const verticalMap = new Map((verticals ?? []).map((v) => [v._id, v]));

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (link: {
    _id: Id<"affiliateLinks">;
    name: string;
    originalUrl: string;
    offerId?: Id<"offers">;
    verticalId?: Id<"verticals">;
    status: string;
    tags?: string[];
  }) => {
    setEditingId(link._id);
    setForm({
      name: link.name,
      originalUrl: link.originalUrl,
      offerId: link.offerId ?? "",
      verticalId: link.verticalId ?? "",
      status: link.status as LinkStatus,
      tags: (link.tags ?? []).join(", "),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.originalUrl.trim()) return;
    setSubmitting(true);
    try {
      const tags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (editingId) {
        await updateLink({
          id: editingId,
          name: form.name,
          originalUrl: form.originalUrl,
          offerId: form.offerId
            ? (form.offerId as Id<"offers">)
            : undefined,
          status: form.status,
          tags: tags.length > 0 ? tags : undefined,
        });
        toast.success("Link updated");
      } else {
        await createLink({
          name: form.name,
          originalUrl: form.originalUrl,
          offerId: form.offerId
            ? (form.offerId as Id<"offers">)
            : undefined,
          verticalId: form.verticalId
            ? (form.verticalId as Id<"verticals">)
            : undefined,
          status: form.status,
          tags: tags.length > 0 ? tags : undefined,
        });
        toast.success("Link created");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save link",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id: Id<"affiliateLinks">) => {
    try {
      await removeLink({ id });
      toast.success("Link archived");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to archive link",
      );
    }
  };

  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  function truncateUrl(url: string, max = 50): string {
    return url.length > max ? url.slice(0, max) + "..." : url;
  }

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
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <Link2 className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-h2 text-zinc-100">Links</h1>
            <p className="text-small text-zinc-500">
              Manage your affiliate links and shortlinks
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Link
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div
        variants={staggerItemVariants}
        className="flex flex-wrap gap-3"
      >
        <select
          value={offerFilter}
          onChange={(e) => setOfferFilter(e.target.value)}
          className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Offers</option>
          {(offers ?? []).map((o) => (
            <option key={o._id} value={o._id}>
              {o.name}
            </option>
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
                  : "text-zinc-500 hover:text-zinc-300",
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
          {
            label: "Total Links",
            value: stats?.totalLinks ?? 0,
            icon: Link2,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            label: "Total Clicks",
            value: stats?.totalClicks ?? 0,
            icon: MousePointerClick,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Conversions",
            value: stats?.totalConversions ?? 0,
            icon: BarChart3,
            color: "text-violet-400",
            bg: "bg-violet-500/10",
          },
          {
            label: "Revenue",
            value: currencyFormatter.format(stats?.totalRevenue ?? 0),
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

      {/* Links list */}
      <motion.div variants={staggerItemVariants} className="space-y-3">
        {links === undefined ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse h-20"
            />
          ))
        ) : links.length === 0 ? (
          <div className="text-center py-12">
            <Link2 className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400">
              No links found. Create one to get started.
            </p>
          </div>
        ) : (
          links.map((link) => {
            const offer = link.offerId ? offerMap.get(link.offerId) : null;
            const vertical = link.verticalId
              ? verticalMap.get(link.verticalId)
              : null;
            return (
              <motion.div
                key={link._id}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-zinc-100 font-semibold truncate">
                        {link.name}
                      </h3>
                      {offer && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                          {offer.name}
                        </span>
                      )}
                      {vertical && (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${vertical.color}15`,
                            color: vertical.color,
                          }}
                        >
                          {vertical.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 font-mono truncate">
                      {truncateUrl(link.originalUrl)}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-sm font-bold text-zinc-100">
                        {link.clickCount ?? 0}
                      </p>
                      <p className="text-xs text-zinc-500">clicks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-zinc-100">
                        {link.conversionCount ?? 0}
                      </p>
                      <p className="text-xs text-zinc-500">conv.</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-zinc-100">
                        {currencyFormatter.format(link.revenue ?? 0)}
                      </p>
                      <p className="text-xs text-zinc-500">revenue</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(link.originalUrl)}
                        className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                        title="Copy URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(link)}
                        className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => void handleArchive(link._id)}
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
              <div
                className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-zinc-100">
                    {editingId ? "Edit Link" : "New Link"}
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
                      placeholder="e.g. Medvi GLP1 - Landing A"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">
                      Original URL
                    </label>
                    <input
                      type="url"
                      value={form.originalUrl}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          originalUrl: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                      placeholder="https://..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">
                        Offer
                      </label>
                      <select
                        value={form.offerId}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            offerId: e.target.value,
                          }))
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
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">
                        Vertical
                      </label>
                      <select
                        value={form.verticalId}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            verticalId: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">None</option>
                        {(verticals ?? []).map((v) => (
                          <option key={v._id} value={v._id}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={form.tags}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, tags: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. landing-a, test"
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
                      disabled={
                        submitting ||
                        !form.name.trim() ||
                        !form.originalUrl.trim()
                      }
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {submitting
                        ? "Saving..."
                        : editingId
                          ? "Update"
                          : "Create"}
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
