import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Globe,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Copy,
  X,
  Search,
  ShoppingCart,
  Loader2,
  Server,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  staggerContainerVariants,
  staggerItemVariants,
  scaleInVariants,
} from "@/lib/transitions";

const PROVIDER_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  cloudflare: { bg: "bg-orange-500/10", text: "text-orange-400", label: "Cloudflare" },
  namecheap: { bg: "bg-red-500/10", text: "text-red-400", label: "Namecheap" },
  manual: { bg: "bg-zinc-500/10", text: "text-zinc-400", label: "Manual" },
};

const SSL_ICONS: Record<string, { icon: typeof ShieldCheck; color: string }> = {
  active: { icon: ShieldCheck, color: "text-emerald-400" },
  pending: { icon: Clock, color: "text-amber-400" },
  inactive: { icon: ShieldAlert, color: "text-red-400" },
};

interface DomainEntry {
  domain: string;
  zoneId: string;
  nameservers: string[];
  sslStatus: string;
  isVerified: boolean;
}

interface AvailabilityResult {
  domain: string;
  available: boolean;
  price?: string;
}

export function DomainsPage() {
  const addDomain = useAction(api.actions.cloudflare.addDomain);
  const listDomains = useAction(api.actions.cloudflare.listDomains);
  const checkAvailability = useAction(api.actions.namecheap.checkAvailability);
  const registerDomain = useAction(api.actions.namecheap.registerDomain);

  const [domains, setDomains] = useState<DomainEntry[]>([]);
  const [domainsLoaded, setDomainsLoaded] = useState(false);
  const [loadingDomains, setLoadingDomains] = useState(false);

  // Add domain modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [addingDomain, setAddingDomain] = useState(false);

  // Buy domains modal
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [buyInput, setBuyInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [availabilityResults, setAvailabilityResults] = useState<AvailabilityResult[]>([]);
  const [registering, setRegistering] = useState<string | null>(null);

  const loadDomains = async () => {
    setLoadingDomains(true);
    try {
      const result = (await listDomains()) as {
        domains?: DomainEntry[];
        error?: string;
      };
      if (result.error) {
        toast.error(result.error);
      } else {
        setDomains(result.domains ?? []);
      }
      setDomainsLoaded(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load domains");
    } finally {
      setLoadingDomains(false);
    }
  };

  // Load domains on first render
  if (!domainsLoaded && !loadingDomains) {
    void loadDomains();
  }

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setAddingDomain(true);
    try {
      const result = (await addDomain({ domain: newDomain.trim() })) as {
        error?: string;
        nameservers?: string[];
      };
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Domain added to Cloudflare");
        if (result.nameservers) {
          toast.info(`Update nameservers: ${result.nameservers.join(", ")}`);
        }
        setAddModalOpen(false);
        setNewDomain("");
        void loadDomains();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add domain");
    } finally {
      setAddingDomain(false);
    }
  };

  const handleCheckAvailability = async () => {
    const domainList = buyInput
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    if (domainList.length === 0) return;
    setChecking(true);
    setAvailabilityResults([]);
    try {
      const result = (await checkAvailability({ domains: domainList })) as {
        results?: AvailabilityResult[];
        error?: string;
      };
      if (result.error) {
        toast.error(result.error);
      } else {
        setAvailabilityResults(result.results ?? []);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Check failed");
    } finally {
      setChecking(false);
    }
  };

  const handleRegister = async (domain: string) => {
    setRegistering(domain);
    try {
      const result = (await registerDomain({ domain })) as {
        error?: string;
        success?: boolean;
      };
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${domain} registered!`);
        setAvailabilityResults((prev) =>
          prev.map((r) => (r.domain === domain ? { ...r, available: false } : r)),
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegistering(null);
    }
  };

  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Copied");
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
          <div className="p-2 bg-violet-500/10 rounded-xl">
            <Globe className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <h1 className="text-h2 text-zinc-100">Domains</h1>
            <p className="text-small text-zinc-500">
              Manage custom redirect domains
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBuyModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors text-sm font-medium"
          >
            <ShoppingCart className="w-4 h-4" />
            Buy Domains
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Domain
          </button>
        </div>
      </motion.div>

      {/* Domain cards */}
      <motion.div
        variants={staggerItemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {loadingDomains && !domainsLoaded ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse h-36"
            />
          ))
        ) : domains.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Globe className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400">
              No domains configured. Add one to get started.
            </p>
          </div>
        ) : (
          domains.map((d) => {
            const provider = PROVIDER_STYLES["cloudflare"] ?? PROVIDER_STYLES["manual"]!;
            const sslInfo = SSL_ICONS[d.sslStatus] ?? SSL_ICONS["inactive"]!;
            const SslIcon = sslInfo.icon;
            return (
              <motion.div
                key={d.domain}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-zinc-100 font-semibold">{d.domain}</h3>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      provider.bg,
                      provider.text,
                    )}
                  >
                    {provider.label}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs mb-3">
                  <div className="flex items-center gap-1">
                    <SslIcon className={cn("w-3.5 h-3.5", sslInfo.color)} />
                    <span className="text-zinc-400 capitalize">
                      SSL: {d.sslStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        d.isVerified ? "bg-emerald-500" : "bg-amber-500",
                      )}
                    />
                    <span className="text-zinc-400">
                      {d.isVerified ? "Verified" : "Pending"}
                    </span>
                  </div>
                </div>

                {d.nameservers.length > 0 && (
                  <div className="mt-2 p-2 bg-zinc-800/50 rounded-lg">
                    <p className="text-xs text-zinc-500 mb-1">Nameservers:</p>
                    {d.nameservers.map((ns) => (
                      <button
                        key={ns}
                        onClick={() => handleCopy(ns)}
                        className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                      >
                        <Server className="w-3 h-3" />
                        {ns}
                        <Copy className="w-3 h-3 ml-1 opacity-50" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Add Domain Modal */}
      <AnimatePresence>
        {addModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddModalOpen(false)}
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
                className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-zinc-100">
                    Add Domain
                  </h2>
                  <button
                    onClick={() => setAddModalOpen(false)}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form
                  onSubmit={(e) => void handleAddDomain(e)}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">
                      Domain
                    </label>
                    <input
                      type="text"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. go.myoffers.com"
                      required
                    />
                    <p className="text-xs text-zinc-600 mt-1">
                      Domain will be added to Cloudflare for DNS management
                    </p>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setAddModalOpen(false)}
                      className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addingDomain || !newDomain.trim()}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {addingDomain ? "Adding..." : "Add Domain"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Buy Domains Modal */}
      <AnimatePresence>
        {buyModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBuyModalOpen(false)}
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
                    Buy Domains
                  </h2>
                  <button
                    onClick={() => setBuyModalOpen(false)}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">
                      Domains (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={buyInput}
                      onChange={(e) => setBuyInput(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. myoffer.com, getoffer.io"
                    />
                  </div>
                  <button
                    onClick={() => void handleCheckAvailability()}
                    disabled={checking || !buyInput.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {checking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Check Availability
                  </button>

                  {availabilityResults.length > 0 && (
                    <div className="space-y-2">
                      {availabilityResults.map((r) => (
                        <div
                          key={r.domain}
                          className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                        >
                          <div>
                            <span className="text-sm text-zinc-200">
                              {r.domain}
                            </span>
                            {r.price && (
                              <span className="text-xs text-zinc-500 ml-2">
                                {r.price}
                              </span>
                            )}
                          </div>
                          {r.available ? (
                            <button
                              onClick={() => void handleRegister(r.domain)}
                              disabled={registering === r.domain}
                              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-md text-xs font-medium transition-colors"
                            >
                              {registering === r.domain
                                ? "Registering..."
                                : "Register"}
                            </button>
                          ) : (
                            <span className="text-xs text-red-400">Taken</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
