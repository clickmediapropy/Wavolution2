import { useState } from "react";
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

export function InboxPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();

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

  const sendMessage = useMutation(api.conversations.sendMessage);
  const markRead = useMutation(api.conversations.markRead);
  const markUnread = useMutation(api.conversations.markUnread);
  const archiveConv = useMutation(api.conversations.archive);
  const toggleMode = useMutation(api.conversations.toggleMode);

  const generateDraft = useAction(api.ai.generateMessageDraft);

  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiIntent, setAiIntent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

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

  // Auto-mark as read when selecting a conversation
  const handleSelectConversation = async (id: string) => {
    navigate(`/inbox/${id}`);
    const conv = conversations?.find((c) => c._id === id);
    if (conv && conv.unreadCount > 0) {
      await markRead({ id: id as Id<"conversations"> });
    }
  };

  const handleSend = async () => {
    if (!conversationId || !messageInput.trim()) return;
    setIsSending(true);
    try {
      await sendMessage({
        conversationId: conversationId as Id<"conversations">,
        message: messageInput.trim(),
      });
      setMessageInput("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send message",
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
              filteredConversations?.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => handleSelectConversation(conv._id)}
                  className={`w-full text-left p-3 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors ${
                    conversationId === conv._id ? "bg-zinc-800" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
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
                      <p className="text-xs text-zinc-500 truncate mt-0.5">
                        {conv.lastMessageDirection === "outbound" && (
                          <span className="text-zinc-600">You: </span>
                        )}
                        {conv.lastMessageText || "No messages yet"}
                      </p>
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
              ))
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
                  messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`flex ${
                        msg.direction === "incoming" ? "justify-start" : "justify-end"
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
                            {new Date(msg._creationTime).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                          {msg.direction === "outgoing" && (
                            <span className="text-[10px]">
                              {msg.status === "read"
                                ? "✓✓"
                                : msg.status === "delivered"
                                  ? "✓✓"
                                  : msg.status === "sent"
                                    ? "✓"
                                    : msg.status === "failed"
                                      ? "✗"
                                      : "⏳"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat input */}
              <div className="p-3 border-t border-zinc-800">
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      rows={1}
                      className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none resize-none"
                    />
                  </div>
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
                    className="p-2.5 text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send message"
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
