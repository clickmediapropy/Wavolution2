import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

const NOTIFICATION_PERMISSION_KEY = "inbox-notifications-enabled";

type ConversationSummary = {
  _id: string;
  contactName?: string;
  phone: string;
  unreadCount: number;
  lastMessageText?: string;
};

/**
 * Returns the stored notification preference from localStorage.
 * "granted" means the user opted in AND the browser granted permission.
 */
function getStoredPermission(): boolean {
  try {
    return localStorage.getItem(NOTIFICATION_PERMISSION_KEY) === "true";
  } catch {
    return false;
  }
}

function setStoredPermission(enabled: boolean) {
  try {
    localStorage.setItem(NOTIFICATION_PERMISSION_KEY, String(enabled));
  } catch {
    // localStorage unavailable (private browsing, etc.)
  }
}

/**
 * Hook that tracks conversation list changes and fires browser notifications
 * (+ Sonner toasts when the tab is not focused) for new incoming messages.
 */
export function useInboxNotifications() {
  const conversations = useQuery(api.conversations.list, { archived: false });
  const prevConversationsRef = useRef<Map<string, number> | null>(null);
  const [enabled, setEnabled] = useState(getStoredPermission);

  // Sync enabled state with what the browser actually permits
  useEffect(() => {
    if (enabled && typeof Notification !== "undefined" && Notification.permission !== "granted") {
      setEnabled(false);
      setStoredPermission(false);
    }
  }, [enabled]);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") {
      toast.error("This browser does not support notifications");
      return;
    }

    if (Notification.permission === "granted") {
      setEnabled(true);
      setStoredPermission(true);
      toast.success("Notifications enabled");
      return;
    }

    if (Notification.permission === "denied") {
      toast.error(
        "Notifications are blocked. Please enable them in your browser settings.",
      );
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setEnabled(true);
      setStoredPermission(true);
      toast.success("Notifications enabled");
    } else {
      setEnabled(false);
      setStoredPermission(false);
      toast.error("Notification permission denied");
    }
  }, []);

  const disableNotifications = useCallback(() => {
    setEnabled(false);
    setStoredPermission(false);
    toast.success("Notifications disabled");
  }, []);

  // Detect new unread messages by comparing current vs previous unread counts
  useEffect(() => {
    if (!conversations) return;

    const currentMap = new Map<string, number>(
      conversations.map((c) => [c._id, c.unreadCount]),
    );

    const prevMap = prevConversationsRef.current;

    // On first load, just store the snapshot — don't notify
    if (prevMap === null) {
      prevConversationsRef.current = currentMap;
      return;
    }

    if (!enabled) {
      prevConversationsRef.current = currentMap;
      return;
    }

    // Find conversations whose unreadCount increased
    for (const conv of conversations) {
      const prevUnread = prevMap.get(conv._id) ?? 0;
      if (conv.unreadCount > prevUnread) {
        fireNotification(conv);
      }
    }

    prevConversationsRef.current = currentMap;
  }, [conversations, enabled]);

  return { enabled, requestPermission, disableNotifications };
}

/**
 * Fire a browser Notification and, if the page is not focused, a Sonner toast.
 */
function fireNotification(conv: ConversationSummary) {
  const title = conv.contactName || conv.phone;
  const body = conv.lastMessageText || "New message";

  // Browser notification (works even when tab is in background)
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      const notification = new Notification(title, {
        body,
        icon: "/favicon.ico",
        tag: `inbox-${conv._id}`, // dedup rapid updates for same conversation
      });

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } catch {
      // Notification constructor can fail in some environments (e.g. service worker required on Android)
    }
  }

  // Sonner toast when the inbox tab is not focused
  if (document.hidden) {
    toast.info(`${title}: ${body}`, {
      duration: 5000,
    });
  }
}

/**
 * Toggle button for the inbox header. Shows bell icon and permission state.
 */
export function InboxNotificationToggle() {
  const { enabled, requestPermission, disableNotifications } =
    useInboxNotifications();

  return (
    <button
      onClick={enabled ? disableNotifications : requestPermission}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        enabled
          ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
      }`}
      title={enabled ? "Disable notifications" : "Enable notifications"}
    >
      {enabled ? (
        <>
          <Bell className="w-3.5 h-3.5" />
          Notifications On
        </>
      ) : (
        <>
          <BellOff className="w-3.5 h-3.5" />
          Enable Notifications
        </>
      )}
    </button>
  );
}
