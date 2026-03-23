import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const CATEGORIES = ["Greeting", "Follow-up", "Promotion", "Support"] as const;

/** Extract {{variable}} placeholders from a template string. */
function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  // Deduplicate
  const unique = [...new Set(matches.map((m) => m.slice(2, -2)))];
  return unique;
}

// List all templates for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("templates")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(200);
  },
});

// Create a template
export const create = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const name = args.name.trim();
    const content = args.content.trim();
    const category = args.category.trim();

    if (!name) throw new Error("Name is required");
    if (!content) throw new Error("Content is required");
    if (!category) throw new Error("Category is required");

    const variables = extractVariables(content);

    return await ctx.db.insert("templates", {
      userId,
      name,
      category,
      content,
      variables,
    });
  },
});

// Update a template
export const update = mutation({
  args: {
    id: v.id("templates"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const template = await ctx.db.get(args.id);
    if (!template || template.userId !== userId) {
      throw new Error("Template not found");
    }

    const patch: Record<string, string | string[]> = {};

    if (args.name !== undefined) {
      const name = args.name.trim();
      if (!name) throw new Error("Name is required");
      patch.name = name;
    }
    if (args.category !== undefined) {
      const category = args.category.trim();
      if (!category) throw new Error("Category is required");
      patch.category = category;
    }
    if (args.content !== undefined) {
      const content = args.content.trim();
      if (!content) throw new Error("Content is required");
      patch.content = content;
      patch.variables = extractVariables(content);
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.id, patch);
    }
  },
});

// Delete a template
export const remove = mutation({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const template = await ctx.db.get(args.id);
    if (!template || template.userId !== userId) {
      throw new Error("Template not found");
    }

    await ctx.db.delete(args.id);
  },
});
