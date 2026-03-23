import { useState, useMemo } from "react";
import { Search, FileCode2, ChevronDown, ChevronRight } from "lucide-react";

type FunctionType = "query" | "mutation" | "action" | "internalQuery" | "internalMutation" | "internalAction" | "httpAction";

interface FunctionDoc {
  name: string;
  type: FunctionType;
  args: string;
  description: string;
}

interface FileGroup {
  file: string;
  label: string;
  description: string;
  functions: FunctionDoc[];
}

const API_GROUPS: FileGroup[] = [
  {
    file: "contacts.ts",
    label: "Contacts",
    description: "Contact CRUD, search, CSV import, tags, custom fields, and CRM features",
    functions: [
      { name: "count", type: "query", args: "{}", description: "Count contacts for current user" },
      { name: "countThisWeek", type: "query", args: "{}", description: "Count contacts added in the last 7 days" },
      { name: "list", type: "query", args: "{ paginationOpts }", description: "Paginated contact list (newest first)" },
      { name: "search", type: "query", args: "{ term: string }", description: "Search contacts by first name using full-text search index" },
      { name: "add", type: "mutation", args: "{ phone: string, firstName?: string, lastName?: string }", description: "Add a new contact (enforces unique phone per user)" },
      { name: "update", type: "mutation", args: "{ id: Id<contacts>, phone: string, firstName?: string, lastName?: string }", description: "Update an existing contact (verify ownership, check phone uniqueness if changed)" },
      { name: "remove", type: "mutation", args: "{ id: Id<contacts> }", description: "Delete a single contact (verify ownership)" },
      { name: "removeMultiple", type: "mutation", args: "{ ids: Id<contacts>[] }", description: "Bulk delete contacts (verify ownership, max 100)" },
      { name: "exportAll", type: "query", args: "{}", description: "Export all contacts for current user (capped at 10k)" },
      { name: "addTag", type: "mutation", args: "{ contactId: Id<contacts>, tag: string }", description: "Add a tag to a contact" },
      { name: "removeTag", type: "mutation", args: "{ contactId: Id<contacts>, tag: string }", description: "Remove a tag from a contact" },
      { name: "setCustomField", type: "mutation", args: "{ contactId: Id<contacts>, key: string, value: string | number | boolean }", description: "Set a custom field on a contact" },
      { name: "removeCustomField", type: "mutation", args: "{ contactId: Id<contacts>, key: string }", description: "Remove a custom field from a contact" },
      { name: "getDetail", type: "query", args: "{ contactId: Id<contacts> }", description: "Get detailed contact info including conversation and recent messages" },
      { name: "listByTag", type: "query", args: "{ tag: string }", description: "List contacts filtered by tag" },
      { name: "listByStage", type: "query", args: "{ stageId: Id<pipelineStages> }", description: "List contacts filtered by pipeline stage" },
      { name: "importBatch", type: "mutation", args: "{ contacts: { phone, firstName?, lastName? }[] }", description: "Import a batch of contacts from CSV (max 100 per call)" },
      { name: "segmentCounts", type: "query", args: "{}", description: "Compute counts for all predefined segments in one query" },
      { name: "block", type: "mutation", args: "{ contactId: Id<contacts> }", description: "Block a contact" },
      { name: "unblock", type: "mutation", args: "{ contactId: Id<contacts> }", description: "Unblock a contact" },
    ],
  },
  {
    file: "conversations.ts",
    label: "Conversations",
    description: "Inbox conversations, messages, read/archive state, and bot/human toggling",
    functions: [
      { name: "list", type: "query", args: "{ archived?: boolean }", description: "List conversations for inbox (newest first, bounded)" },
      { name: "get", type: "query", args: "{ id: Id<conversations> }", description: "Get a single conversation by ID (verify ownership)" },
      { name: "getMessages", type: "query", args: "{ conversationId: Id<conversations> }", description: "Get messages for a conversation (oldest first for chat display)" },
      { name: "inboxCounts", type: "query", args: "{}", description: "Get inbox counts (unread, total open, archived)" },
      { name: "markRead", type: "mutation", args: "{ id: Id<conversations> }", description: "Mark a conversation as read" },
      { name: "markUnread", type: "mutation", args: "{ id: Id<conversations> }", description: "Mark a conversation as unread" },
      { name: "archive", type: "mutation", args: "{ id: Id<conversations> }", description: "Archive a conversation" },
      { name: "unarchive", type: "mutation", args: "{ id: Id<conversations> }", description: "Unarchive a conversation" },
      { name: "toggleMode", type: "mutation", args: "{ id: Id<conversations> }", description: "Toggle bot/human mode for a conversation" },
      { name: "sendMessage", type: "mutation", args: "{ conversationId: Id<conversations>, message: string, mediaStorageId?: Id<_storage>, mediaType?: string }", description: "Send a message from the inbox (human agent), with optional media" },
      { name: "addNote", type: "mutation", args: "{ conversationId: Id<conversations>, noteText: string }", description: "Add an internal note to a conversation (not sent via WhatsApp)" },
      { name: "bulkArchive", type: "mutation", args: "{ conversationIds: Id<conversations>[] }", description: "Bulk archive conversations (max 50)" },
      { name: "bulkMarkRead", type: "mutation", args: "{ conversationIds: Id<conversations>[] }", description: "Bulk mark conversations as read (max 50)" },
      { name: "findOrCreate", type: "internalMutation", args: "{ userId, instanceId?, phone, contactName?, initialStatus? }", description: "Find or create a conversation for a phone + instance + user" },
      { name: "updateOnNewMessage", type: "internalMutation", args: "{ conversationId, messageText, direction, isIncoming }", description: "Update conversation after a new message (denormalized fields)" },
      { name: "getByPhone", type: "internalQuery", args: "{ userId, phone }", description: "Get conversation by phone (internal, no auth)" },
      { name: "sendViaEvolution", type: "internalAction", args: "{ messageId, instanceName, phone, text, mediaUrl?, mediaType? }", description: "Send a message via Evolution API (scheduled by sendMessage mutation)" },
      { name: "updateMessageSendStatus", type: "internalMutation", args: "{ messageId, status, whatsappMessageId? }", description: "Update message status after send attempt" },
      { name: "updateTyping", type: "internalMutation", args: "{ conversationId, typing: boolean }", description: "Update typing indicator for a conversation (called from webhook)" },
    ],
  },
  {
    file: "campaigns.ts",
    label: "Campaigns",
    description: "Campaign lifecycle: create, start, pause, resume, stop, and status tracking",
    functions: [
      { name: "create", type: "mutation", args: "{ name, instanceId?, recipientType, selectedContactIds?, messageTemplate, hasMedia, mediaStorageIds?, delay, total, scheduledAt? }", description: "Create a new campaign in draft status" },
      { name: "start", type: "mutation", args: "{ id: Id<campaigns> }", description: "Start a draft campaign (sets status to running)" },
      { name: "stop", type: "mutation", args: "{ id: Id<campaigns> }", description: "Stop a running or paused campaign" },
      { name: "pause", type: "mutation", args: "{ id: Id<campaigns> }", description: "Pause a running campaign" },
      { name: "resume", type: "mutation", args: "{ id: Id<campaigns> }", description: "Resume a paused campaign" },
      { name: "getStatus", type: "query", args: "{ id: Id<campaigns> }", description: "Get a single campaign by ID (verify ownership)" },
      { name: "listByUser", type: "query", args: "{}", description: "List campaigns for current user (newest first, bounded)" },
    ],
  },
  {
    file: "campaignWorker.ts",
    label: "Campaign Worker",
    description: "Internal campaign processing engine: batch sending, success/failure recording",
    functions: [
      { name: "getCampaignState", type: "internalQuery", args: "{ campaignId: Id<campaigns> }", description: "Get campaign state for the worker" },
      { name: "getInstance", type: "internalQuery", args: "{ instanceId: Id<instances> }", description: "Get instance info for Evolution API call" },
      { name: "getFileUrl", type: "internalQuery", args: "{ storageId: Id<_storage> }", description: "Get file URL for campaign media" },
      { name: "getUnprocessedContacts", type: "internalQuery", args: "{ campaignId: Id<campaigns> }", description: "Get next batch of unprocessed contacts (batch size: 20)" },
      { name: "recordSuccess", type: "internalMutation", args: "{ campaignId, userId, instanceId?, phone, message, whatsappMessageId? }", description: "Record a successful message send and update campaign counters" },
      { name: "recordFailure", type: "internalMutation", args: "{ campaignId, userId, instanceId?, phone, message, error }", description: "Record a failed message send and update campaign counters" },
      { name: "completeCampaign", type: "internalMutation", args: "{ campaignId: Id<campaigns> }", description: "Mark a campaign as completed" },
      { name: "processBatch", type: "internalAction", args: "{ campaignId: Id<campaigns> }", description: "Main worker action: process a batch of contacts and send messages" },
    ],
  },
  {
    file: "messages.ts",
    label: "Messages",
    description: "Message logging, counting, search, and analytics dashboard stats",
    functions: [
      { name: "count", type: "query", args: "{}", description: "Count messages for current user" },
      { name: "countToday", type: "query", args: "{}", description: "Count messages sent today" },
      { name: "logMessage", type: "mutation", args: "{ phone, message, status, instanceId?, campaignId? }", description: "Log a sent message" },
      { name: "countRecent", type: "query", args: "{ minutes: number }", description: "Count messages sent in the last N minutes (for rate limiting)" },
      { name: "list", type: "query", args: "{ paginationOpts }", description: "List messages for current user (newest first)" },
      { name: "dashboardStats", type: "query", args: "{}", description: "Dashboard stats: delivery rate, open rate, failure rate, avg response time" },
      { name: "dailyCounts", type: "query", args: "{}", description: "Daily message counts for the last 7 days (for sparkline charts)" },
      { name: "contactDailyCounts", type: "query", args: "{}", description: "Daily contact additions for the last 7 days (for sparkline charts)" },
      { name: "successRate", type: "query", args: "{}", description: "Message success rate for connection health (last 100 messages)" },
      { name: "searchMessages", type: "query", args: "{ query: string }", description: "Full-text search messages by content" },
    ],
  },
  {
    file: "evolution.ts",
    label: "Evolution API",
    description: "WhatsApp integration via Evolution API: instance management, messaging, webhooks",
    functions: [
      { name: "createInstance", type: "action", args: "{ instanceName: string }", description: "Create a new Evolution API instance and store it in the instances table" },
      { name: "getQrCode", type: "action", args: "{ instanceName: string }", description: "Get QR code for connecting WhatsApp" },
      { name: "checkConnectionStatus", type: "action", args: "{ instanceName, instanceId: Id<instances> }", description: "Check if WhatsApp is connected and update the instances table" },
      { name: "sendText", type: "action", args: "{ instanceName, phone, message }", description: "Send a text message via WhatsApp" },
      { name: "sendMedia", type: "action", args: "{ instanceName, phone, storageId, mediaType, caption?, fileName? }", description: "Send a media message (image/video/document/audio)" },
      { name: "deleteInstance", type: "action", args: "{ instanceName, instanceId: Id<instances> }", description: "Delete an instance from Evolution API and remove from instances table" },
      { name: "checkNumbers", type: "action", args: "{ instanceName, numbers: string[] }", description: "Check which phone numbers have WhatsApp accounts (max 200)" },
      { name: "registerWebhook", type: "action", args: "{ instanceName: string }", description: "Register webhook on Evolution API instance to send events to Convex" },
    ],
  },
  {
    file: "instances.ts",
    label: "Instances",
    description: "WhatsApp instance CRUD, connection state, bot settings, and detailed status",
    functions: [
      { name: "list", type: "query", args: "{}", description: "List all instances for the current user" },
      { name: "get", type: "query", args: "{ id: Id<instances> }", description: "Get a single instance (verify ownership)" },
      { name: "listConnected", type: "query", args: "{}", description: "List only connected instances for the current user" },
      { name: "count", type: "query", args: "{}", description: "Count instances for dashboard (total + connected)" },
      { name: "lastDisconnection", type: "query", args: "{}", description: "Get the most recent disconnection timestamp for any user instance" },
      { name: "create", type: "mutation", args: "{ name: string, apiKey?: string }", description: "Create a new instance record (called after API call)" },
      { name: "updateState", type: "mutation", args: "{ id, whatsappConnected?, whatsappNumber?, connectionStatus?, apiKey? }", description: "Update instance connection state" },
      { name: "updateBotSettings", type: "mutation", args: "{ id, botEnabled?, botSystemPrompt?, temperature?, welcomeMessage?, fallbackMessage? }", description: "Update bot settings for an instance" },
      { name: "remove", type: "mutation", args: "{ id: Id<instances> }", description: "Remove an instance record" },
      { name: "getDetailedStatus", type: "query", args: "{}", description: "Detailed status for all instances (WhatsApp Status page)" },
    ],
  },
  {
    file: "pipeline.ts",
    label: "Pipeline",
    description: "CRM sales pipeline: stages management and contact movement between stages",
    functions: [
      { name: "listStages", type: "query", args: "{}", description: "List all pipeline stages for the current user, ordered by position" },
      { name: "createStage", type: "mutation", args: "{ name: string, color?: string, position: number }", description: "Create a new pipeline stage" },
      { name: "updateStage", type: "mutation", args: "{ id: Id<pipelineStages>, name?, color?, position? }", description: "Update a pipeline stage (rename, recolor, reposition)" },
      { name: "deleteStage", type: "mutation", args: "{ id: Id<pipelineStages>, reassignToStageId?: Id<pipelineStages> }", description: "Delete a pipeline stage and optionally reassign contacts" },
      { name: "moveContact", type: "mutation", args: "{ contactId: Id<contacts>, stageId?: Id<pipelineStages> }", description: "Move a contact to a different pipeline stage" },
    ],
  },
  {
    file: "ai.ts",
    label: "AI",
    description: "AI-powered features: message drafts, auto-reply bot, conversation summaries",
    functions: [
      { name: "generateMessageDraft", type: "action", args: "{ conversationId: Id<conversations>, intent: string }", description: "Generate a message draft for a human agent using OpenRouter" },
      { name: "generateAutoReply", type: "internalAction", args: "{ conversationId, inboundMessageId, userId, instanceName, phone, systemPrompt }", description: "Auto-reply bot for incoming messages (checks bot goals + knowledge base)" },
      { name: "generateAiSummary", type: "action", args: "{ conversationId: Id<conversations> }", description: "Generate AI summary for a contact's conversation" },
      { name: "updateContactSummary", type: "internalMutation", args: "{ contactId: Id<contacts>, summary: string }", description: "Update contact AI summary" },
      { name: "logBotMessage", type: "internalMutation", args: "{ userId, conversationId, instanceId?, phone, message, whatsappMessageId? }", description: "Log a bot-sent message and update conversation" },
    ],
  },
  {
    file: "botGoals.ts",
    label: "Bot Goals",
    description: "Keyword-triggered bot message flows with multi-step sequences",
    functions: [
      { name: "list", type: "query", args: "{}", description: "List all bot goals for the current user" },
      { name: "create", type: "mutation", args: "{ name, triggerKeywords: string[], steps: { message, delayMs? }[], isActive: boolean }", description: "Create a new bot goal" },
      { name: "update", type: "mutation", args: "{ id: Id<botGoals>, name?, triggerKeywords?, steps?, isActive?, position? }", description: "Update an existing bot goal" },
      { name: "remove", type: "mutation", args: "{ id: Id<botGoals> }", description: "Delete a bot goal" },
      { name: "findMatchingGoals", type: "internalQuery", args: "{ userId, messageText: string }", description: "Find matching goals for an inbound message by keyword" },
    ],
  },
  {
    file: "knowledgeBase.ts",
    label: "Knowledge Base",
    description: "Knowledge base entries for RAG-powered bot context",
    functions: [
      { name: "list", type: "query", args: "{}", description: "List all knowledge base entries for the current user" },
      { name: "create", type: "mutation", args: "{ title: string, content: string, category?: string }", description: "Create a new knowledge base entry" },
      { name: "update", type: "mutation", args: "{ id: Id<knowledgeBaseEntries>, title?, content?, category? }", description: "Update a knowledge base entry" },
      { name: "remove", type: "mutation", args: "{ id: Id<knowledgeBaseEntries> }", description: "Delete a knowledge base entry" },
      { name: "searchContext", type: "internalQuery", args: "{ userId, queryText: string, maxSnippets?: number }", description: "Keyword-based search across KB entries for bot context" },
    ],
  },
  {
    file: "quickReplies.ts",
    label: "Quick Replies",
    description: "Reusable message templates with shortcut triggers",
    functions: [
      { name: "list", type: "query", args: "{}", description: "List all quick reply templates for the current user" },
      { name: "create", type: "mutation", args: "{ shortcut: string, text: string, category?: string }", description: "Create a quick reply template" },
      { name: "update", type: "mutation", args: "{ id: Id<quickReplies>, shortcut?, text?, category? }", description: "Update a quick reply template" },
      { name: "remove", type: "mutation", args: "{ id: Id<quickReplies> }", description: "Delete a quick reply template" },
    ],
  },
  {
    file: "exports.ts",
    label: "Exports",
    description: "CSV export for contacts, messages, and campaign messages",
    functions: [
      { name: "exportContacts", type: "query", args: "{}", description: "Export contacts as CSV string" },
      { name: "exportMessages", type: "query", args: "{}", description: "Export messages as CSV string" },
      { name: "exportCampaignMessages", type: "query", args: "{ campaignId: Id<campaigns> }", description: "Export messages for a specific campaign as CSV string" },
    ],
  },
  {
    file: "activityLog.ts",
    label: "Activity Log",
    description: "Activity event logging and recent activity feed",
    functions: [
      { name: "logActivity", type: "internalMutation", args: "{ userId, type: string, description: string, metadata? }", description: "Log an activity event (internal, called from other functions)" },
      { name: "listRecent", type: "query", args: "{ limit?: number }", description: "Returns the most recent activity for the authenticated user" },
    ],
  },
  {
    file: "storage.ts",
    label: "Storage",
    description: "File upload and serving URL generation",
    functions: [
      { name: "generateUploadUrl", type: "mutation", args: "{}", description: "Generate a signed upload URL (auth-protected)" },
      { name: "getFileUrl", type: "query", args: "{ storageId: Id<_storage> }", description: "Get a serving URL for a stored file" },
    ],
  },
  {
    file: "users.ts",
    label: "Users",
    description: "User profile queries",
    functions: [
      { name: "currentUser", type: "query", args: "{}", description: "Get current authenticated user's profile" },
    ],
  },
  {
    file: "webhooks.ts",
    label: "Webhooks",
    description: "Evolution API webhook handler: incoming messages, status updates, connection events",
    functions: [
      { name: "handleEvolutionWebhook", type: "httpAction", args: "POST /webhooks/evolution", description: "Receives Evolution API webhook events (messages, connection updates, typing)" },
      { name: "getInstanceByName", type: "internalQuery", args: "{ name: string }", description: "Look up instance by name" },
      { name: "isContactBlocked", type: "internalQuery", args: "{ userId, phone }", description: "Check if a contact is blocked" },
      { name: "getConversationByPhone", type: "internalQuery", args: "{ userId, phone }", description: "Get conversation by phone number" },
      { name: "updateMessageStatus", type: "internalMutation", args: "{ whatsappMessageId, whatsappStatus }", description: "Update message delivery/read status from webhook" },
      { name: "logIncomingMessage", type: "internalMutation", args: "{ instanceId, userId, phone, message, pushName?, whatsappMessageId?, botEnabled, botSystemPrompt?, instanceName }", description: "Log incoming message, create/update conversation, trigger bot if active" },
      { name: "updateConnectionState", type: "internalMutation", args: "{ instanceId, state }", description: "Update instance connection state and log connection event" },
    ],
  },
  {
    file: "scheduler.ts",
    label: "Scheduler",
    description: "Cron-driven campaign scheduler",
    functions: [
      { name: "checkScheduledCampaigns", type: "internalMutation", args: "{}", description: "Check for draft campaigns whose scheduledAt has passed and start them" },
    ],
  },
  {
    file: "migrations.ts",
    label: "Migrations",
    description: "One-time data migrations",
    functions: [
      { name: "migrateContactNames", type: "internalMutation", args: "{}", description: "Split contacts.name into firstName + lastName, clear deprecated name field" },
    ],
  },
];

const TYPE_DESCRIPTIONS: Record<FunctionType, string> = {
  query: "read-only, reactive",
  mutation: "write, transactional",
  action: "side effects (HTTP, AI)",
  internalQuery: "server-only read",
  internalMutation: "server-only write",
  internalAction: "server-only side effects",
  httpAction: "HTTP endpoint",
};

const TYPE_STYLES: Record<FunctionType, { bg: string; text: string }> = {
  query:            { bg: "bg-emerald-500/15 border-emerald-500/30", text: "text-emerald-400" },
  mutation:         { bg: "bg-amber-500/15 border-amber-500/30",    text: "text-amber-400" },
  action:           { bg: "bg-violet-500/15 border-violet-500/30",  text: "text-violet-400" },
  internalQuery:    { bg: "bg-sky-500/15 border-sky-500/30",        text: "text-sky-400" },
  internalMutation: { bg: "bg-orange-500/15 border-orange-500/30",  text: "text-orange-400" },
  internalAction:   { bg: "bg-fuchsia-500/15 border-fuchsia-500/30",text: "text-fuchsia-400" },
  httpAction:       { bg: "bg-rose-500/15 border-rose-500/30",      text: "text-rose-400" },
};

function TypeBadge({ type }: { type: FunctionType }) {
  const style = TYPE_STYLES[type];
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>
      {type}
    </span>
  );
}

export function APIDocsPage() {
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(API_GROUPS.map((g) => g.file)),
  );
  const [typeFilter, setTypeFilter] = useState<FunctionType | "all">("all");

  const toggleGroup = (file: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(file)) {
        next.delete(file);
      } else {
        next.add(file);
      }
      return next;
    });
  };

  const expandAll = () => setExpandedGroups(new Set(API_GROUPS.map((g) => g.file)));
  const collapseAll = () => setExpandedGroups(new Set());

  const filteredGroups = useMemo(() => {
    const q = search.toLowerCase().trim();
    return API_GROUPS.map((group) => {
      const fns = group.functions.filter((fn) => {
        if (typeFilter !== "all" && fn.type !== typeFilter) return false;
        if (!q) return true;
        return (
          fn.name.toLowerCase().includes(q) ||
          fn.description.toLowerCase().includes(q) ||
          fn.args.toLowerCase().includes(q) ||
          fn.type.toLowerCase().includes(q) ||
          group.label.toLowerCase().includes(q)
        );
      });
      return { ...group, functions: fns };
    }).filter((g) => g.functions.length > 0);
  }, [search, typeFilter]);

  const totalFunctions = API_GROUPS.reduce((s, g) => s + g.functions.length, 0);
  const visibleFunctions = filteredGroups.reduce((s, g) => s + g.functions.length, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 ring-1 ring-zinc-700">
            <FileCode2 className="h-5 w-5 text-zinc-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">API Reference</h1>
            <p className="text-sm text-zinc-400">
              {totalFunctions} Convex functions across {API_GROUPS.length} modules
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search functions, args, descriptions..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-500 outline-none ring-zinc-600 transition focus:border-zinc-600 focus:ring-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as FunctionType | "all")}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 outline-none ring-zinc-600 transition focus:border-zinc-600 focus:ring-1"
          >
            <option value="all">All types</option>
            <option value="query">query</option>
            <option value="mutation">mutation</option>
            <option value="action">action</option>
            <option value="internalQuery">internalQuery</option>
            <option value="internalMutation">internalMutation</option>
            <option value="internalAction">internalAction</option>
            <option value="httpAction">httpAction</option>
          </select>
          <button
            onClick={expandAll}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-200"
          >
            Expand all
          </button>
          <button
            onClick={collapseAll}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-200"
          >
            Collapse all
          </button>
        </div>
      </div>

      {(search || typeFilter !== "all") && (
        <p className="text-xs text-zinc-500">
          Showing {visibleFunctions} of {totalFunctions} functions
        </p>
      )}

      <div className="space-y-3">
        {filteredGroups.map((group) => {
          const isExpanded = expandedGroups.has(group.file);
          return (
            <div
              key={group.file}
              className="rounded-xl border border-zinc-800 bg-zinc-900/60"
            >
              <button
                onClick={() => toggleGroup(group.file)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-zinc-800/40"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-200">
                      {group.label}
                    </span>
                    <span className="font-mono text-xs text-zinc-600">
                      {group.file}
                    </span>
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                      {group.functions.length}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {group.description}
                  </p>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-zinc-800">
                  <div className="divide-y divide-zinc-800/60">
                    {group.functions.map((fn) => (
                      <div
                        key={`${group.file}-${fn.name}`}
                        className="px-5 py-3 transition hover:bg-zinc-800/20"
                      >
                        <div className="flex flex-wrap items-start gap-2">
                          <code className="font-mono text-sm font-medium text-zinc-100">
                            {fn.name}
                          </code>
                          <TypeBadge type={fn.type} />
                        </div>
                        <p className="mt-1 text-sm text-zinc-400">
                          {fn.description}
                        </p>
                        <div className="mt-1.5">
                          <code className="font-mono text-xs text-zinc-500">
                            args: {fn.args}
                          </code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredGroups.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-12 text-center">
            <p className="text-zinc-500">No functions match your search.</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Type Legend
        </p>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(TYPE_STYLES) as FunctionType[]).map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <TypeBadge type={type} />
              <span className="text-xs text-zinc-500">
                - {TYPE_DESCRIPTIONS[type]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
