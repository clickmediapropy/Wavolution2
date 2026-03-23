import { query, mutation, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Helper: get authenticated user ID or throw
async function getAuthedUserId(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

// --- Public queries ---

// List conversations for inbox (newest first, bounded)
export const list = query({
  args: {
    archived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);

    const isArchived = args.archived ?? false;

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_userId_and_isArchived", (q) =>
        q.eq("userId", userId).eq("isArchived", isArchived),
      )
      .order("desc")
      .take(100);

    // Sort by lastMessageAt descending (most recent first)
    return conversations.sort(
      (a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0),
    );
  },
});

// Get a single conversation by ID (verify ownership)
export const get = query({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const conversation = await ctx.db.get(args.id);
    if (!conversation || conversation.userId !== userId) {
      return null;
    }
    return conversation;
  },
});

// Get messages for a conversation (oldest first for chat display)
export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      return [];
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .take(200);
  },
});

// Get inbox counts (unread, total open, archived)
export const inboxCounts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);

    const open = await ctx.db
      .query("conversations")
      .withIndex("by_userId_and_isArchived", (q) =>
        q.eq("userId", userId).eq("isArchived", false),
      )
      .collect();

    const archived = await ctx.db
      .query("conversations")
      .withIndex("by_userId_and_isArchived", (q) =>
        q.eq("userId", userId).eq("isArchived", true),
      )
      .collect();

    const unread = open.filter((c) => c.unreadCount > 0).length;

    return {
      total: open.length,
      unread,
      archived: archived.length,
    };
  },
});

// --- Public mutations ---

// Mark a conversation as read
export const markRead = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const conversation = await ctx.db.get(args.id);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found");
    }

    await ctx.db.patch(args.id, {
      unreadCount: 0,
      hasBeenInteracted: true,
    });
  },
});

// Mark a conversation as unread
export const markUnread = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const conversation = await ctx.db.get(args.id);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found");
    }

    await ctx.db.patch(args.id, {
      unreadCount: Math.max(1, conversation.unreadCount),
    });
  },
});

// Archive a conversation
export const archive = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const conversation = await ctx.db.get(args.id);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found");
    }
    await ctx.db.patch(args.id, { isArchived: true });
  },
});

// Unarchive a conversation
export const unarchive = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const conversation = await ctx.db.get(args.id);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found");
    }
    await ctx.db.patch(args.id, { isArchived: false });
  },
});

// Toggle bot/human mode for a conversation
export const toggleMode = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const conversation = await ctx.db.get(args.id);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found");
    }

    const newStatus = conversation.status === "bot" ? "human" : "bot";
    await ctx.db.patch(args.id, { status: newStatus });
    return newStatus;
  },
});

// Send a message from the inbox (human agent)
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found");
    }

    if (!args.message.trim()) {
      throw new Error("Message cannot be empty");
    }

    // Get instance name for sending
    let instanceName: string | undefined;
    if (conversation.instanceId) {
      const instance = await ctx.db.get(conversation.instanceId);
      instanceName = instance?.name;
    }

    if (!instanceName) {
      throw new Error("No WhatsApp instance linked to this conversation");
    }

    const now = Date.now();

    // Insert the message record (pending until actually sent)
    const messageId = await ctx.db.insert("messages", {
      userId,
      instanceId: conversation.instanceId,
      conversationId: args.conversationId,
      phone: conversation.phone,
      message: args.message.trim(),
      status: "pending",
      direction: "outgoing",
      sentBy: "human",
    });

    // Update conversation denormalized fields
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      lastMessageText: args.message.trim().slice(0, 200),
      lastMessageDirection: "outbound",
      hasBeenInteracted: true,
    });

    // Schedule the actual send via Evolution API
    await ctx.scheduler.runAfter(0, internal.conversations.sendViaEvolution, {
      messageId,
      instanceName,
      phone: conversation.phone,
      text: args.message.trim(),
    });

    return messageId;
  },
});

// --- Internal functions (used by webhooks, campaign worker) ---

// Find or create a conversation for a phone + instance + user
export const findOrCreate = internalMutation({
  args: {
    userId: v.id("users"),
    instanceId: v.optional(v.id("instances")),
    phone: v.string(),
    contactName: v.optional(v.string()),
    initialStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Try to find existing conversation
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_userId_and_phone", (q) =>
        q.eq("userId", args.userId).eq("phone", args.phone),
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // Find contact for this phone
    const contact = await ctx.db
      .query("contacts")
      .withIndex("by_userId_and_phone", (q) =>
        q.eq("userId", args.userId).eq("phone", args.phone),
      )
      .unique();

    const contactName =
      args.contactName ||
      (contact
        ? [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
          contact.name
        : undefined);

    // Determine initial status (bot or human)
    let status = args.initialStatus || "human";
    if (args.instanceId) {
      const instance = await ctx.db.get(args.instanceId);
      if (instance?.botEnabled) {
        status = "bot";
      }
    }

    return await ctx.db.insert("conversations", {
      userId: args.userId,
      instanceId: args.instanceId,
      contactId: contact?._id,
      phone: args.phone,
      status,
      unreadCount: 0,
      hasBeenInteracted: false,
      isArchived: false,
      contactName,
    });
  },
});

// Update conversation after a new message (denormalized fields)
export const updateOnNewMessage = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    messageText: v.string(),
    direction: v.string(), // inbound | outbound
    isIncoming: v.boolean(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;

    const patch: Record<string, unknown> = {
      lastMessageAt: Date.now(),
      lastMessageText: args.messageText.slice(0, 200),
      lastMessageDirection: args.direction,
    };

    // Increment unread count for incoming messages
    if (args.isIncoming) {
      patch.unreadCount = conversation.unreadCount + 1;
      // Unarchive if archived and new message arrives
      if (conversation.isArchived) {
        patch.isArchived = false;
      }
    }

    await ctx.db.patch(args.conversationId, patch);
  },
});

// Get conversation by phone (internal, no auth)
export const getByPhone = internalQuery({
  args: {
    userId: v.id("users"),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_userId_and_phone", (q) =>
        q.eq("userId", args.userId).eq("phone", args.phone),
      )
      .first();
  },
});

declare const process: { env: Record<string, string | undefined> };

// Send a message via Evolution API (scheduled by sendMessage mutation)
export const sendViaEvolution = internalAction({
  args: {
    messageId: v.id("messages"),
    instanceName: v.string(),
    phone: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const baseUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, "");
    const apiKey = process.env.EVOLUTION_API_KEY;
    if (!baseUrl || !apiKey) {
      await ctx.runMutation(internal.conversations.updateMessageSendStatus, {
        messageId: args.messageId,
        status: "failed",
      });
      return;
    }

    try {
      const res = await fetch(
        `${baseUrl}/message/sendText/${args.instanceName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: apiKey,
          },
          body: JSON.stringify({
            number: args.phone,
            text: args.text,
          }),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        console.error(`Send failed: ${res.status} ${text}`);
        await ctx.runMutation(internal.conversations.updateMessageSendStatus, {
          messageId: args.messageId,
          status: "failed",
        });
        return;
      }

      const data = await res.json();
      const whatsappMessageId =
        (data.key as Record<string, unknown>)?.id as string | undefined;

      await ctx.runMutation(internal.conversations.updateMessageSendStatus, {
        messageId: args.messageId,
        status: "sent",
        whatsappMessageId,
      });
    } catch (err) {
      console.error("Send error:", err);
      await ctx.runMutation(internal.conversations.updateMessageSendStatus, {
        messageId: args.messageId,
        status: "failed",
      });
    }
  },
});

// Update message status after send attempt
export const updateMessageSendStatus = internalMutation({
  args: {
    messageId: v.id("messages"),
    status: v.string(),
    whatsappMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = { status: args.status };
    if (args.whatsappMessageId) {
      patch.whatsappMessageId = args.whatsappMessageId;
    }
    await ctx.db.patch(args.messageId, patch);
  },
});
