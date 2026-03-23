import { query, mutation } from "./_generated/server";
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

// List all instances for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    return await ctx.db
      .query("instances")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});

// Get a single instance (verify ownership)
export const get = query({
  args: { id: v.id("instances") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const instance = await ctx.db.get(args.id);
    if (!instance || instance.userId !== userId) {
      return null;
    }
    return instance;
  },
});

// List only connected instances for the current user
export const listConnected = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    const all = await ctx.db
      .query("instances")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(50);
    return all.filter((i) => i.whatsappConnected);
  },
});

// Count instances for dashboard
export const count = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    const all = await ctx.db
      .query("instances")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(100);
    return {
      total: all.length,
      connected: all.filter((i) => i.whatsappConnected).length,
    };
  },
});

// Get the most recent disconnection timestamp for any user instance
export const lastDisconnection = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    const instances = await ctx.db
      .query("instances")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(50);

    let latestDisconnect: number | null = null;
    for (const inst of instances) {
      const events = await ctx.db
        .query("connectionEvents")
        .withIndex("by_instanceId", (q) => q.eq("instanceId", inst._id))
        .order("desc")
        .take(10);

      const lastClose = events.find((e) => e.state === "close");
      if (lastClose && (!latestDisconnect || lastClose.timestamp > latestDisconnect)) {
        latestDisconnect = lastClose.timestamp;
      }
    }

    return latestDisconnect;
  },
});

// Create a new instance record (called by evolution.createInstance after API call)
export const create = mutation({
  args: {
    name: v.string(),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);

    // Check uniqueness per user
    const existing = await ctx.db
      .query("instances")
      .withIndex("by_userId_and_name", (q) =>
        q.eq("userId", userId).eq("name", args.name),
      )
      .unique();
    if (existing) {
      throw new Error(`Instance "${args.name}" already exists`);
    }

    return await ctx.db.insert("instances", {
      userId,
      name: args.name,
      apiKey: args.apiKey,
      whatsappConnected: false,
      connectionStatus: "pending",
    });
  },
});

// Update instance connection state
export const updateState = mutation({
  args: {
    id: v.id("instances"),
    whatsappConnected: v.optional(v.boolean()),
    whatsappNumber: v.optional(v.string()),
    connectionStatus: v.optional(v.string()),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const instance = await ctx.db.get(args.id);
    if (!instance || instance.userId !== userId) {
      throw new Error("Instance not found");
    }

    const { id, ...updates } = args;
    // Filter out undefined values
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(id, patch);
    }
  },
});

// Update bot settings for an instance
export const updateBotSettings = mutation({
  args: {
    id: v.id("instances"),
    botEnabled: v.optional(v.boolean()),
    botSystemPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const instance = await ctx.db.get(args.id);
    if (!instance || instance.userId !== userId) {
      throw new Error("Instance not found");
    }

    const patch: Record<string, unknown> = {};
    if (args.botEnabled !== undefined) patch.botEnabled = args.botEnabled;
    if (args.botSystemPrompt !== undefined) patch.botSystemPrompt = args.botSystemPrompt;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.id, patch);
    }
  },
});

// Remove an instance record
export const remove = mutation({
  args: { id: v.id("instances") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const instance = await ctx.db.get(args.id);
    if (!instance || instance.userId !== userId) {
      throw new Error("Instance not found");
    }
    await ctx.db.delete(args.id);
  },
});
