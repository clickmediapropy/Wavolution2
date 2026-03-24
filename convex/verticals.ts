import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("verticals")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(100);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("verticals")
      .withIndex("by_userId_and_slug", (q) =>
        q.eq("userId", userId).eq("slug", args.slug),
      )
      .unique();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate slug uniqueness per user
    const existing = await ctx.db
      .query("verticals")
      .withIndex("by_userId_and_slug", (q) =>
        q.eq("userId", userId).eq("slug", args.slug),
      )
      .unique();
    if (existing) {
      throw new Error(`Vertical with slug "${args.slug}" already exists`);
    }

    return await ctx.db.insert("verticals", {
      userId,
      name: args.name,
      slug: args.slug,
      description: args.description,
      color: args.color,
      offerCount: 0,
      leadCount: 0,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("verticals"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const vertical = await ctx.db.get(args.id);
    if (!vertical || vertical.userId !== userId) {
      throw new Error("Vertical not found");
    }

    const updates: Record<string, string | undefined> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.color !== undefined) updates.color = args.color;

    await ctx.db.patch(args.id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("verticals") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const vertical = await ctx.db.get(args.id);
    if (!vertical || vertical.userId !== userId) {
      throw new Error("Vertical not found");
    }

    // Check if any offers reference this vertical
    const offers = await ctx.db
      .query("offers")
      .withIndex("by_userId_and_verticalId", (q) =>
        q.eq("userId", userId).eq("verticalId", args.id),
      )
      .take(1);
    if (offers.length > 0) {
      throw new Error(
        "Cannot delete vertical that has offers. Remove or reassign offers first.",
      );
    }

    await ctx.db.delete(args.id);
  },
});

export const seed = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Check if user already has verticals
    const existing = await ctx.db
      .query("verticals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(1);
    if (existing.length > 0) return;

    const defaults = [
      {
        name: "GLP-1 / Ozempic",
        slug: "glp1",
        color: "#10b981",
        description: "Weight loss and GLP-1 receptor agonist offers",
      },
      {
        name: "Finance",
        slug: "finance",
        color: "#3b82f6",
        description: "Financial services and credit offers",
      },
      {
        name: "Tech",
        slug: "tech",
        color: "#8b5cf6",
        description: "Technology, hosting, and cloud offers",
      },
      {
        name: "Nutra / Supplements",
        slug: "nutra",
        color: "#f59e0b",
        description: "Nutritional supplements and health products",
      },
    ];

    for (const vertical of defaults) {
      await ctx.db.insert("verticals", {
        userId: args.userId,
        ...vertical,
        offerCount: 0,
        leadCount: 0,
      });
    }
  },
});
