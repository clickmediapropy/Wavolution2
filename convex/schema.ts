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
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_phone", ["userId", "phone"])
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
  })
    .index("by_userId", ["userId"])
    .index("by_campaignId", ["campaignId"])
    .index("by_conversationId", ["conversationId"])
    .index("by_userId_and_phone", ["userId", "phone"])
    .index("by_whatsappMessageId", ["whatsappMessageId"]),

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
  }).index("by_userId", ["userId"]),
});

export default schema;
