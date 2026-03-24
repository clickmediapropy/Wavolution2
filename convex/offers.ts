import { v } from "convex/values";
import {
  query,
  mutation,
  internalMutation,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    verticalId: v.optional(v.id("verticals")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.verticalId) {
      return await ctx.db
        .query("offers")
        .withIndex("by_userId_and_verticalId", (q) =>
          q.eq("userId", userId).eq("verticalId", args.verticalId!),
        )
        .order("desc")
        .take(200);
    }

    if (args.status) {
      return await ctx.db
        .query("offers")
        .withIndex("by_userId_and_status", (q) =>
          q.eq("userId", userId).eq("status", args.status!),
        )
        .order("desc")
        .take(200);
    }

    return await ctx.db
      .query("offers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(200);
  },
});

export const get = query({
  args: { id: v.id("offers") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const offer = await ctx.db.get(args.id);
    if (!offer || offer.userId !== userId) return null;
    return offer;
  },
});

export const listByVertical = query({
  args: { verticalId: v.id("verticals") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("offers")
      .withIndex("by_userId_and_verticalId", (q) =>
        q.eq("userId", userId).eq("verticalId", args.verticalId),
      )
      .order("desc")
      .take(200);
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const allOffers = await ctx.db
      .query("offers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(500);

    let totalRevenue = 0;
    let totalConversions = 0;
    let activeCount = 0;

    for (const offer of allOffers) {
      totalRevenue += offer.revenue ?? 0;
      totalConversions += offer.conversionCount ?? 0;
      if (offer.status === "active") activeCount++;
    }

    return {
      totalOffers: allOffers.length,
      activeOffers: activeCount,
      totalRevenue,
      totalConversions,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    verticalId: v.id("verticals"),
    affiliateNetwork: v.string(),
    url: v.optional(v.string()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate vertical ownership
    const vertical = await ctx.db.get(args.verticalId);
    if (!vertical || vertical.userId !== userId) {
      throw new Error("Vertical not found");
    }

    const offerId = await ctx.db.insert("offers", {
      userId,
      verticalId: args.verticalId,
      name: args.name,
      affiliateNetwork: args.affiliateNetwork,
      url: args.url,
      status: args.status ?? "active",
      notes: args.notes,
      revenue: 0,
      conversionCount: 0,
    });

    // Update denormalized offer count
    await ctx.db.patch(args.verticalId, {
      offerCount: (vertical.offerCount ?? 0) + 1,
    });

    return offerId;
  },
});

export const update = mutation({
  args: {
    id: v.id("offers"),
    name: v.optional(v.string()),
    affiliateNetwork: v.optional(v.string()),
    url: v.optional(v.string()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
    revenue: v.optional(v.number()),
    conversionCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const offer = await ctx.db.get(args.id);
    if (!offer || offer.userId !== userId) {
      throw new Error("Offer not found");
    }

    const { id, ...updates } = args;
    // Filter out undefined values
    const patch: Record<string, string | number | undefined> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        patch[key] = value;
      }
    }

    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("offers") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const offer = await ctx.db.get(args.id);
    if (!offer || offer.userId !== userId) {
      throw new Error("Offer not found");
    }

    // Soft delete by archiving
    await ctx.db.patch(args.id, { status: "archived" });

    // Update denormalized offer count on vertical
    const vertical = await ctx.db.get(offer.verticalId);
    if (vertical) {
      await ctx.db.patch(offer.verticalId, {
        offerCount: Math.max((vertical.offerCount ?? 1) - 1, 0),
      });
    }
  },
});

export const bulkCreate = internalMutation({
  args: {
    userId: v.id("users"),
    offers: v.array(
      v.object({
        name: v.string(),
        verticalId: v.id("verticals"),
        affiliateNetwork: v.string(),
        url: v.optional(v.string()),
        status: v.optional(v.string()),
        notes: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const created: string[] = [];
    for (const offer of args.offers) {
      const id = await ctx.db.insert("offers", {
        userId: args.userId,
        verticalId: offer.verticalId,
        name: offer.name,
        affiliateNetwork: offer.affiliateNetwork,
        url: offer.url,
        status: offer.status ?? "active",
        notes: offer.notes,
        revenue: 0,
        conversionCount: 0,
      });
      created.push(id);
    }
    return { created: created.length };
  },
});
