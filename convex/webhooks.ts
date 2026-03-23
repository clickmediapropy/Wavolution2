import { httpAction } from "./_generated/server";
import { query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// --- HTTP action: receives Evolution API webhook events ---

export const handleEvolutionWebhook = httpAction(async (ctx, req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const event = body.event as string;
    const instanceName = body.instance as string;
    const data = body.data as Record<string, unknown>;

    if (!event || !data) {
      return new Response("Missing event or data", { status: 400 });
    }

    // Truncate data for logging (500 chars max)
    const truncatedData = JSON.stringify(data).slice(0, 500);

    switch (event) {
      case "messages.update": {
        const keyId = data.keyId as string | undefined;
        const status = data.status as string | undefined;
        const fromMe = data.fromMe as boolean | undefined;

        // Only track outgoing message status updates
        if (keyId && status && fromMe) {
          await ctx.runMutation(internal.webhooks.updateMessageStatus, {
            whatsappMessageId: keyId,
            whatsappStatus: status,
          });
        }
        break;
      }

      case "messages.upsert": {
        const key = data.key as Record<string, unknown> | undefined;
        const fromMe = key?.fromMe as boolean | undefined;
        const remoteJid = key?.remoteJid as string | undefined;
        const whatsappMessageId = key?.id as string | undefined;

        if (!fromMe && remoteJid && !remoteJid.includes("@g.us")) {
          // Extract phone from JID
          const rawPhone = remoteJid.replace("@s.whatsapp.net", "");
          const phone = rawPhone.startsWith("+") ? rawPhone : `+${rawPhone}`;

          // Extract message text properly
          const msgObj = data.message as Record<string, unknown> | undefined;
          let messageText = "";
          if (msgObj) {
            if (typeof msgObj.conversation === "string") {
              messageText = msgObj.conversation;
            } else if (msgObj.extendedTextMessage) {
              const ext = msgObj.extendedTextMessage as Record<string, unknown>;
              messageText =
                typeof ext.text === "string" ? ext.text : "[media]";
            } else {
              messageText = "[media]";
            }
          }

          // Extract push name (contact's WhatsApp display name)
          const pushName = data.pushName as string | undefined;

          const instance = await ctx.runQuery(
            internal.webhooks.getInstanceByName,
            { name: instanceName },
          );

          if (instance) {
            // Skip messages from blocked contacts
            const blocked = await ctx.runQuery(
              internal.webhooks.isContactBlocked,
              { userId: instance.userId, phone },
            );
            if (blocked) {
              break;
            }

            await ctx.runMutation(internal.webhooks.logIncomingMessage, {
              instanceId: instance._id,
              userId: instance.userId,
              phone,
              message: messageText,
              pushName: pushName || undefined,
              whatsappMessageId: whatsappMessageId || undefined,
              botEnabled: instance.botEnabled ?? false,
              botSystemPrompt: instance.botSystemPrompt || undefined,
              instanceName: instance.name,
            });
          }
        }
        break;
      }

      case "presence.update": {
        // Typing indicator from contact
        const participant = (data.id as string) || "";
        const presences = data.presences as
          | Array<Record<string, unknown>>
          | undefined;
        const isTyping =
          presences?.some((p) => p.status === "composing") ?? false;

        if (participant && !participant.includes("@g.us")) {
          const rawPhone = participant.replace("@s.whatsapp.net", "");
          const phone = rawPhone.startsWith("+") ? rawPhone : `+${rawPhone}`;

          const instance = await ctx.runQuery(
            internal.webhooks.getInstanceByName,
            { name: instanceName },
          );

          if (instance) {
            const conversation = await ctx.runQuery(
              internal.webhooks.getConversationByPhone,
              { userId: instance.userId, phone },
            );

            if (conversation) {
              await ctx.runMutation(internal.conversations.updateTyping, {
                conversationId: conversation._id,
                typing: isTyping,
              });
            }
          }
        }
        break;
      }

      case "connection.update": {
        const state = (data.state as string) || "unknown";
        const instance = await ctx.runQuery(
          internal.webhooks.getInstanceByName,
          { name: instanceName },
        );
        if (instance) {
          await ctx.runMutation(internal.webhooks.updateConnectionState, {
            instanceId: instance._id,
            state,
          });
        }
        break;
      }
    }

    // Log successful webhook event
    await ctx.runMutation(internal.webhooks.logWebhookEvent, {
      event,
      instanceName: instanceName || "unknown",
      data: truncatedData,
      status: "success",
    });

    return new Response("OK", { status: 200 });
  } catch (err) {
    // Attempt to log the error event
    try {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      await ctx.runMutation(internal.webhooks.logWebhookEvent, {
        event: "parse_error",
        instanceName: "unknown",
        data: JSON.stringify({ error: errorMsg }).slice(0, 500),
        status: "error",
      });
    } catch {
      // Ignore logging failures to avoid masking the original error
    }
    return new Response("Internal error", { status: 500 });
  }
});

// --- Internal queries ---

export const getInstanceByName = internalQuery({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("instances")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

export const isContactBlocked = internalQuery({
  args: {
    userId: v.id("users"),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db
      .query("contacts")
      .withIndex("by_userId_and_phone", (q) =>
        q.eq("userId", args.userId).eq("phone", args.phone),
      )
      .unique();
    return contact?.isBlocked === true;
  },
});

export const getConversationByPhone = internalQuery({
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

// --- Internal mutations ---

export const updateMessageStatus = internalMutation({
  args: {
    whatsappMessageId: v.string(),
    whatsappStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db
      .query("messages")
      .withIndex("by_whatsappMessageId", (q) =>
        q.eq("whatsappMessageId", args.whatsappMessageId),
      )
      .unique();

    if (!message) return;

    const now = Date.now();
    const patch: Record<string, unknown> = {};

    switch (args.whatsappStatus) {
      case "DELIVERY_ACK":
        if (!message.deliveredAt) {
          patch.deliveredAt = now;
          patch.status = "delivered";
        }
        break;
      case "READ":
      case "PLAYED":
        if (!message.readAt) {
          patch.readAt = now;
          patch.status = "read";
        }
        if (!message.deliveredAt) {
          patch.deliveredAt = now;
        }
        break;
      case "ERROR":
        patch.status = "failed";
        break;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(message._id, patch);
    }
  },
});

export const logIncomingMessage = internalMutation({
  args: {
    instanceId: v.id("instances"),
    userId: v.id("users"),
    phone: v.string(),
    message: v.string(),
    pushName: v.optional(v.string()),
    whatsappMessageId: v.optional(v.string()),
    botEnabled: v.boolean(),
    botSystemPrompt: v.optional(v.string()),
    instanceName: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Find or create conversation
    const existingConv = await ctx.db
      .query("conversations")
      .withIndex("by_userId_and_phone", (q) =>
        q.eq("userId", args.userId).eq("phone", args.phone),
      )
      .first();

    let conversationId;
    if (existingConv) {
      conversationId = existingConv._id;
    } else {
      // Look up contact for name
      const contact = await ctx.db
        .query("contacts")
        .withIndex("by_userId_and_phone", (q) =>
          q.eq("userId", args.userId).eq("phone", args.phone),
        )
        .unique();

      const contactName =
        args.pushName ||
        (contact
          ? [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
            contact.name
          : undefined) ||
        args.phone;

      conversationId = await ctx.db.insert("conversations", {
        userId: args.userId,
        instanceId: args.instanceId,
        contactId: contact?._id,
        phone: args.phone,
        status: args.botEnabled ? "bot" : "human",
        unreadCount: 0,
        hasBeenInteracted: false,
        isArchived: false,
        contactName,
      });
    }

    // 2. Insert the message
    const messageId = await ctx.db.insert("messages", {
      userId: args.userId,
      instanceId: args.instanceId,
      conversationId,
      phone: args.phone,
      message: args.message,
      status: "received",
      direction: "incoming",
      sentBy: "contact",
      whatsappMessageId: args.whatsappMessageId,
    });

    // 3. Update conversation denormalized fields
    const conv = await ctx.db.get(conversationId);
    if (conv) {
      await ctx.db.patch(conversationId, {
        lastMessageAt: Date.now(),
        lastMessageText: args.message.slice(0, 200),
        lastMessageDirection: "inbound",
        unreadCount: conv.unreadCount + 1,
        // Unarchive if it was archived
        ...(conv.isArchived ? { isArchived: false } : {}),
        // Update contact name from pushName if we didn't have one
        ...(args.pushName && !conv.contactName
          ? { contactName: args.pushName }
          : {}),
      });
    }

    // 4. Update contact engagement
    const contact = await ctx.db
      .query("contacts")
      .withIndex("by_userId_and_phone", (q) =>
        q.eq("userId", args.userId).eq("phone", args.phone),
      )
      .unique();

    if (contact) {
      const now = Date.now();
      const patch: Record<string, unknown> = {
        lastMessageAt: now,
      };
      // First reply — mark as replied
      if (!contact.repliedAt) {
        patch.repliedAt = now;
        patch.status = "replied";
      }
      // Bump engagement score (simple: +10 per reply, max 100)
      const currentScore = contact.engagementScore ?? 0;
      patch.engagementScore = Math.min(100, currentScore + 10);

      await ctx.db.patch(contact._id, patch);
    }

    // 5. Trigger auto-reply if bot mode is active
    if (conv && conv.status === "bot" && args.botSystemPrompt) {
      await ctx.scheduler.runAfter(
        0,
        internal.ai.generateAutoReply,
        {
          conversationId,
          inboundMessageId: messageId,
          userId: args.userId,
          instanceName: args.instanceName,
          phone: args.phone,
          systemPrompt: args.botSystemPrompt,
        },
      );
    }
  },
});

export const updateConnectionState = internalMutation({
  args: {
    instanceId: v.id("instances"),
    state: v.string(),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) return;

    await ctx.db.patch(args.instanceId, {
      whatsappConnected: args.state === "open",
      connectionStatus: args.state,
    });

    await ctx.db.insert("connectionEvents", {
      instanceId: args.instanceId,
      state: args.state,
      timestamp: Date.now(),
    });
  },
});

// --- Webhook logging ---

export const logWebhookEvent = internalMutation({
  args: {
    event: v.string(),
    instanceName: v.string(),
    data: v.string(),
    status: v.union(v.literal("success"), v.literal("error")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookLogs", {
      event: args.event,
      instanceName: args.instanceName,
      timestamp: Date.now(),
      data: args.data,
      status: args.status,
    });
  },
});

// --- Public queries (auth-protected) ---

export const listRecentLogs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("webhookLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .take(100);
  },
});
