import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Fuse from "fuse.js";
import {
  Search,
  LayoutDashboard,
  Inbox,
  Users,
  Kanban,
  Megaphone,
  Send,
  Bot,
  Smartphone,
  Settings,
  UserPlus,
  Upload,
  BarChart3,
  BookOpen,
  MessageSquareReply,
  Tags,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  action: () => void;
  keywords?: string[];
  section: "Navigation" | "Actions";
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const runAndClose = useCallback(
    (path: string) => {
      onClose();
      navigate(path);
    },
    [navigate, onClose],
  );

  const commands: CommandItem[] = useMemo(
    () => [
      // Navigation
      { id: "dashboard", label: "Dashboard", description: "Overview and stats", icon: LayoutDashboard, action: () => runAndClose("/dashboard"), keywords: ["home", "overview"], section: "Navigation" },
      { id: "inbox", label: "Inbox", description: "Chat conversations", icon: Inbox, action: () => runAndClose("/inbox"), keywords: ["chat", "messages", "conversations"], section: "Navigation" },
      { id: "contacts", label: "Contacts", description: "Manage contacts", icon: Users, action: () => runAndClose("/contacts"), keywords: ["people", "numbers", "phone"], section: "Navigation" },
      { id: "pipeline", label: "Pipeline", description: "Deal pipeline board", icon: Kanban, action: () => runAndClose("/pipeline"), keywords: ["deals", "board", "kanban", "crm"], section: "Navigation" },
      { id: "campaigns", label: "Campaigns", description: "Campaign list", icon: Megaphone, action: () => runAndClose("/campaigns"), keywords: ["bulk", "broadcast"], section: "Navigation" },
      { id: "send", label: "Send Message", description: "Send a quick message", icon: Send, action: () => runAndClose("/send"), keywords: ["message", "text", "whatsapp"], section: "Navigation" },
      { id: "bots", label: "Bots", description: "Bot configurations", icon: Bot, action: () => runAndClose("/bots"), keywords: ["automation", "ai", "chatbot"], section: "Navigation" },
      { id: "whatsapp", label: "WhatsApp", description: "Instance management", icon: Smartphone, action: () => runAndClose("/whatsapp"), keywords: ["instance", "connection", "qr"], section: "Navigation" },
      { id: "settings", label: "Settings", description: "Account settings", icon: Settings, action: () => runAndClose("/settings"), keywords: ["preferences", "account", "profile"], section: "Navigation" },
      { id: "segments", label: "Contact Segments", description: "Segment your contacts", icon: Tags, action: () => runAndClose("/contacts/segments"), keywords: ["groups", "tags", "filter"], section: "Navigation" },
      { id: "analytics", label: "Campaign Analytics", description: "Campaign performance", icon: BarChart3, action: () => runAndClose("/campaigns/analytics"), keywords: ["stats", "reports", "metrics"], section: "Navigation" },
      { id: "knowledge", label: "Knowledge Base", description: "Manage knowledge base", icon: BookOpen, action: () => runAndClose("/bots/knowledge"), keywords: ["docs", "faq", "articles"], section: "Navigation" },
      { id: "quick-replies", label: "Quick Replies", description: "Message templates", icon: MessageSquareReply, action: () => runAndClose("/quick-replies"), keywords: ["templates", "canned", "saved"], section: "Navigation" },

      // Actions
      { id: "new-campaign", label: "New Campaign", description: "Create a new bulk campaign", icon: Megaphone, action: () => runAndClose("/campaigns?new=1"), keywords: ["create", "bulk", "broadcast"], section: "Actions" },
      { id: "add-contact", label: "Add Contact", description: "Create a new contact", icon: UserPlus, action: () => runAndClose("/contacts?new=1"), keywords: ["create", "new", "person"], section: "Actions" },
      { id: "import-contacts", label: "Import Contacts", description: "Upload a CSV file", icon: Upload, action: () => runAndClose("/contacts/upload"), keywords: ["csv", "upload", "bulk"], section: "Actions" },
    ],
    [runAndClose],
  );

  const fuse = useMemo(
    () =>
      new Fuse(commands, {
        keys: [
          { name: "label", weight: 0.5 },
          { name: "description", weight: 0.2 },
          { name: "keywords", weight: 0.3 },
        ],
        threshold: 0.4,
        includeScore: true,
      }),
    [commands],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    return fuse.search(query).map((r) => r.item);
  }, [query, fuse, commands]);

  // Group by section
  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const list = map.get(item.section) ?? [];
      list.push(item);
      map.set(item.section, list);
    }
    return map;
  }, [filtered]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      // Focus input on next tick so the animation has started
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Clamp selected index when results change
  useEffect(() => {
    if (selectedIndex >= filtered.length) {
      setSelectedIndex(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => (i + 1) % filtered.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
          break;
        case "Enter":
          e.preventDefault();
          filtered[selectedIndex]?.action();
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filtered, selectedIndex, onClose],
  );

  // Build a flat index counter for keyboard navigation across sections
  let flatIndex = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[101]"
          >
            <div
              className="mx-4 rounded-xl border border-zinc-700/50 bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden"
              onKeyDown={handleKeyDown}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 border-b border-zinc-800">
                <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder="Type a command or search..."
                  className="flex-1 bg-transparent py-3.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none"
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 bg-zinc-800 rounded border border-zinc-700">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[320px] overflow-y-auto py-2">
                {filtered.length === 0 && (
                  <p className="px-4 py-8 text-center text-sm text-zinc-500">
                    No results found.
                  </p>
                )}

                {Array.from(grouped.entries()).map(([section, items]) => (
                  <div key={section}>
                    <p className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      {section}
                    </p>
                    {items.map((item) => {
                      const currentIndex = flatIndex++;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          data-index={currentIndex}
                          onClick={() => item.action()}
                          onMouseEnter={() => setSelectedIndex(currentIndex)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                            currentIndex === selectedIndex
                              ? "bg-zinc-800/80 text-zinc-100"
                              : "text-zinc-400 hover:text-zinc-200",
                          )}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium">{item.label}</span>
                            {item.description && (
                              <span className="ml-2 text-xs text-zinc-500">{item.description}</span>
                            )}
                          </div>
                          {item.section === "Navigation" && (
                            <span className="text-[10px] text-zinc-600">Go to</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Footer hints */}
              <div className="flex items-center gap-4 px-4 py-2 border-t border-zinc-800 text-[10px] text-zinc-600">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-500">
                    &uarr;&darr;
                  </kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-500">
                    &crarr;
                  </kbd>
                  select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-500">
                    esc
                  </kbd>
                  close
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
