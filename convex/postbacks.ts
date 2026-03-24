import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Generate 32-char hex token
function generateSecretToken(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
}

// --- Postback Configs ---

export const listConfigs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("postbackConfigs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(100);
  },
});

export const createConfig = mutation({
  args: {
    name: v.string(),
    offerId: v.optional(v.id("offers")),
    paramMapping: v.object({
      clickId: v.string(),
      payout: v.string(),
      transactionId: v.string(),
      status: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const secretToken = generateSecretToken();

    return await ctx.db.insert("postbackConfigs", {
      userId,
      name: args.name,
      offerId: args.offerId,
      secretToken,
      paramMapping: args.paramMapping,
      isActive: true,
    });
  },
});

export const updateConfig = mutation({
  args: {
    id: v.id("postbackConfigs"),
    name: v.optional(v.string()),
    offerId: v.optional(v.id("offers")),
    paramMapping: v.optional(
      v.object({
        clickId: v.string(),
        payout: v.string(),
        transactionId: v.string(),
        status: v.optional(v.string()),
      }),
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const config = await ctx.db.get(args.id);
    if (!config || config.userId !== userId) {
      throw new Error("Config not found");
    }

    const { id, ...updates } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }

    await ctx.db.patch(id, patch);
  },
});

export const removeConfig = mutation({
  args: { id: v.id("postbackConfigs") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const config = await ctx.db.get(args.id);
    if (!config || config.userId !== userId) {
      throw new Error("Config not found");
    }

    await ctx.db.patch(args.id, { isActive: false });
  },
});

// --- Postback URL ---

export const getPostbackUrl = query({
  args: { configId: v.id("postbackConfigs") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const config = await ctx.db.get(args.configId);
    if (!config || config.userId !== userId) return null;

    // Build postback URL with parameter placeholders
    // CONVEX_SITE_URL is not available in query runtime; use known deployment URL
    const siteUrl = "https://wandering-blackbird-22.convex.site";
    const mapping = config.paramMapping;

    const params = new URLSearchParams({
      token: config.secretToken,
      clickid: `{${mapping.clickId}}`,
      payout: `{${mapping.payout}}`,
      txid: `{${mapping.transactionId}}`,
    });
    if (mapping.status) {
      params.set("status", `{${mapping.status}}`);
    }

    return `${siteUrl}/postback?${params}`;
  },
});

// --- Postback Listing ---

export const listPostbacks = query({
  args: {
    offerId: v.optional(v.id("offers")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.offerId) {
      return await ctx.db
        .query("postbacks")
        .withIndex("by_userId_and_offerId", (q) =>
          q.eq("userId", userId).eq("offerId", args.offerId!),
        )
        .order("desc")
        .take(200);
    }

    return await ctx.db
      .query("postbacks")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(200);
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const allPostbacks = await ctx.db
      .query("postbacks")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(1000);

    let totalRevenue = 0;
    let todayCount = 0;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();

    for (const pb of allPostbacks) {
      totalRevenue += pb.payout ?? 0;
      if (pb.receivedAt >= todayMs) todayCount++;
    }

    return {
      totalConversions: allPostbacks.length,
      totalRevenue,
      conversionsToday: todayCount,
    };
  },
});

// --- Internal: Process Postback ---

export const processPostback = internalMutation({
  args: {
    token: v.string(),
    clickId: v.optional(v.string()),
    payout: v.optional(v.number()),
    transactionId: v.optional(v.string()),
    status: v.optional(v.string()),
    ip: v.optional(v.string()),
    rawParams: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Look up config by token
    const config = await ctx.db
      .query("postbackConfigs")
      .withIndex("by_secretToken", (q) => q.eq("secretToken", args.token))
      .unique();

    if (!config || !config.isActive) {
      console.warn("[postbacks] Invalid or inactive token:", args.token);
      return { success: false, error: "Invalid token" };
    }

    // Create postback record
    await ctx.db.insert("postbacks", {
      userId: config.userId,
      offerId: config.offerId,
      clickId: args.clickId,
      transactionId: args.transactionId,
      payout: args.payout,
      status: args.status ?? "received",
      source: "direct",
      ip: args.ip,
      rawParams: args.rawParams,
      receivedAt: Date.now(),
    });

    // Update offer revenue if linked
    if (config.offerId && args.payout) {
      const offer = await ctx.db.get(config.offerId);
      if (offer) {
        await ctx.db.patch(config.offerId, {
          revenue: (offer.revenue ?? 0) + args.payout,
          conversionCount: (offer.conversionCount ?? 0) + 1,
        });
      }
    }

    return { success: true };
  },
});
