import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// List all quick reply templates for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("quickReplies")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(50);
  },
});

// Create a quick reply template
export const create = mutation({
  args: {
    shortcut: v.string(),
    text: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (!args.shortcut.trim() || !args.text.trim()) {
      throw new Error("Shortcut and text are required");
    }

    return await ctx.db.insert("quickReplies", {
      userId,
      shortcut: args.shortcut.trim(),
      text: args.text.trim(),
      ...(args.category ? { category: args.category.trim() } : {}),
    });
  },
});

// Update a quick reply template
export const update = mutation({
  args: {
    id: v.id("quickReplies"),
    shortcut: v.optional(v.string()),
    text: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const reply = await ctx.db.get(args.id);
    if (!reply || reply.userId !== userId) {
      throw new Error("Quick reply not found");
    }

    const patch: Record<string, string> = {};
    if (args.shortcut !== undefined) {
      const shortcut = args.shortcut.trim();
      if (!shortcut) throw new Error("Shortcut is required");
      patch.shortcut = shortcut;
    }
    if (args.text !== undefined) {
      const text = args.text.trim();
      if (!text) throw new Error("Text is required");
      patch.text = text;
    }
    if (args.category !== undefined) {
      patch.category = args.category.trim();
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.id, patch);
    }
  },
});

// Delete a quick reply template
export const remove = mutation({
  args: { id: v.id("quickReplies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const reply = await ctx.db.get(args.id);
    if (!reply || reply.userId !== userId) {
      throw new Error("Quick reply not found");
    }

    await ctx.db.delete(args.id);
  },
});
