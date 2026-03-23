import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

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

// Create a new campaign in "draft" status
export const create = mutation({
  args: {
    name: v.string(),
    instanceId: v.optional(v.id("instances")),
    recipientType: v.string(), // "all" | "pending" | "manual"
    selectedContactIds: v.optional(v.array(v.id("contacts"))),
    messageTemplate: v.string(),
    hasMedia: v.boolean(),
    mediaStorageIds: v.optional(v.array(v.id("_storage"))),
    delay: v.number(),
    total: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);

    if (!args.name.trim()) {
      throw new Error("Campaign name is required");
    }
    if (!args.messageTemplate.trim()) {
      throw new Error("Message template is required");
    }
    if (args.total < 1) {
      throw new Error("Campaign must have at least one recipient");
    }
    if (args.recipientType === "manual" && (!args.selectedContactIds || args.selectedContactIds.length === 0)) {
      throw new Error("Manual campaigns must have at least one selected contact");
    }

    return await ctx.db.insert("campaigns", {
      userId,
      instanceId: args.instanceId,
      name: args.name.trim(),
      status: "draft",
      recipientType: args.recipientType,
      selectedContactIds: args.selectedContactIds,
      total: args.total,
      processed: 0,
      sent: 0,
      failed: 0,
      delay: args.delay,
      messageTemplate: args.messageTemplate.trim(),
      hasMedia: args.hasMedia,
      mediaStorageIds: args.mediaStorageIds,
    });
  },
});

// Start a draft campaign (sets status to "running")
export const start = mutation({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const campaign = await ctx.db.get(args.id);
    if (!campaign || campaign.userId !== userId) {
      throw new Error("Campaign not found");
    }
    if (campaign.status !== "draft") {
      throw new Error("Only draft campaigns can be started");
    }

    await ctx.db.patch(args.id, {
      status: "running",
      startedAt: Date.now(),
    });

    // Schedule the campaign worker to start processing
    await ctx.scheduler.runAfter(0, internal.campaignWorker.processBatch, {
      campaignId: args.id,
    });
  },
});

// Stop a running or paused campaign
export const stop = mutation({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const campaign = await ctx.db.get(args.id);
    if (!campaign || campaign.userId !== userId) {
      throw new Error("Campaign not found");
    }
    if (campaign.status !== "running" && campaign.status !== "paused") {
      throw new Error("Only running or paused campaigns can be stopped");
    }

    await ctx.db.patch(args.id, {
      status: "stopped",
      completedAt: Date.now(),
    });
  },
});

// Pause a running campaign
export const pause = mutation({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const campaign = await ctx.db.get(args.id);
    if (!campaign || campaign.userId !== userId) {
      throw new Error("Campaign not found");
    }
    if (campaign.status !== "running") {
      throw new Error("Only running campaigns can be paused");
    }
    await ctx.db.patch(args.id, { status: "paused" });
  },
});

// Resume a paused campaign
export const resume = mutation({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const campaign = await ctx.db.get(args.id);
    if (!campaign || campaign.userId !== userId) {
      throw new Error("Campaign not found");
    }
    if (campaign.status !== "paused") {
      throw new Error("Only paused campaigns can be resumed");
    }
    await ctx.db.patch(args.id, { status: "running" });

    // Re-schedule the campaign worker to continue processing
    await ctx.scheduler.runAfter(0, internal.campaignWorker.processBatch, {
      campaignId: args.id,
    });
  },
});

// Get a single campaign by ID (verify ownership)
export const getStatus = query({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const campaign = await ctx.db.get(args.id);
    if (!campaign || campaign.userId !== userId) {
      return null;
    }
    return campaign;
  },
});

// List campaigns for current user (newest first, bounded)
export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    return await ctx.db
      .query("campaigns")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});
