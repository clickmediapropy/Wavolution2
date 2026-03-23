import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Inbox,
  Loader2,
  MessageSquare,
  Search,
  Send,
  Bot,
  User,
  Archive,
  MailOpen,
  Mail,
  Sparkles,
  ArrowLeft,
  StickyNote,
  Zap,
  Image as ImageIcon,
  FileText,
  Film,
  X,
  CheckSquare,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";

function formatTimeAgo(timestamp: number): string {
  const delta = Date.now() - timestamp;
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function isTypingRecently(typingAt: number | undefined): boolean {
  if (!typingAt) return false;
  return Date.now() - typingAt < 30_000;
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:300ms]" />
    </span>
  );
}

function MediaPreview({
  mediaStorageId,
  mediaType,
}: {
  mediaStorageId: Id<"_storage">;
  mediaType: string | undefined;
}) {
  const url = useQuery(api.storage.getFileUrl, { storageId: mediaStorageId });
  const [enlarged, setEnlarged] = useState(false);

  if (!url) return null;

  if (mediaType === "image") {
    return (
      <>
        <img
          src={url}
          alt="Shared image"
          className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity mb-1"
          style={{ maxHeight: 200 }}
          onClick={() => setEnlarged(true)}
        />
        {enlarged && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
            onClick={() => setEnlarged(false)}
          >
            <img
              src={url}
              alt="Enlarged image"
              className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl"
            />
          </div>
        )}
      </>
    );
  }

  if (mediaType === "video") {
    return (
      <video
        src={url}
        controls
        className="max-w-full rounded-lg mb-1"
        style={{ maxHeight: 200 }}
      />
    );
  }

  // Document / audio / other
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 bg-zinc-700/50 rounded-lg hover:bg-zinc-700 transition-colors mb-1"
    >
      <FileText className="w-4 h-4 flex-shrink-0" />
      <span className="text-xs truncate">
        {mediaType === "audio" ? "Audio file" : "Document"}
      </span>
    </a>
  );
}

export function InboxPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversations = useQuery(api.conversations.list, { archived: false });
  const selectedConversation = useQuery(
    api.conversations.get,
    conversationId
      ? { id: conversationId as Id<"conversations"> }
      : "skip",
  );
  const messages = useQuery(
    api.conversations.getMessages,
    conversationId
      ? { conversationId: conversationId as Id<"conversations"> }
      : "skip",
  );
  const quickReplies = useQuery(api.quickReplies.list);

  const sendMessage = useMutation(api.conversations.sendMessage);
  const addNote = useMutation(api.conversations.addNote);
  const markRead = useMutation(api.conversations.markRead);
  const markUnread = useMutation(api.conversations.markUnread);
  const archiveConv = useMutation(api.conversations.archive);
  const bulkArchive = useMutation(api.conversations.bulkArchive);
  const bulkMarkRead = useMutation(api.conversations.bulkMarkRead);
  const toggleMode = useMutation(api.conversations.toggleMode);

  const generateDraft = useAction(api.ai.generateMessageDraft);

  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiIntent, setAiIntent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [selectedConvIds, setSelectedConvIds] = useState<Set<string>>(
    new Set(),
  );

  const quickReplyRef = useRef<HTMLDivElement>(null);

  // Close quick reply popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        quickReplyRef.current &&
        !quickReplyRef.current.contains(e.target as Node)
      ) {
        setShowQuickReplies(false);
      }
    }
    if (showQuickReplies) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showQuickReplies]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filter conversations by search
  const filteredConversations = conversations?.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.contactName?.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.lastMessageText?.toLowerCase().includes(q)
    );
  });

  const hasSelection = selectedConvIds.size > 0;

  // Auto-mark as read when selecting a conversation
  const handleSelectConversation = async (id: string) => {
    navigate(`/inbox/${id}`);
    const conv = conversations?.find((c) => c._id === id);
    if (conv && conv.unreadCount > 0) {
      await markRead({ id: id as Id<"conversations"> });
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedConvIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSend = async () => {
    if (!conversationId || !messageInput.trim()) return;
    setIsSending(true);
    try {
      if (isNoteMode) {
        await addNote({
          conversationId: conversationId as Id<"conversations">,
          noteText: messageInput.trim(),
        });
        toast.success("Note added");
      } else {
        await sendMessage({
          conversationId: conversationId as Id<"conversations">,
          message: messageInput.trim(),
        });
      }
      setMessageInput("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send",
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBulkArchive = async () => {
    const ids = Array.from(selectedConvIds) as Id<"conversations">[];
    try {
      const result = await bulkArchive({ conversationIds: ids });
      toast.success(`${result.archived} conversation(s) archived`);
      setSelectedConvIds(new Set());
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Bulk archive failed",
      );
    }
  };

  const handleBulkMarkRead = async () => {
    const ids = Array.from(selectedConvIds) as Id<"conversations">[];
    try {
      const result = await bulkMarkRead({ conversationIds: ids });
      toast.success(`${result.marked} conversation(s) marked as read`);
      setSelectedConvIds(new Set());
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Bulk mark read failed",
      );
    }
  };

  // Loading state
  if (conversations === undefined) {
    return (
      <div role="status" className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Inbox className="w-7 h-7 text-emerald-500" />
        <h1 className="text-2xl font-bold text-zinc-100">Inbox</h1>
        {conversations.length > 0 && (
          <span className="text-sm text-zinc-500">
            {conversations.filter((c) => c.unreadCount > 0).length} unread
          </span>
        )}
      </div>

      <div className="flex gap-4 h-[calc(100%-3rem)]">
        {/* Left panel — Conversation list */}
        <div className="w-80 flex-shrink-0 bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-zinc-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations && filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <MessageSquare className="w-8 h-8 mb-2" />
                <p className="text-sm">No conversations</p>
              </div>
            ) : (
              filteredConversations?.map((conv) => {
                const typing = isTypingRecently(conv.contactTypingAt);
                return (
                  <button
                    key={conv._id}
                    onClick={() => handleSelectConversation(conv._id)}
                    className={`w-full text-left p-3 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors ${
                      conversationId === conv._id ? "bg-zinc-800" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {/* Checkbox for bulk selection */}
                      <div
                        className="flex-shrink-0 mt-0.5"
                        onClick={(e) => handleToggleSelect(conv._id, e)}
                      >
                        {selectedConvIds.has(conv._id) ? (
                          <CheckSquare className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-600 hover:text-zinc-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm truncate ${
                              conv.unreadCount > 0
                                ? "font-bold text-zinc-100"
                                : "font-medium text-zinc-300"
                            }`}
                          >
                            {conv.contactName || conv.phone}
                          </span>
                          {conv.status === "bot" && (
                            <Bot className="w-3 h-3 text-violet-400 flex-shrink-0" />
                          )}
                        </div>
                        {typing ? (
                          <p className="text-xs text-emerald-400 mt-0.5 flex items-center gap-1.5">
                            typing <TypingDots />
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-500 truncate mt-0.5">
                            {conv.lastMessageDirection === "outbound" && (
                              <span className="text-zinc-600">You: </span>
                            )}
                            {conv.lastMessageText || "No messages yet"}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-zinc-600">
                            {formatTimeAgo(conv.lastMessageAt)}
                          </span>
                        )}
                        {conv.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-emerald-500 rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Center panel — Chat thread */}
        <div className="flex-1 bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col overflow-hidden">
          {conversationId && selectedConversation ? (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate("/inbox")}
                    className="lg:hidden p-1 text-zinc-400 hover:text-zinc-200"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">
                      {selectedConversation.contactName ||
                        selectedConversation.phone}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {selectedConversation.phone}
                      {isTypingRecently(
                        selectedConversation.contactTypingAt,
                      ) && (
                        <span className="ml-2 text-emerald-400 inline-flex items-center gap-1">
                          typing <TypingDots />
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Bot/Human toggle */}
                  <button
                    onClick={async () => {
                      const newMode = await toggleMode({
                        id: conversationId as Id<"conversations">,
                      });
                      toast.success(
                        `Switched to ${newMode === "bot" ? "AI auto-reply" : "manual"} mode`,
                      );
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedConversation.status === "bot"
                        ? "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    }`}
                    title={
                      selectedConversation.status === "bot"
                        ? "AI auto-reply active"
                        : "Manual mode"
                    }
                  >
                    {selectedConversation.status === "bot" ? (
                      <>
                        <Bot className="w-3.5 h-3.5" /> AI
                      </>
                    ) : (
                      <>
                        <User className="w-3.5 h-3.5" /> Manual
                      </>
                    )}
                  </button>
                  {/* Archive */}
                  <button
                    onClick={async () => {
                      await archiveConv({
                        id: conversationId as Id<"conversations">,
                      });
                      navigate("/inbox");
                      toast.success("Conversation archived");
                    }}
                    className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  {/* Mark unread */}
                  <button
                    onClick={async () => {
                      await markUnread({
                        id: conversationId as Id<"conversations">,
                      });
                      toast.success("Marked as unread");
                    }}
                    className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                    title="Mark unread"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages === undefined ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                    <MessageSquare className="w-8 h-8 mb-2" />
                    <p className="text-sm">No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    // Internal note styling
                    if (msg.isNote) {
                      return (
                        <div key={msg._id} className="flex justify-end">
                          <div className="max-w-[70%] rounded-2xl px-4 py-2.5 bg-amber-500/10 border border-amber-500/20">
                            <div className="flex items-center gap-1 mb-1">
                              <StickyNote className="w-3 h-3 text-amber-400" />
                              <span className="text-[10px] text-amber-400 font-medium">
                                Note
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap text-amber-200">
                              {msg.message}
                            </p>
                            <div className="flex items-center gap-1 mt-1 text-amber-400/50">
                              <span className="text-[10px]">
                                {new Date(
                                  msg._creationTime,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg._id}
                        className={`flex ${
                          msg.direction === "incoming"
                            ? "justify-start"
                            : "justify-end"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                            msg.direction === "incoming"
                              ? "bg-zinc-800 text-zinc-200"
                              : "bg-emerald-600 text-white"
                          }`}
                        >
                          {msg.sentBy === "bot" && (
                            <div className="flex items-center gap-1 mb-1">
                              <Bot className="w-3 h-3 text-violet-300" />
                              <span className="text-[10px] text-violet-300 font-medium">
                                AI
                              </span>
                            </div>
                          )}
                          {/* Media preview */}
                          {msg.mediaStorageId && (
                            <MediaPreview
                              mediaStorageId={msg.mediaStorageId}
                              mediaType={msg.mediaType}
                            />
                          )}
                          <p className="text-sm whitespace-pre-wrap">
                            {msg.message}
                          </p>
                          <div
                            className={`flex items-center gap-1 mt-1 ${
                              msg.direction === "incoming"
                                ? "text-zinc-500"
                                : "text-emerald-200/70"
                            }`}
                          >
                            <span className="text-[10px]">
                              {new Date(
                                msg._creationTime,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {msg.direction === "outgoing" && (
                              <span className="text-[10px]">
                                {msg.status === "read"
                                  ? "\u2713\u2713"
                                  : msg.status === "delivered"
                                    ? "\u2713\u2713"
                                    : msg.status === "sent"
                                      ? "\u2713"
                                      : msg.status === "failed"
                                        ? "\u2717"
                                        : "\u231B"}
                              </span>
                            )}
                            {msg.mediaType && (
                              <span className="text-[10px] ml-1 flex items-center gap-0.5">
                                {msg.mediaType === "image" && (
                                  <ImageIcon className="w-2.5 h-2.5" />
                                )}
                                {msg.mediaType === "video" && (
                                  <Film className="w-2.5 h-2.5" />
                                )}
                                {msg.mediaType === "document" && (
                                  <FileText className="w-2.5 h-2.5" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {/* Typing indicator in chat */}
                {selectedConversation &&
                  isTypingRecently(selectedConversation.contactTypingAt) && (
                    <div className="flex justify-start">
                      <div className="bg-zinc-800 rounded-2xl px-4 py-3">
                        <TypingDots />
                      </div>
                    </div>
                  )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat input */}
              <div className="p-3 border-t border-zinc-800">
                {/* Note mode indicator */}
                {isNoteMode && (
                  <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <StickyNote className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs text-amber-400 font-medium">
                      Internal note mode — will not be sent via WhatsApp
                    </span>
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        isNoteMode
                          ? "Write an internal note..."
                          : "Type a message..."
                      }
                      rows={1}
                      className={`w-full px-4 py-2.5 border text-zinc-100 placeholder:text-zinc-500 rounded-xl text-sm focus:ring-2 outline-none resize-none ${
                        isNoteMode
                          ? "bg-amber-500/5 border-amber-500/30 focus:ring-amber-500/50 focus:border-amber-500"
                          : "bg-zinc-800 border-zinc-700 focus:ring-emerald-500/50 focus:border-emerald-500"
                      }`}
                    />
                  </div>
                  {/* Quick replies button */}
                  <div className="relative" ref={quickReplyRef}>
                    <button
                      onClick={() => setShowQuickReplies(!showQuickReplies)}
                      className="p-2.5 text-zinc-400 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
                      title="Quick replies"
                      aria-label="Quick replies"
                    >
                      <Zap className="w-5 h-5" />
                    </button>
                    {showQuickReplies && (
                      <div className="absolute bottom-12 right-0 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-10">
                        <div className="px-3 py-2 border-b border-zinc-800 text-xs font-medium text-zinc-400">
                          Quick Replies
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {quickReplies && quickReplies.length > 0 ? (
                            quickReplies.map((qr) => (
                              <button
                                key={qr._id}
                                onClick={() => {
                                  setMessageInput(qr.text);
                                  setShowQuickReplies(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 last:border-b-0"
                              >
                                <p className="text-sm font-medium text-zinc-200 truncate">
                                  {qr.shortcut}
                                </p>
                                <p className="text-xs text-zinc-500 truncate">
                                  {qr.text}
                                </p>
                              </button>
                            ))
                          ) : (
                            <p className="px-3 py-4 text-xs text-zinc-500 text-center">
                              No quick replies yet
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Note toggle button */}
                  <button
                    onClick={() => setIsNoteMode(!isNoteMode)}
                    className={`p-2.5 rounded-xl transition-colors ${
                      isNoteMode
                        ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                        : "text-zinc-400 bg-zinc-800 hover:bg-zinc-700"
                    }`}
                    title={isNoteMode ? "Switch to message" : "Switch to note"}
                    aria-label={
                      isNoteMode ? "Switch to message" : "Switch to note"
                    }
                  >
                    <StickyNote className="w-5 h-5" />
                  </button>
                  {/* Generate with AI button */}
                  <button
                    onClick={() => setShowAiModal(true)}
                    className="p-2.5 text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 rounded-xl transition-colors"
                    title="Generate with AI"
                    aria-label="Generate with AI"
                  >
                    <Sparkles className="w-5 h-5" />
                  </button>
                  {/* Send button */}
                  <button
                    onClick={handleSend}
                    disabled={!messageInput.trim() || isSending}
                    className={`p-2.5 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isNoteMode
                        ? "bg-amber-600 hover:bg-amber-500"
                        : "bg-emerald-600 hover:bg-emerald-500"
                    }`}
                    aria-label={isNoteMode ? "Save note" : "Send message"}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <MailOpen className="w-12 h-12 mb-3" />
              <p className="text-lg font-medium text-zinc-400">
                Select a conversation
              </p>
              <p className="text-sm mt-1">
                Choose a conversation from the list to start chatting
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {hasSelection && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 bg-zinc-800 border border-zinc-700 rounded-2xl shadow-2xl">
          <span className="text-sm text-zinc-300 font-medium">
            {selectedConvIds.size} selected
          </span>
          <div className="w-px h-5 bg-zinc-700" />
          <button
            onClick={handleBulkArchive}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-200 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
          >
            <Archive className="w-3.5 h-3.5" />
            Archive All
          </button>
          <button
            onClick={handleBulkMarkRead}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-200 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
          >
            <MailOpen className="w-3.5 h-3.5" />
            Mark Read
          </button>
          <button
            onClick={() => setSelectedConvIds(new Set())}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Generate with AI Modal */}
      {showAiModal && conversationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <h3 className="text-lg font-semibold text-zinc-100">
                Generate with AI
              </h3>
            </div>

            <p className="text-sm text-zinc-400 mb-3">
              Describe what you want to say and AI will draft a message.
            </p>

            <textarea
              value={aiIntent}
              onChange={(e) => setAiIntent(e.target.value)}
              placeholder="e.g. Ask about their interest in the product, offer a 10% discount..."
              rows={3}
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none resize-none mb-4"
              autoFocus
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAiModal(false);
                  setAiIntent("");
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!aiIntent.trim()) return;
                  setIsGenerating(true);
                  try {
                    const draft = await generateDraft({
                      conversationId:
                        conversationId as Id<"conversations">,
                      intent: aiIntent.trim(),
                    });
                    setMessageInput(draft);
                    setShowAiModal(false);
                    setAiIntent("");
                    toast.success("Draft generated — review and send");
                  } catch (err) {
                    toast.error(
                      err instanceof Error
                        ? err.message
                        : "Failed to generate",
                    );
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                disabled={!aiIntent.trim() || isGenerating}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-xl hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
