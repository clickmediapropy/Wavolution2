import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    offerId: v.optional(v.id("offers")),
    verticalId: v.optional(v.id("verticals")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.offerId) {
      return await ctx.db
        .query("affiliateLinks")
        .withIndex("by_userId_and_offerId", (q) =>
          q.eq("userId", userId).eq("offerId", args.offerId!),
        )
        .order("desc")
        .take(200);
    }

    if (args.status) {
      return await ctx.db
        .query("affiliateLinks")
        .withIndex("by_userId_and_status", (q) =>
          q.eq("userId", userId).eq("status", args.status!),
        )
        .order("desc")
        .take(200);
    }

    return await ctx.db
      .query("affiliateLinks")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(200);
  },
});

export const get = query({
  args: { id: v.id("affiliateLinks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const link = await ctx.db.get(args.id);
    if (!link || link.userId !== userId) return null;
    return link;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    originalUrl: v.string(),
    offerId: v.optional(v.id("offers")),
    affiliateNetwork: v.optional(v.string()),
    verticalId: v.optional(v.id("verticals")),
    status: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("affiliateLinks", {
      userId,
      name: args.name,
      originalUrl: args.originalUrl,
      offerId: args.offerId,
      affiliateNetwork: args.affiliateNetwork,
      verticalId: args.verticalId,
      status: args.status ?? "active",
      tags: args.tags,
      clickCount: 0,
      conversionCount: 0,
      revenue: 0,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("affiliateLinks"),
    name: v.optional(v.string()),
    originalUrl: v.optional(v.string()),
    offerId: v.optional(v.id("offers")),
    affiliateNetwork: v.optional(v.string()),
    status: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const link = await ctx.db.get(args.id);
    if (!link || link.userId !== userId) {
      throw new Error("Link not found");
    }

    const { id, ...updates } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }

    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("affiliateLinks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const link = await ctx.db.get(args.id);
    if (!link || link.userId !== userId) {
      throw new Error("Link not found");
    }

    await ctx.db.patch(args.id, { status: "archived" });
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const allLinks = await ctx.db
      .query("affiliateLinks")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(500);

    let totalClicks = 0;
    let totalConversions = 0;
    let totalRevenue = 0;

    for (const link of allLinks) {
      totalClicks += link.clickCount ?? 0;
      totalConversions += link.conversionCount ?? 0;
      totalRevenue += link.revenue ?? 0;
    }

    return {
      totalLinks: allLinks.length,
      totalClicks,
      totalConversions,
      totalRevenue,
    };
  },
});

export const incrementClick = internalMutation({
  args: { id: v.id("affiliateLinks") },
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.id);
    if (!link) return;

    await ctx.db.patch(args.id, {
      clickCount: (link.clickCount ?? 0) + 1,
    });
  },
});
