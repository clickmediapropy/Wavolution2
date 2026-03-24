import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const schema = defineSchema({
  // Users: auth fields (from authTables) + app-specific fields
  users: defineTable({
    // Auth fields (must match @convex-dev/auth's expectations)
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // App-specific fields (all optional for forward compatibility)
    evolutionInstanceName: v.optional(v.string()),
    evolutionApiKey: v.optional(v.string()),
    whatsappConnected: v.optional(v.boolean()),
    whatsappNumber: v.optional(v.string()),
    connectionStatus: v.optional(v.string()),
    instanceCreated: v.optional(v.boolean()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  // Remaining auth tables (referenced individually to preserve types)
  authSessions: authTables.authSessions,
  authAccounts: authTables.authAccounts,
  authRefreshTokens: authTables.authRefreshTokens,
  authVerificationCodes: authTables.authVerificationCodes,
  authVerifiers: authTables.authVerifiers,
  authRateLimits: authTables.authRateLimits,

  // WhatsApp instances (one user can have many)
  instances: defineTable({
    userId: v.id("users"),
    name: v.string(), // Evolution API instance name (unique per user)
    apiKey: v.optional(v.string()), // Instance-specific API key from Evolution
    whatsappConnected: v.boolean(),
    whatsappNumber: v.optional(v.string()),
    connectionStatus: v.string(), // pending | open | close | connecting
    // Bot settings
    botEnabled: v.optional(v.boolean()), // whether auto-reply bot is active
    botSystemPrompt: v.optional(v.string()), // system prompt for AI auto-replies
    temperature: v.optional(v.number()), // LLM temperature for bot responses (0-1)
    welcomeMessage: v.optional(v.string()), // first message sent to new conversations
    fallbackMessage: v.optional(v.string()), // reply when bot can't generate a response
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_name", ["userId", "name"])
    .index("by_name", ["name"]),

  // Conversations — groups messages by contact+instance for inbox
  conversations: defineTable({
    userId: v.id("users"),
    instanceId: v.optional(v.id("instances")),
    contactId: v.optional(v.id("contacts")),
    phone: v.string(), // contact phone number
    status: v.string(), // bot | human — controls auto-reply behavior
    unreadCount: v.number(), // denormalized for inbox performance
    hasBeenInteracted: v.boolean(), // once true, never re-enters "new" queue
    isArchived: v.boolean(), // open vs closed
    lastMessageAt: v.optional(v.number()), // timestamp of last message
    lastMessageText: v.optional(v.string()), // preview text for inbox list
    lastMessageDirection: v.optional(v.string()), // inbound | outbound
    contactName: v.optional(v.string()), // denormalized from contact
    contactTypingAt: v.optional(v.number()), // timestamp when contact started typing
    assignedTo: v.optional(v.string()), // label string for conversation assignment
    typingAt: v.optional(v.number()), // timestamp when agent started typing (UI indicator)
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_phone", ["userId", "phone"])
    .index("by_userId_and_instanceId_and_phone", [
      "userId",
      "instanceId",
      "phone",
    ])
    .index("by_userId_and_lastMessageAt", ["userId", "lastMessageAt"])
    .index("by_userId_and_isArchived", ["userId", "isArchived"]),

  // App tables
  contacts: defineTable({
    userId: v.id("users"),
    phone: v.string(),
    name: v.optional(v.string()), // deprecated — kept for backward compat during migration
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    status: v.string(),
    sentAt: v.optional(v.number()),
    // CRM / engagement fields
    tags: v.optional(v.array(v.string())),
    repliedAt: v.optional(v.number()), // when the contact first replied
    lastMessageAt: v.optional(v.number()), // last message from contact
    engagementScore: v.optional(v.number()), // 0-100, computed from interactions
    // Pipeline / CRM fields
    pipelineStageId: v.optional(v.id("pipelineStages")),
    stageEnteredAt: v.optional(v.number()), // timestamp when moved to current stage
    customFields: v.optional(
      v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
    ),
    aiSummary: v.optional(v.string()), // AI-generated contact summary
    aiSummaryGeneratedAt: v.optional(v.number()),
    isBlocked: v.optional(v.boolean()), // blocked contacts are excluded from webhook processing
    // Affiliate pivot fields
    vertical: v.optional(v.string()), // primary vertical slug
    verticalId: v.optional(v.id("verticals")), // FK to verticals table
    revenue: v.optional(v.number()), // total revenue from Voluum
    conversionCount: v.optional(v.number()), // number of conversions
    source: v.optional(v.string()), // "voluum" | "manual" | "csv"
    lastOfferId: v.optional(v.id("offers")), // last offer they converted on
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_phone", ["userId", "phone"])
    .index("by_userId_and_pipelineStageId", ["userId", "pipelineStageId"])
    .index("by_userId_and_vertical", ["userId", "vertical"])
    .searchIndex("search_by_firstName", {
      searchField: "firstName",
      filterFields: ["userId"],
    }),

  messages: defineTable({
    userId: v.id("users"),
    instanceId: v.optional(v.id("instances")),
    campaignId: v.optional(v.id("campaigns")),
    conversationId: v.optional(v.id("conversations")),
    phone: v.string(),
    message: v.string(),
    status: v.string(), // sent | failed | delivered | read | received
    whatsappMessageId: v.optional(v.string()), // key.id from Evolution API response
    deliveredAt: v.optional(v.number()), // timestamp when DELIVERY_ACK received
    readAt: v.optional(v.number()), // timestamp when READ received
    direction: v.optional(v.string()), // outgoing | incoming
    sentBy: v.optional(v.string()), // human | bot | contact | campaign
    isNote: v.optional(v.boolean()), // true for internal notes (not sent via WhatsApp)
    mediaStorageId: v.optional(v.id("_storage")), // Convex file storage ID for media
    mediaType: v.optional(v.string()), // image | video | audio | document
  })
    .index("by_userId", ["userId"])
    .index("by_campaignId", ["campaignId"])
    .index("by_conversationId", ["conversationId"])
    .index("by_userId_and_phone", ["userId", "phone"])
    .index("by_whatsappMessageId", ["whatsappMessageId"])
    .searchIndex("search_by_message", {
      searchField: "message",
      filterFields: ["userId"],
    }),

  // Track instance connection events for uptime and disconnection timestamps
  connectionEvents: defineTable({
    instanceId: v.id("instances"),
    state: v.string(), // open | close | connecting | refused
    timestamp: v.number(),
  }).index("by_instanceId", ["instanceId"]),

  campaigns: defineTable({
    userId: v.id("users"),
    instanceId: v.optional(v.id("instances")),
    name: v.string(),
    status: v.string(), // draft | running | completed | stopped
    recipientType: v.string(), // all | pending | manual
    selectedContactIds: v.optional(v.array(v.id("contacts"))),
    total: v.number(),
    processed: v.number(),
    sent: v.number(),
    failed: v.number(),
    delay: v.number(), // delay in ms between messages
    messageTemplate: v.string(),
    hasMedia: v.boolean(),
    mediaStorageIds: v.optional(v.array(v.id("_storage"))),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    scheduledAt: v.optional(v.number()), // timestamp for scheduled send
    // Affiliate pivot fields
    offerId: v.optional(v.id("offers")), // linked offer
    verticalId: v.optional(v.id("verticals")), // target vertical
  })
    .index("by_userId", ["userId"])
    .index("by_status_and_scheduledAt", ["status", "scheduledAt"]),

  // Verticals — categorization of leads/offers by niche
  verticals: defineTable({
    userId: v.id("users"),
    name: v.string(), // "GLP-1 / Ozempic", "Finance", "Tech"
    slug: v.string(), // "glp1", "finance", "tech"
    description: v.optional(v.string()),
    color: v.string(), // hex color for UI badges
    offerCount: v.optional(v.number()), // denormalized count
    leadCount: v.optional(v.number()), // denormalized count
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_slug", ["userId", "slug"]),

  // Offers — affiliate offers linked to verticals
  offers: defineTable({
    userId: v.id("users"),
    verticalId: v.id("verticals"),
    name: v.string(), // "Medvi CPM Andy - GLP1"
    affiliateNetwork: v.string(), // "Pureads", "RemedyMeds"
    url: v.optional(v.string()), // offer/landing page URL
    status: v.string(), // active | paused | archived
    revenue: v.optional(v.number()), // total revenue from Voluum
    conversionCount: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_verticalId", ["userId", "verticalId"])
    .index("by_userId_and_status", ["userId", "status"]),

  // Affiliate links — tracked links for offers
  affiliateLinks: defineTable({
    userId: v.id("users"),
    offerId: v.optional(v.id("offers")),
    name: v.string(), // "Medvi GLP1 - Landing A"
    originalUrl: v.string(), // full affiliate URL with params
    affiliateNetwork: v.optional(v.string()),
    verticalId: v.optional(v.id("verticals")),
    clickCount: v.optional(v.number()), // denormalized
    conversionCount: v.optional(v.number()),
    revenue: v.optional(v.number()),
    status: v.string(), // active | paused | archived
    tags: v.optional(v.array(v.string())),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_offerId", ["userId", "offerId"])
    .index("by_userId_and_status", ["userId", "status"]),

  // Shortlinks — shortened redirect URLs for affiliate links
  shortlinks: defineTable({
    userId: v.id("users"),
    affiliateLinkId: v.id("affiliateLinks"),
    domainId: v.optional(v.id("domains")), // custom domain if any
    slug: v.string(), // random 6-char code e.g. "abc123"
    fullUrl: v.string(), // constructed: https://domain.com/abc123
    targetUrl: v.string(), // the affiliate URL it redirects to
    clickCount: v.number(), // incremented on each click
    lastClickedAt: v.optional(v.number()),
    isActive: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_userId", ["userId"])
    .index("by_affiliateLinkId", ["affiliateLinkId"]),

  // Domains — custom redirect domains
  domains: defineTable({
    userId: v.id("users"),
    domain: v.string(), // e.g. "go.myoffers.com"
    provider: v.string(), // "cloudflare" | "namecheap" | "manual"
    cloudflareZoneId: v.optional(v.string()),
    nameservers: v.optional(v.array(v.string())),
    sslStatus: v.optional(v.string()), // active | pending | inactive
    isVerified: v.boolean(),
    status: v.string(), // active | pending | inactive
  })
    .index("by_userId", ["userId"])
    .index("by_domain", ["domain"]),

  // Postbacks — received conversion postbacks from affiliate networks
  postbacks: defineTable({
    userId: v.id("users"),
    offerId: v.optional(v.id("offers")),
    affiliateLinkId: v.optional(v.id("affiliateLinks")),
    clickId: v.optional(v.string()),
    transactionId: v.optional(v.string()),
    payout: v.optional(v.number()),
    status: v.string(), // received | validated | rejected
    source: v.optional(v.string()), // "voluum" | "pureads" | "direct"
    phone: v.optional(v.string()),
    ip: v.optional(v.string()),
    rawParams: v.optional(v.string()), // JSON stringified raw query params
    receivedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_offerId", ["userId", "offerId"])
    .index("by_clickId", ["clickId"])
    .index("by_receivedAt", ["receivedAt"]),

  // Postback configs — per-offer postback URL configurations
  postbackConfigs: defineTable({
    userId: v.id("users"),
    name: v.string(), // "Pureads GLP1 Postback"
    offerId: v.optional(v.id("offers")),
    secretToken: v.string(), // validation token
    paramMapping: v.object({
      clickId: v.string(),
      payout: v.string(),
      transactionId: v.string(),
      status: v.optional(v.string()),
    }),
    isActive: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_secretToken", ["secretToken"]),

  // --- NEW TABLES ---

  // Pipeline stages for kanban CRM view
  pipelineStages: defineTable({
    userId: v.id("users"),
    name: v.string(), // stage label (e.g. "New Lead", "Qualified", "Won")
    color: v.optional(v.string()), // hex color for UI (default #6b7280)
    position: v.number(), // ordering index for drag-and-drop
  }).index("by_userId", ["userId"]),

  // Quick reply templates for fast inbox responses
  quickReplies: defineTable({
    userId: v.id("users"),
    shortcut: v.string(), // slash-command style trigger (e.g. "/thanks")
    text: v.string(), // full message text to insert
    category: v.optional(v.string()), // optional grouping label
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_shortcut", ["userId", "shortcut"])
    .searchIndex("search_by_text", {
      searchField: "text",
      filterFields: ["userId"],
    }),

  // Knowledge base entries for RAG context injection into bot responses
  knowledgeBaseEntries: defineTable({
    userId: v.id("users"),
    title: v.string(),
    content: v.string(), // full text content
    category: v.optional(v.string()),
    wordCount: v.optional(v.number()), // computed on insert/update
  }).index("by_userId", ["userId"]),

  // Bot goals — structured conversation flow templates
  botGoals: defineTable({
    userId: v.id("users"),
    name: v.string(), // goal label
    triggerKeywords: v.array(v.string()), // keywords that activate this goal
    steps: v.array(
      v.object({
        message: v.string(),
        delayMs: v.optional(v.number()),
      }),
    ),
    isActive: v.boolean(), // whether this goal is currently enabled
    position: v.number(), // ordering index
  }).index("by_userId", ["userId"]),

  // Campaign message templates (full templates with variable placeholders)
  templates: defineTable({
    userId: v.id("users"),
    name: v.string(), // template label
    category: v.string(), // Greeting | Follow-up | Promotion | Support
    content: v.string(), // message body with {{variable}} placeholders
    variables: v.array(v.string()), // extracted variable names
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_category", ["userId", "category"]),

  // Activity log for timeline / audit trail
  activityLogs: defineTable({
    userId: v.id("users"),
    type: v.string(), // campaign_started | campaign_completed | message_sent | message_failed | contact_imported | bot_replied | conversation_archived
    description: v.string(),
    metadata: v.optional(
      v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
    ),
  })
    .index("by_userId", ["userId"]),

  // Followup sequences — automated multi-step delayed message flows
  followupSequences: defineTable({
    userId: v.id("users"),
    name: v.string(),
    steps: v.array(
      v.object({
        delayMinutes: v.number(),
        messageTemplate: v.string(),
      }),
    ),
    isActive: v.boolean(),
  }).index("by_userId", ["userId"]),

  // Internal notes on conversations (not sent via WhatsApp)
  conversationNotes: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_conversationId", ["conversationId"]),

  // Webhook event logs for debugging/auditing
  webhookLogs: defineTable({
    event: v.string(), // e.g. messages.upsert, connection.update
    instanceName: v.string(),
    timestamp: v.number(),
    data: v.string(), // JSON stringified, truncated to 500 chars
    status: v.union(v.literal("success"), v.literal("error")),
  }).index("by_timestamp", ["timestamp"]),
});

export default schema;
