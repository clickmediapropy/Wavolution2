import { useState, useCallback } from "react";
import { useQuery, useAction, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { MediaUpload } from "@/components/MediaUpload";
import type { Id } from "@convex/_generated/dataModel";

type MediaData = {
  storageId: Id<"_storage">;
  mediaType: "image" | "video" | "document" | "audio";
  fileName: string;
};

export function SendMessagePage() {
  const user = useQuery(api.users.currentUser);
  const contacts = usePaginatedQuery(
    api.contacts.list,
    {},
    { initialNumItems: 200 },
  );
  const sendText = useAction(api.evolution.sendText);
  const sendMediaAction = useAction(api.evolution.sendMedia);
  const logMessage = useMutation(api.messages.logMessage);

  const [selectedPhone, setSelectedPhone] = useState("");
  const [message, setMessage] = useState("");
  const [media, setMedia] = useState<MediaData | null>(null);
  const [isSending, setIsSending] = useState(false);

  const instanceName = user?.evolutionInstanceName;

  const handleMediaUpload = useCallback((data: MediaData) => {
    setMedia(data);
  }, []);

  const handleSend = useCallback(async () => {
    if (!selectedPhone || !message.trim() || !instanceName) return;

    setIsSending(true);
    try {
      if (media) {
        await sendMediaAction({
          instanceName,
          phone: selectedPhone,
          storageId: media.storageId,
          mediaType: media.mediaType,
          caption: message.trim(),
          fileName: media.fileName,
        });
      } else {
        await sendText({
          instanceName,
          phone: selectedPhone,
          message: message.trim(),
        });
      }

      await logMessage({
        phone: selectedPhone,
        message: message.trim(),
        status: "sent",
      });

      toast.success("Message sent!");
      setMessage("");
      setMedia(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send message",
      );

      await logMessage({
        phone: selectedPhone,
        message: message.trim(),
        status: "failed",
      }).catch(() => {});
    } finally {
      setIsSending(false);
    }
  }, [
    selectedPhone,
    message,
    instanceName,
    media,
    sendText,
    sendMediaAction,
    logMessage,
  ]);

  if (user === undefined) {
    return (
      <div role="status" className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const canSend = selectedPhone && message.trim() && !isSending;

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <Send className="w-7 h-7 text-emerald-500" />
        <h1 className="text-2xl font-bold text-zinc-100">Send Message</h1>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 max-w-2xl">
        <div className="space-y-4">
          {/* Contact Selector */}
          <div>
            <label
              htmlFor="contact-select"
              className="block text-sm font-medium text-zinc-300 mb-1"
            >
              Select Contact
            </label>
            <select
              id="contact-select"
              value={selectedPhone}
              onChange={(e) => setSelectedPhone(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
              aria-label="Select Contact"
            >
              <option value="">Choose a contact...</option>
              {contacts.results.map((contact) => (
                <option key={contact._id} value={contact.phone}>
                  {contact.name
                    ? `${contact.name} (${contact.phone})`
                    : contact.phone}
                </option>
              ))}
            </select>
          </div>

          {/* Message Input */}
          <div>
            <label
              htmlFor="message-input"
              className="block text-sm font-medium text-zinc-300 mb-1"
            >
              Message
            </label>
            <textarea
              id="message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Type your message..."
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none resize-y"
              aria-label="Message"
            />
          </div>

          {/* Media Upload */}
          <MediaUpload onUpload={handleMediaUpload} />

          {/* Send Button */}
          <div className="pt-2">
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Send"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
