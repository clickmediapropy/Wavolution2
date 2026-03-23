import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper: get authenticated user ID or throw
async function getAuthedUserId(ctx: QueryCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

// Valid activity types
const ACTIVITY_TYPES = [
  "campaign_started",
  "campaign_completed",
  "message_sent",
  "message_failed",
  "contact_imported",
  "bot_replied",
  "conversation_archived",
] as const;

// Internal mutation — called from other Convex functions, not from the client
export const logActivity = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    description: v.string(),
    metadata: v.optional(
      v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
    ),
  },
  handler: async (ctx, args) => {
    if (!ACTIVITY_TYPES.includes(args.type as (typeof ACTIVITY_TYPES)[number])) {
      throw new Error(`Invalid activity type: ${args.type}`);
    }
    return await ctx.db.insert("activityLogs", {
      userId: args.userId,
      type: args.type,
      description: args.description,
      metadata: args.metadata,
    });
  },
});

// Public query — returns the most recent activity for the authenticated user
export const listRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const limit = args.limit ?? 50;

    return await ctx.db
      .query("activityLogs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});
