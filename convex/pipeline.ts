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

// List all pipeline stages for the current user, ordered by position
export const listStages = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    const stages = await ctx.db
      .query("pipelineStages")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(100);
    return stages.sort((a, b) => a.position - b.position);
  },
});

// Create a new pipeline stage
export const createStage = mutation({
  args: {
    name: v.string(),
    color: v.optional(v.string()),
    position: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const name = args.name.trim();
    if (!name) {
      throw new Error("Stage name is required");
    }

    return await ctx.db.insert("pipelineStages", {
      userId,
      name,
      color: args.color || "#6b7280",
      position: args.position,
    });
  },
});

// Update a pipeline stage (rename, recolor, reposition)
export const updateStage = mutation({
  args: {
    id: v.id("pipelineStages"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    position: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const stage = await ctx.db.get(args.id);
    if (!stage || stage.userId !== userId) {
      throw new Error("Pipeline stage not found");
    }

    const patch: Record<string, string | number> = {};
    if (args.name !== undefined) {
      const name = args.name.trim();
      if (!name) throw new Error("Stage name is required");
      patch.name = name;
    }
    if (args.color !== undefined) patch.color = args.color;
    if (args.position !== undefined) patch.position = args.position;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.id, patch);
    }
  },
});

// Delete a pipeline stage and optionally reassign contacts to another stage
export const deleteStage = mutation({
  args: {
    id: v.id("pipelineStages"),
    reassignToStageId: v.optional(v.id("pipelineStages")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const stage = await ctx.db.get(args.id);
    if (!stage || stage.userId !== userId) {
      throw new Error("Pipeline stage not found");
    }

    // If reassigning, verify the target stage exists and belongs to the user
    if (args.reassignToStageId) {
      const targetStage = await ctx.db.get(args.reassignToStageId);
      if (!targetStage || targetStage.userId !== userId) {
        throw new Error("Target pipeline stage not found");
      }
    }

    // Reassign contacts in this stage
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_userId_and_pipelineStageId", (q) =>
        q.eq("userId", userId).eq("pipelineStageId", args.id),
      )
      .take(500);

    for (const contact of contacts) {
      if (args.reassignToStageId) {
        await ctx.db.patch(contact._id, {
          pipelineStageId: args.reassignToStageId,
          stageEnteredAt: Date.now(),
        });
      } else {
        await ctx.db.patch(contact._id, {
          pipelineStageId: undefined,
          stageEnteredAt: undefined,
        });
      }
    }

    await ctx.db.delete(args.id);
  },
});

// Move a contact to a different pipeline stage
export const moveContact = mutation({
  args: {
    contactId: v.id("contacts"),
    stageId: v.optional(v.id("pipelineStages")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== userId) {
      throw new Error("Contact not found");
    }

    // If assigning to a stage, verify it exists and belongs to the user
    if (args.stageId) {
      const stage = await ctx.db.get(args.stageId);
      if (!stage || stage.userId !== userId) {
        throw new Error("Pipeline stage not found");
      }
    }

    await ctx.db.patch(args.contactId, {
      pipelineStageId: args.stageId,
      stageEnteredAt: args.stageId ? Date.now() : undefined,
    });
  },
});
