import { query, mutation, internalQuery, internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Step validator — reused across mutations
const stepValidator = v.object({
  delayMinutes: v.number(),
  messageTemplate: v.string(),
});

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

// List followup sequences for current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    return await ctx.db
      .query("followupSequences")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});

// Get a single sequence by ID (verify ownership)
export const get = query({
  args: { id: v.id("followupSequences") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const seq = await ctx.db.get(args.id);
    if (!seq || seq.userId !== userId) {
      return null;
    }
    return seq;
  },
});

// Create a new followup sequence
export const create = mutation({
  args: {
    name: v.string(),
    steps: v.array(stepValidator),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);

    if (!args.name.trim()) {
      throw new Error("Sequence name is required");
    }
    if (args.steps.length === 0) {
      throw new Error("At least one step is required");
    }
    for (const step of args.steps) {
      if (step.delayMinutes < 1) {
        throw new Error("Delay must be at least 1 minute");
      }
      if (!step.messageTemplate.trim()) {
        throw new Error("Message template cannot be empty");
      }
    }

    return await ctx.db.insert("followupSequences", {
      userId,
      name: args.name.trim(),
      steps: args.steps.map((s) => ({
        delayMinutes: s.delayMinutes,
        messageTemplate: s.messageTemplate.trim(),
      })),
      isActive: false,
    });
  },
});

// Update an existing followup sequence
export const update = mutation({
  args: {
    id: v.id("followupSequences"),
    name: v.optional(v.string()),
    steps: v.optional(v.array(stepValidator)),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const seq = await ctx.db.get(args.id);
    if (!seq || seq.userId !== userId) {
      throw new Error("Sequence not found");
    }

    const patch: Record<string, unknown> = {};

    if (args.name !== undefined) {
      if (!args.name.trim()) {
        throw new Error("Sequence name is required");
      }
      patch.name = args.name.trim();
    }

    if (args.steps !== undefined) {
      if (args.steps.length === 0) {
        throw new Error("At least one step is required");
      }
      for (const step of args.steps) {
        if (step.delayMinutes < 1) {
          throw new Error("Delay must be at least 1 minute");
        }
        if (!step.messageTemplate.trim()) {
          throw new Error("Message template cannot be empty");
        }
      }
      patch.steps = args.steps.map((s) => ({
        delayMinutes: s.delayMinutes,
        messageTemplate: s.messageTemplate.trim(),
      }));
    }

    if (args.isActive !== undefined) {
      patch.isActive = args.isActive;
    }

    await ctx.db.patch(args.id, patch);
  },
});

// Delete a followup sequence
export const remove = mutation({
  args: { id: v.id("followupSequences") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const seq = await ctx.db.get(args.id);
    if (!seq || seq.userId !== userId) {
      throw new Error("Sequence not found");
    }
    await ctx.db.delete(args.id);
  },
});

// Toggle active/inactive
export const toggleActive = mutation({
  args: { id: v.id("followupSequences") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const seq = await ctx.db.get(args.id);
    if (!seq || seq.userId !== userId) {
      throw new Error("Sequence not found");
    }
    await ctx.db.patch(args.id, { isActive: !seq.isActive });
  },
});

// Internal mutation to log the followup message
export const logFollowupMessage = internalMutation({
  args: {
    userId: v.id("users"),
    phone: v.string(),
    message: v.string(),
    sequenceId: v.id("followupSequences"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      userId: args.userId,
      phone: args.phone,
      message: args.message,
      status: "pending",
      direction: "outgoing",
      sentBy: "campaign",
    });
  },
});

// Internal action: schedule followup steps for a contact
// This schedules each step with ctx.scheduler.runAfter using cumulative delay
export const scheduleFollowup = internalAction({
  args: {
    sequenceId: v.id("followupSequences"),
    userId: v.id("users"),
    phone: v.string(),
    contactName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const seq = await ctx.runQuery(internal.followups.getInternal, {
      id: args.sequenceId,
    });
    if (!seq || !seq.isActive) {
      return;
    }

    let cumulativeDelayMs = 0;
    for (const step of seq.steps) {
      cumulativeDelayMs += step.delayMinutes * 60 * 1000;

      // Replace {{name}} placeholder in template
      const message = step.messageTemplate.replace(
        /\{\{name\}\}/g,
        args.contactName ?? "",
      );

      await ctx.scheduler.runAfter(
        cumulativeDelayMs,
        internal.followups.logFollowupMessage,
        {
          userId: args.userId,
          phone: args.phone,
          message,
          sequenceId: args.sequenceId,
        },
      );
    }
  },
});

// Internal query to get sequence without auth check (for scheduled actions)
export const getInternal = internalQuery({
  args: { id: v.id("followupSequences") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
