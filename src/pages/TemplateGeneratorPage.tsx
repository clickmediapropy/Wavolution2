import { useState } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Sparkles,
  Copy,
  Megaphone,
  Save,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  staggerContainerVariants,
  staggerItemVariants,
} from "@/lib/transitions";

const TONE_OPTIONS = ["urgent", "friendly", "professional", "casual"] as const;
type Tone = (typeof TONE_OPTIONS)[number];

interface GeneratedTemplate {
  name: string;
  message: string;
  cta: string;
  emoji_level: string;
}

export function TemplateGeneratorPage() {
  const navigate = useNavigate();
  const offers = useQuery(api.offers.list, {});
  const verticals = useQuery(api.verticals.list);
  const generateTemplates = useAction(
    api.actions.templateGenerator.generateOfferTemplates,
  );
  const saveTemplate = useMutation(api.templates.create);

  const [selectedOfferId, setSelectedOfferId] = useState("");
  const [tone, setTone] = useState<Tone>("friendly");
  const [count, setCount] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedTemplate[]>([]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);

  const selectedOffer = offers?.find((o) => o._id === selectedOfferId);
  const offerVertical = selectedOffer
    ? verticals?.find((v) => v._id === selectedOffer.verticalId)
    : null;

  const handleGenerate = async () => {
    if (!selectedOffer) return;
    setGenerating(true);
    setResults([]);
    try {
      const result = await generateTemplates({
        offerName: selectedOffer.name,
        vertical: offerVertical?.name ?? "General",
        offerUrl: selectedOffer.url ?? "https://example.com",
        tone,
        count,
      });
      if ("error" in result && result.error) {
        toast.error(result.error as string);
      } else if ("templates" in result) {
        setResults(result.templates as GeneratedTemplate[]);
        toast.success(`Generated ${(result.templates as GeneratedTemplate[]).length} templates`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Generation failed",
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleUseInCampaign = (message: string) => {
    // Navigate to campaign creation with template pre-filled via URL state
    navigate("/campaigns/new", { state: { messageTemplate: message } });
  };

  const handleSave = async (template: GeneratedTemplate, idx: number) => {
    setSavingIdx(idx);
    try {
      await saveTemplate({
        name: template.name,
        category: "Promotion",
        content: template.message,
      });
      toast.success("Template saved");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save template",
      );
    } finally {
      setSavingIdx(null);
    }
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
        className="flex items-center gap-3"
      >
        <div className="p-2 bg-purple-500/10 rounded-xl">
          <Sparkles className="w-6 h-6 text-purple-500" />
        </div>
        <div>
          <h1 className="text-h2 text-zinc-100">AI Template Generator</h1>
          <p className="text-small text-zinc-500">
            Generate WhatsApp message templates for your offers
          </p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        variants={staggerItemVariants}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Offer</label>
            <select
              value={selectedOfferId}
              onChange={(e) => setSelectedOfferId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">Select offer...</option>
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
            <input
              type="text"
              readOnly
              value={offerVertical?.name ?? "(auto-filled from offer)"}
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as Tone)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
            >
              {TONE_OPTIONS.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              Variations
            </label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
            >
              {[1, 2, 3, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => void handleGenerate()}
            disabled={generating || !selectedOfferId}
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {generating ? "Generating..." : "Generate"}
          </button>
        </div>
      </motion.div>

      {/* Loading state */}
      {generating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4 py-12"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
            </div>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-purple-500/30"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <p className="text-zinc-400 text-sm">
            AI is crafting your templates...
          </p>
        </motion.div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <motion.div
          variants={staggerItemVariants}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold text-zinc-100">
            Generated Templates
          </h2>
          {results.map((template, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-zinc-100 font-semibold">
                    {template.name}
                  </h3>
                  <span className="text-xs text-zinc-500">
                    CTA: {template.cta}
                  </span>
                </div>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    template.emoji_level === "none"
                      ? "bg-zinc-500/10 text-zinc-400"
                      : template.emoji_level === "minimal"
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-amber-500/10 text-amber-400",
                  )}
                >
                  {template.emoji_level} emoji
                </span>
              </div>

              <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
                <p className="text-zinc-200 text-sm whitespace-pre-wrap leading-relaxed">
                  {template.message}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleUseInCampaign(template.message)
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  Use in Campaign
                </button>
                <button
                  onClick={() => handleCopy(template.message)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded-lg text-xs font-medium hover:bg-zinc-700 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </button>
                <button
                  onClick={() => void handleSave(template, idx)}
                  disabled={savingIdx === idx}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded-lg text-xs font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingIdx === idx ? "Saving..." : "Save as Template"}
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
