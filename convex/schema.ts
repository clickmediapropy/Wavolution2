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
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_name", ["userId", "name"]),

  // App tables
  contacts: defineTable({
    userId: v.id("users"),
    phone: v.string(),
    name: v.optional(v.string()), // deprecated — kept for backward compat during migration
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    status: v.string(),
    sentAt: v.optional(v.number()),
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
    phone: v.string(),
    message: v.string(),
    status: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_campaignId", ["campaignId"])
    .index("by_userId_and_phone", ["userId", "phone"]),

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
