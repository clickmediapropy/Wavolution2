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

// Log a sent message
export const logMessage = mutation({
  args: {
    phone: v.string(),
    message: v.string(),
    status: v.string(),
    campaignId: v.optional(v.id("campaigns")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("messages", {
      userId,
      phone: args.phone,
      message: args.message,
      status: args.status,
      campaignId: args.campaignId,
    });
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
