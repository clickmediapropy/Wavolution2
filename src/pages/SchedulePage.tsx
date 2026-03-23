import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Loader2, CalendarClock, Check } from "lucide-react";
import { toast } from "sonner";
import { SearchableCombobox } from "@/components/SearchableCombobox";
import type { Id } from "@convex/_generated/dataModel";

export function SchedulePage() {
  const navigate = useNavigate();
  const contacts = usePaginatedQuery(
    api.contacts.list,
    {},
    { initialNumItems: 500 },
  );
  const connectedInstances = useQuery(api.instances.listConnected);
  const createCampaign = useMutation(api.campaigns.create);

  const [campaignName, setCampaignName] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [recipientType, setRecipientType] = useState<
    "all" | "pending"
  >("all");
  const [selectedInstanceId, setSelectedInstanceId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const allContacts = contacts.results;

  const recipientCount = useMemo(() => {
    if (recipientType === "pending") {
      return allContacts.filter((c) => c.status === "pending").length;
    }
    return allContacts.length;
  }, [recipientType, allContacts]);

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

  // Compute minimum datetime (now + 2 minutes)
  const minDate = useMemo(() => {
    const d = new Date(Date.now() + 2 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  }, []);

  const isFormValid =
    campaignName.trim() &&
    messageTemplate.trim() &&
    selectedInstanceId &&
    scheduledDate &&
    scheduledTime &&
    recipientCount > 0;

  const scheduledTimestamp = useMemo(() => {
    if (!scheduledDate || !scheduledTime) return null;
    return new Date(`${scheduledDate}T${scheduledTime}`).getTime();
  }, [scheduledDate, scheduledTime]);

  const isScheduleInPast =
    scheduledTimestamp !== null && scheduledTimestamp <= Date.now();

  const handleSchedule = async () => {
    if (!scheduledTimestamp || isScheduleInPast) {
      toast.error("Scheduled time must be in the future");
      return;
    }

    setIsCreating(true);
    try {
      const campaignId = await createCampaign({
        name: campaignName.trim(),
        instanceId: selectedInstanceId
          ? (selectedInstanceId as Id<"instances">)
          : undefined,
        recipientType,
        messageTemplate: messageTemplate.trim(),
        hasMedia: false,
        delay: 5000,
        total: recipientCount,
        scheduledAt: scheduledTimestamp,
      });

      toast.success("Campaign scheduled!");
      navigate(`/campaigns/${campaignId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to schedule campaign",
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (contacts.status === "LoadingFirstPage") {
    return (
      <div role="status" className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <CalendarClock className="w-7 h-7 text-emerald-500" />
        <h1 className="text-2xl font-bold text-zinc-100">Schedule Campaign</h1>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-6">
        {/* Campaign Name */}
        <div>
          <label
            htmlFor="schedule-campaign-name"
            className="block text-sm font-medium text-zinc-300 mb-1"
          >
            Campaign Name
          </label>
          <input
            id="schedule-campaign-name"
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="e.g. Weekend Promo"
            className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
          />
        </div>

        {/* Message Template */}
        <div>
          <label
            htmlFor="schedule-message"
            className="block text-sm font-medium text-zinc-300 mb-1"
          >
            Message Template
          </label>
          <textarea
            id="schedule-message"
            value={messageTemplate}
            onChange={(e) => setMessageTemplate(e.target.value)}
            placeholder="Hi {name}, check out our latest offer!"
            rows={4}
            className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none resize-none"
          />
          <p className="text-xs text-zinc-500 mt-1">
            Use {"{"} name {"}"} and {"{"} phone {"}"} as placeholders.
          </p>
        </div>

        {/* Recipient Type */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Recipients
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRecipientType("all")}
              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                recipientType === "all"
                  ? "bg-emerald-600/20 border-emerald-500 text-emerald-400"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750"
              }`}
            >
              All Contacts
            </button>
            <button
              type="button"
              onClick={() => setRecipientType("pending")}
              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                recipientType === "pending"
                  ? "bg-emerald-600/20 border-emerald-500 text-emerald-400"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750"
              }`}
            >
              Pending Only
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {recipientCount} recipient{recipientCount !== 1 ? "s" : ""} selected
          </p>
        </div>

        {/* Instance Selector */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            WhatsApp Instance
          </label>
          {instanceOptions.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No connected instances. Connect one in WhatsApp settings first.
            </p>
          ) : instanceOptions.length === 1 ? (
            <div className="px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300">
              {instanceOptions[0]!.label}
            </div>
          ) : (
            <SearchableCombobox
              options={instanceOptions}
              value={selectedInstanceId}
              onChange={setSelectedInstanceId}
              placeholder="Choose a WhatsApp instance..."
            />
          )}
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="schedule-date"
              className="block text-sm font-medium text-zinc-300 mb-1"
            >
              Date
            </label>
            <input
              id="schedule-date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={minDate}
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none [color-scheme:dark]"
            />
          </div>
          <div>
            <label
              htmlFor="schedule-time"
              className="block text-sm font-medium text-zinc-300 mb-1"
            >
              Time
            </label>
            <input
              id="schedule-time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none [color-scheme:dark]"
            />
          </div>
        </div>

        {isScheduleInPast && scheduledDate && scheduledTime && (
          <p className="text-sm text-red-400">
            The selected time is in the past. Please choose a future date/time.
          </p>
        )}

        {/* Summary */}
        {isFormValid && scheduledTimestamp && !isScheduleInPast && (
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
            <p className="text-sm text-zinc-400">
              This campaign will be sent to{" "}
              <span className="text-zinc-200 font-medium">
                {recipientCount} contact{recipientCount !== 1 ? "s" : ""}
              </span>{" "}
              on{" "}
              <span className="text-zinc-200 font-medium">
                {new Date(scheduledTimestamp).toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>{" "}
              at{" "}
              <span className="text-zinc-200 font-medium">
                {new Date(scheduledTimestamp).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              .
            </p>
          </div>
        )}

        {/* Submit */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSchedule}
            disabled={!isFormValid || isScheduleInPast || isCreating}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {isCreating ? "Scheduling..." : "Schedule Campaign"}
          </button>
        </div>
      </div>
    </div>
  );
}
