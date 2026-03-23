import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

// Count messages for current user
export const count = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return messages.length;
  },
});

// Count messages sent today
export const countToday = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return messages.filter((m) => m._creationTime > todayStart.getTime()).length;
  },
});

// Log a sent message
export const logMessage = mutation({
  args: {
    phone: v.string(),
    message: v.string(),
    status: v.string(),
    instanceId: v.optional(v.id("instances")),
    campaignId: v.optional(v.id("campaigns")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("messages", {
      userId,
      instanceId: args.instanceId,
      phone: args.phone,
      message: args.message,
      status: args.status,
      campaignId: args.campaignId,
    });
  },
});

// Count messages sent in the last N minutes (for rate limiting)
export const countRecent = query({
  args: { minutes: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const cutoff = Date.now() - args.minutes * 60 * 1000;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return messages.filter((m) => m._creationTime > cutoff).length;
  },
});

// List messages for current user (newest first)
export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db
      .query("messages")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// Dashboard stats: delivery rate, open rate, failure rate, avg response time
export const dashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Split by direction
    const outgoing = allMessages.filter(
      (m) => m.direction !== "incoming",
    );
    const incoming = allMessages.filter(
      (m) => m.direction === "incoming",
    );
    const totalOutgoing = outgoing.length;

    if (totalOutgoing === 0) {
      return {
        deliveryRate: 0,
        openRate: 0,
        failureRate: 0,
        avgResponseMinutes: null,
        totalSent: 0,
        totalDelivered: 0,
        totalRead: 0,
        totalFailed: 0,
        totalIncoming: incoming.length,
      };
    }

    const sent = outgoing.filter((m) => m.status !== "failed");
    const delivered = outgoing.filter((m) => m.deliveredAt);
    const read = outgoing.filter((m) => m.readAt);
    const failed = outgoing.filter((m) => m.status === "failed");

    // Delivery rate: delivered / sent (excluding failed)
    const deliveryRate =
      sent.length > 0
        ? Math.round((delivered.length / sent.length) * 1000) / 10
        : 0;

    // Open rate: read / delivered (or sent if no delivery data yet)
    const openBase = delivered.length > 0 ? delivered.length : sent.length;
    const openRate =
      openBase > 0
        ? Math.round((read.length / openBase) * 1000) / 10
        : 0;

    // Failure rate: failed / total outgoing
    const failureRate =
      Math.round((failed.length / totalOutgoing) * 1000) / 10;

    // Avg response time: for each incoming message, find the most recent
    // outgoing to the same phone before it, and compute the delta
    let totalResponseMs = 0;
    let responseCount = 0;

    for (const inMsg of incoming) {
      // Find the latest outgoing message to this phone before this reply
      const lastOutgoing = outgoing
        .filter(
          (m) =>
            m.phone === inMsg.phone &&
            m._creationTime < inMsg._creationTime,
        )
        .sort((a, b) => b._creationTime - a._creationTime)[0];

      if (lastOutgoing) {
        const delta = inMsg._creationTime - lastOutgoing._creationTime;
        // Only count reasonable response times (< 24 hours)
        if (delta < 24 * 60 * 60 * 1000) {
          totalResponseMs += delta;
          responseCount++;
        }
      }
    }

    const avgResponseMinutes =
      responseCount > 0
        ? Math.round(totalResponseMs / responseCount / 60000)
        : null;

    return {
      deliveryRate,
      openRate,
      failureRate,
      avgResponseMinutes,
      totalSent: sent.length,
      totalDelivered: delivered.length,
      totalRead: read.length,
      totalFailed: failed.length,
      totalIncoming: incoming.length,
    };
  },
});

// Daily message counts for the last 7 days (for sparkline charts)
export const dailyCounts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const recent = messages.filter((m) => m._creationTime > sevenDaysAgo);

    // Bucket into 7 days
    const counts: number[] = Array(7).fill(0);
    for (const m of recent) {
      const daysAgo = Math.floor((now - m._creationTime) / (24 * 60 * 60 * 1000));
      const idx = 6 - daysAgo; // 0 = oldest, 6 = today
      if (idx >= 0 && idx < 7) {
        counts[idx]++;
      }
    }

    return counts;
  },
});

// Daily contact additions for the last 7 days (for sparkline charts)
export const contactDailyCounts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const recent = contacts.filter((c) => c._creationTime > sevenDaysAgo);

    const counts: number[] = Array(7).fill(0);
    for (const c of recent) {
      const daysAgo = Math.floor((now - c._creationTime) / (24 * 60 * 60 * 1000));
      const idx = 6 - daysAgo;
      if (idx >= 0 && idx < 7) {
        counts[idx]++;
      }
    }

    return counts;
  },
});

// Message success rate for connection health (last 100 messages)
export const successRate = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(100);

    const outgoing = messages.filter((m) => m.direction !== "incoming");
    if (outgoing.length === 0) return 100;

    const successful = outgoing.filter((m) => m.status !== "failed").length;
    return Math.round((successful / outgoing.length) * 100);
  },
});

// Full-text search messages by content
export const searchMessages = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (!args.query.trim()) return [];

    const results = await ctx.db
      .query("messages")
      .withSearchIndex("search_by_message", (q) =>
        q.search("message", args.query).eq("userId", userId),
      )
      .take(20);

    // Group by conversationId and return with conversation info
    const conversationIds = [
      ...new Set(
        results
          .map((m) => m.conversationId)
          .filter((id): id is NonNullable<typeof id> => id != null),
      ),
    ];

    const conversations = await Promise.all(
      conversationIds.map((id) => ctx.db.get(id)),
    );
    const convMap = new Map(
      conversations
        .filter((c): c is NonNullable<typeof c> => c != null)
        .map((c) => [c._id, c]),
    );

    return results
      .filter((m) => m.conversationId != null)
      .map((m) => ({
        _id: m._id,
        message: m.message,
        conversationId: m.conversationId!,
        direction: m.direction,
        _creationTime: m._creationTime,
        conversationPhone: convMap.get(m.conversationId!)?.phone ?? "",
        conversationContactName:
          convMap.get(m.conversationId!)?.contactName ?? null,
      }));
  },
});
