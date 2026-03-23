import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Loader2, Megaphone, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { StepIndicator } from "@/components/StepIndicator";
import { RecipientSelector } from "@/components/RecipientSelector";
import { MessageTemplateEditor } from "@/components/MessageTemplateEditor";
import { MessagePreview } from "@/components/MessagePreview";
import { MediaUpload } from "@/components/MediaUpload";
import { DelayConfig } from "@/components/DelayConfig";
import { SearchableCombobox } from "@/components/SearchableCombobox";
import type { Id } from "@convex/_generated/dataModel";

type MediaData = {
  storageId: Id<"_storage">;
  mediaType: "image" | "video" | "document" | "audio";
  fileName: string;
};

const STEPS = [
  { label: "Recipients" },
  { label: "Message" },
  { label: "Review" },
];

export function BulkCampaignPage() {
  const navigate = useNavigate();
  const contacts = usePaginatedQuery(
    api.contacts.list,
    {},
    { initialNumItems: 500 },
  );
  const connectedInstances = useQuery(api.instances.listConnected);
  const createCampaign = useMutation(api.campaigns.create);
  const startCampaign = useMutation(api.campaigns.start);

  const [currentStep, setCurrentStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  // Step 1: Recipients
  const [recipientType, setRecipientType] = useState<
    "all" | "pending" | "manual"
  >("all");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  // Step 2: Message
  const [selectedInstanceId, setSelectedInstanceId] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [media, setMedia] = useState<MediaData | null>(null);
  const [delay, setDelay] = useState(5); // seconds

  const allContacts = contacts.results;

  const recipientCount = useMemo(() => {
    switch (recipientType) {
      case "all":
        return allContacts.length;
      case "pending":
        return allContacts.filter((c) => c.status === "pending").length;
      case "manual":
        return selectedContactIds.length;
    }
  }, [recipientType, allContacts, selectedContactIds]);

  // Auto-select if only one connected instance
  if (connectedInstances?.length === 1 && !selectedInstanceId) {
    setSelectedInstanceId(connectedInstances[0]!._id);
  }

  const instanceOptions = (connectedInstances ?? []).map((inst) => ({
    value: inst._id,
    label: inst.whatsappNumber
      ? `${inst.name} (${inst.whatsappNumber})`
      : inst.name,
  }));

  const canProceedStep0 = recipientCount > 0;
  const canProceedStep1 =
    campaignName.trim() && messageTemplate.trim() && selectedInstanceId;

  const handleMediaUpload = useCallback((data: MediaData) => {
    setMedia(data);
  }, []);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const campaignId = await createCampaign({
        name: campaignName.trim(),
        instanceId: selectedInstanceId
          ? (selectedInstanceId as Id<"instances">)
          : undefined,
        recipientType,
        selectedContactIds:
          recipientType === "manual"
            ? (selectedContactIds as Id<"contacts">[])
            : undefined,
        messageTemplate: messageTemplate.trim(),
        hasMedia: media !== null,
        mediaStorageIds: media ? [media.storageId] : undefined,
        delay: delay * 1000, // convert to ms
        total: recipientCount,
      });

      await startCampaign({ id: campaignId });
      toast.success("Campaign started!");
      navigate(`/campaigns/${campaignId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create campaign",
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Preview message with sample data
  const previewMessage = useMemo(() => {
    return messageTemplate
      .replace(/\{name\}/g, "John")
      .replace(/\{phone\}/g, "+1234567890");
  }, [messageTemplate]);

  if (contacts.status === "LoadingFirstPage") {
    return (
      <div role="status" className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Megaphone className="w-7 h-7 text-emerald-500" />
        <h1 className="text-2xl font-bold text-zinc-100">New Campaign</h1>
      </div>

      <StepIndicator steps={STEPS} currentStep={currentStep} />

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        {/* Step 1: Recipients */}
        {currentStep === 0 && (
          <RecipientSelector
            contacts={allContacts}
            recipientType={recipientType}
            onRecipientTypeChange={setRecipientType}
            selectedContactIds={selectedContactIds}
            onSelectedContactIdsChange={setSelectedContactIds}
          />
        )}

        {/* Step 2: Message */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Instance selector — only show if multiple */}
            {instanceOptions.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Send From Instance
                </label>
                <SearchableCombobox
                  options={instanceOptions}
                  value={selectedInstanceId}
                  onChange={setSelectedInstanceId}
                  placeholder="Choose a WhatsApp instance..."
                />
              </div>
            )}

            <div>
              <label
                htmlFor="campaign-name"
                className="block text-sm font-medium text-zinc-300 mb-1"
              >
                Campaign Name
              </label>
              <input
                id="campaign-name"
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. March Promotion"
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
              />
            </div>

            <MessageTemplateEditor
              value={messageTemplate}
              onChange={setMessageTemplate}
            />

            <MediaUpload onUpload={handleMediaUpload} />

            <DelayConfig value={delay} onChange={setDelay} />
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-zinc-100">
              Review Campaign
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-800 rounded-lg p-4">
                <p className="text-xs text-zinc-500 mb-1">Campaign Name</p>
                <p className="text-sm font-medium text-zinc-200">
                  {campaignName}
                </p>
              </div>
              <div className="bg-zinc-800 rounded-lg p-4">
                <p className="text-xs text-zinc-500 mb-1">Instance</p>
                <p className="text-sm font-medium text-zinc-200">
                  {connectedInstances?.find((i) => i._id === selectedInstanceId)
                    ?.name ?? "—"}
                </p>
              </div>
              <div className="bg-zinc-800 rounded-lg p-4">
                <p className="text-xs text-zinc-500 mb-1">Recipients</p>
                <p className="text-sm font-medium text-zinc-200">
                  {recipientCount}{" "}
                  <span className="text-zinc-500">({recipientType})</span>
                </p>
              </div>
              <div className="bg-zinc-800 rounded-lg p-4">
                <p className="text-xs text-zinc-500 mb-1">Delay</p>
                <p className="text-sm font-medium text-zinc-200">
                  {delay}s between messages
                </p>
              </div>
              <div className="bg-zinc-800 rounded-lg p-4">
                <p className="text-xs text-zinc-500 mb-1">Media</p>
                <p className="text-sm font-medium text-zinc-200">
                  {media ? media.fileName : "None"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-zinc-300 mb-2">
                Message Preview
              </p>
              <MessagePreview
                message={previewMessage}
                contactName="John"
              />
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={currentStep === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {currentStep < 2 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => s + 1)}
              disabled={
                (currentStep === 0 && !canProceedStep0) ||
                (currentStep === 1 && !canProceedStep1)
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {isCreating ? "Creating..." : "Start Campaign"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
