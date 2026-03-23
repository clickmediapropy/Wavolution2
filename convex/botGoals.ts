import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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

// List all bot goals for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    const goals = await ctx.db
      .query("botGoals")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(100);
    return goals.sort((a, b) => a.position - b.position);
  },
});

// Create a new bot goal
export const create = mutation({
  args: {
    name: v.string(),
    triggerKeywords: v.array(v.string()),
    steps: v.array(
      v.object({
        message: v.string(),
        delayMs: v.optional(v.number()),
      }),
    ),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);

    // Get next position
    const existing = await ctx.db
      .query("botGoals")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(100);
    const maxPosition = existing.reduce(
      (max, g) => Math.max(max, g.position),
      -1,
    );

    return await ctx.db.insert("botGoals", {
      userId,
      name: args.name,
      triggerKeywords: args.triggerKeywords,
      steps: args.steps,
      isActive: args.isActive,
      position: maxPosition + 1,
    });
  },
});

// Update an existing bot goal
export const update = mutation({
  args: {
    id: v.id("botGoals"),
    name: v.optional(v.string()),
    triggerKeywords: v.optional(v.array(v.string())),
    steps: v.optional(
      v.array(
        v.object({
          message: v.string(),
          delayMs: v.optional(v.number()),
        }),
      ),
    ),
    isActive: v.optional(v.boolean()),
    position: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const goal = await ctx.db.get(args.id);
    if (!goal || goal.userId !== userId) {
      throw new Error("Bot goal not found");
    }

    const { id, ...updates } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(id, patch);
    }
  },
});

// Delete a bot goal
export const remove = mutation({
  args: { id: v.id("botGoals") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const goal = await ctx.db.get(args.id);
    if (!goal || goal.userId !== userId) {
      throw new Error("Bot goal not found");
    }
    await ctx.db.delete(args.id);
  },
});

// Internal: find matching goals for an inbound message
export const findMatchingGoals = internalQuery({
  args: {
    userId: v.id("users"),
    messageText: v.string(),
  },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query("botGoals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(100);

    const activeGoals = goals.filter((g) => g.isActive);
    const lowerMessage = args.messageText.toLowerCase();

    // Return goals whose trigger keywords match the message
    return activeGoals.filter((goal) =>
      goal.triggerKeywords.some((kw) => lowerMessage.includes(kw.toLowerCase())),
    );
  },
});
