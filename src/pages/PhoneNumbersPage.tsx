import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Phone,
  Plus,
  X,
  Loader2,
  Globe,
  DollarSign,
  Wifi,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  staggerContainerVariants,
  staggerItemVariants,
  scaleInVariants,
} from "@/lib/transitions";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

interface OwnedNumber {
  number: string;
  country: string;
  type: string;
  status: string;
  monthlyCost: number;
}

interface AvailableNumber {
  number: string;
  country: string;
  type: string;
  monthlyCost: number;
}

export function PhoneNumbersPage() {
  const listMyNumbers = useAction(api.actions.herosms.listMyNumbers);
  const listAvailable = useAction(api.actions.herosms.listAvailableNumbers);
  const purchaseNumber = useAction(api.actions.herosms.purchaseNumber);

  const [numbers, setNumbers] = useState<OwnedNumber[]>([]);
  const [numbersLoaded, setNumbersLoaded] = useState(false);
  const [loadingNumbers, setLoadingNumbers] = useState(false);

  // Buy modal state
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [country, setCountry] = useState("US");
  const [numberType, setNumberType] = useState("mobile");
  const [searching, setSearching] = useState(false);
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const loadNumbers = async () => {
    setLoadingNumbers(true);
    try {
      const result = (await listMyNumbers()) as {
        numbers?: OwnedNumber[];
        error?: string;
      };
      if (result.error) {
        toast.error(result.error);
      } else {
        setNumbers(result.numbers ?? []);
      }
      setNumbersLoaded(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load numbers",
      );
      setNumbersLoaded(true);
    } finally {
      setLoadingNumbers(false);
    }
  };

  if (!numbersLoaded && !loadingNumbers) {
    void loadNumbers();
  }

  const handleSearch = async () => {
    setSearching(true);
    setAvailableNumbers([]);
    try {
      const result = (await listAvailable({ country, type: numberType })) as {
        numbers?: AvailableNumber[];
        error?: string;
        mockFormat?: AvailableNumber[];
      };
      if (result.error) {
        toast.error(result.error);
        // Use mock format if available (dev mode)
        if (result.mockFormat) {
          setAvailableNumbers(result.mockFormat);
        }
      } else {
        setAvailableNumbers((result.numbers ?? []) as AvailableNumber[]);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Search failed",
      );
    } finally {
      setSearching(false);
    }
  };

  const handlePurchase = async (number: string) => {
    setPurchasing(number);
    try {
      const result = (await purchaseNumber({ number })) as {
        error?: string;
        success?: boolean;
      };
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Number ${number} purchased!`);
        setAvailableNumbers((prev) =>
          prev.filter((n) => n.number !== number),
        );
        void loadNumbers();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Purchase failed",
      );
    } finally {
      setPurchasing(null);
    }
  };

  const STATUS_STYLES: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400",
    pending: "bg-amber-500/10 text-amber-400",
    inactive: "bg-red-500/10 text-red-400",
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
          <div className="p-2 bg-teal-500/10 rounded-xl">
            <Phone className="w-6 h-6 text-teal-500" />
          </div>
          <div>
            <h1 className="text-h2 text-zinc-100">Phone Numbers</h1>
            <p className="text-small text-zinc-500">
              Buy and manage WhatsApp numbers
            </p>
          </div>
        </div>
        <button
          onClick={() => setBuyModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Buy Number
        </button>
      </motion.div>

      {/* Numbers list */}
      <motion.div variants={staggerItemVariants} className="space-y-3">
        {loadingNumbers && !numbersLoaded ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse h-20"
            />
          ))
        ) : numbers.length === 0 ? (
          <div className="text-center py-12">
            <Phone className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400">
              No phone numbers yet. Buy one to get started.
            </p>
            <p className="text-zinc-600 text-sm mt-1">
              Numbers can be connected to Evolution API instances for
              WhatsApp messaging.
            </p>
          </div>
        ) : (
          numbers.map((num) => (
            <motion.div
              key={num.number}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-teal-500/10 rounded-lg">
                    <Phone className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-zinc-100 font-semibold font-mono">
                      {num.number}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {num.country}
                      </span>
                      <span className="capitalize">{num.type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="flex items-center gap-1 text-sm text-zinc-300">
                      <DollarSign className="w-3.5 h-3.5" />
                      {currencyFormatter.format(num.monthlyCost)}/mo
                    </span>
                  </div>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                      STATUS_STYLES[num.status] ??
                        "bg-zinc-500/10 text-zinc-400",
                    )}
                  >
                    {num.status}
                  </span>
                  <div className="flex items-center gap-1">
                    <Wifi
                      className={cn(
                        "w-4 h-4",
                        num.status === "active"
                          ? "text-emerald-400"
                          : "text-zinc-600",
                      )}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Connection instructions */}
      <motion.div
        variants={staggerItemVariants}
        className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
      >
        <h3 className="text-zinc-200 font-semibold mb-2">
          Connecting Numbers
        </h3>
        <ol className="text-sm text-zinc-400 space-y-1.5 list-decimal list-inside">
          <li>Purchase a number above</li>
          <li>
            Go to{" "}
            <a
              href="/whatsapp"
              className="text-emerald-400 hover:underline"
            >
              WhatsApp Settings
            </a>{" "}
            and create an instance
          </li>
          <li>
            Use the purchased number to register the WhatsApp instance
          </li>
          <li>Scan the QR code or enter the verification code</li>
        </ol>
      </motion.div>

      {/* Buy Number Modal */}
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
                    Buy Phone Number
                  </h2>
                  <button
                    onClick={() => setBuyModalOpen(false)}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">
                        Country
                      </label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                      >
                        <option value="US">United States</option>
                        <option value="GB">United Kingdom</option>
                        <option value="CA">Canada</option>
                        <option value="AU">Australia</option>
                        <option value="BR">Brazil</option>
                        <option value="MX">Mexico</option>
                        <option value="DE">Germany</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">
                        Number Type
                      </label>
                      <select
                        value={numberType}
                        onChange={(e) => setNumberType(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                      >
                        <option value="mobile">Mobile</option>
                        <option value="local">Local</option>
                        <option value="tollfree">Toll-Free</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => void handleSearch()}
                    disabled={searching}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {searching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Search Available Numbers
                  </button>

                  {availableNumbers.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {availableNumbers.map((num) => (
                        <div
                          key={num.number}
                          className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                        >
                          <div>
                            <span className="text-sm text-zinc-200 font-mono">
                              {num.number}
                            </span>
                            <span className="text-xs text-zinc-500 ml-2">
                              {currencyFormatter.format(num.monthlyCost)}
                              /mo
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              void handlePurchase(num.number)
                            }
                            disabled={purchasing === num.number}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-md text-xs font-medium transition-colors"
                          >
                            {purchasing === num.number
                              ? "Buying..."
                              : "Buy"}
                          </button>
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
