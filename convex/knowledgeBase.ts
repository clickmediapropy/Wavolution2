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

// List all knowledge base entries for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    return await ctx.db
      .query("knowledgeBaseEntries")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(200);
  },
});

// Create a new knowledge base entry
export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);

    if (!args.title.trim() || !args.content.trim()) {
      throw new Error("Title and content are required");
    }

    const wordCount = args.content.trim().split(/\s+/).length;

    return await ctx.db.insert("knowledgeBaseEntries", {
      userId,
      title: args.title.trim(),
      content: args.content.trim(),
      category: args.category?.trim() || undefined,
      wordCount,
    });
  },
});

// Update a knowledge base entry
export const update = mutation({
  args: {
    id: v.id("knowledgeBaseEntries"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const entry = await ctx.db.get(args.id);
    if (!entry || entry.userId !== userId) {
      throw new Error("Knowledge base entry not found");
    }

    const patch: Record<string, unknown> = {};
    if (args.title !== undefined) patch.title = args.title.trim();
    if (args.content !== undefined) {
      patch.content = args.content.trim();
      patch.wordCount = args.content.trim().split(/\s+/).length;
    }
    if (args.category !== undefined) {
      patch.category = args.category.trim() || undefined;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.id, patch);
    }
  },
});

// Delete a knowledge base entry
export const remove = mutation({
  args: { id: v.id("knowledgeBaseEntries") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const entry = await ctx.db.get(args.id);
    if (!entry || entry.userId !== userId) {
      throw new Error("Knowledge base entry not found");
    }
    await ctx.db.delete(args.id);
  },
});

// Internal: keyword-based search across KB entries for bot context
export const searchContext = internalQuery({
  args: {
    userId: v.id("users"),
    queryText: v.string(),
    maxSnippets: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("knowledgeBaseEntries")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(200);

    if (entries.length === 0) return [];

    const maxSnippets = args.maxSnippets ?? 3;
    const queryWords = args.queryText
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2); // skip tiny words

    if (queryWords.length === 0) return [];

    // Score each entry by keyword overlap
    const scored = entries.map((entry) => {
      const text = `${entry.title} ${entry.content}`.toLowerCase();
      let score = 0;
      for (const word of queryWords) {
        if (text.includes(word)) score++;
      }
      return { entry, score };
    });

    // Return top matches with score > 0
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSnippets)
      .map((s) => ({
        title: s.entry.title,
        content: s.entry.content.slice(0, 1000), // truncate for prompt context
      }));
  },
});
