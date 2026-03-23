import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
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

// Paginated contact list (newest first)
export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    return await ctx.db
      .query("contacts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// Search contacts by name using full-text search index
export const search = query({
  args: { term: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    return await ctx.db
      .query("contacts")
      .withSearchIndex("search_by_name", (q) =>
        q.search("name", args.term).eq("userId", userId),
      )
      .take(50);
  },
});

// Add a new contact (enforces unique phone per user)
export const add = mutation({
  args: {
    phone: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const phone = args.phone.trim();
    if (!phone) {
      throw new Error("Phone number is required");
    }

    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_userId_and_phone", (q) =>
        q.eq("userId", userId).eq("phone", phone),
      )
      .unique();
    if (existing) {
      throw new Error("Contact with this phone number already exists");
    }

    return await ctx.db.insert("contacts", {
      userId: userId,
      phone,
      name: args.name?.trim() || undefined,
      status: "pending",
    });
  },
});

// Update an existing contact (verify ownership, check phone uniqueness if changed)
export const update = mutation({
  args: {
    id: v.id("contacts"),
    phone: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const contact = await ctx.db.get(args.id);
    if (!contact || contact.userId !== userId) {
      throw new Error("Contact not found");
    }

    const phone = args.phone.trim();
    if (!phone) {
      throw new Error("Phone number is required");
    }

    // If phone changed, check uniqueness
    if (phone !== contact.phone) {
      const existing = await ctx.db
        .query("contacts")
        .withIndex("by_userId_and_phone", (q) =>
          q.eq("userId", userId).eq("phone", phone),
        )
        .unique();
      if (existing) {
        throw new Error("Contact with this phone number already exists");
      }
    }

    await ctx.db.patch(args.id, {
      phone,
      name: args.name?.trim() || undefined,
    });
  },
});

// Delete a single contact (verify ownership)
export const remove = mutation({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const contact = await ctx.db.get(args.id);
    if (!contact || contact.userId !== userId) {
      throw new Error("Contact not found");
    }
    await ctx.db.delete(args.id);
  },
});

// Bulk delete contacts (verify ownership, max 100)
export const removeMultiple = mutation({
  args: { ids: v.array(v.id("contacts")) },
  handler: async (ctx, args) => {
    if (args.ids.length > 100) {
      throw new Error("Cannot delete more than 100 contacts at once");
    }
    const userId = await getAuthedUserId(ctx);
    for (const id of args.ids) {
      const contact = await ctx.db.get(id);
      if (contact && contact.userId === userId) {
        await ctx.db.delete(id);
      }
    }
  },
});

// Import a batch of contacts from CSV (max 100 per call)
export const importBatch = mutation({
  args: {
    contacts: v.array(
      v.object({
        phone: v.string(),
        name: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    if (args.contacts.length > 100) {
      throw new Error("Batch size cannot exceed 100");
    }
    const userId = await getAuthedUserId(ctx);

    let added = 0;
    let duplicates = 0;
    let errors = 0;

    for (const contact of args.contacts) {
      const phone = contact.phone.trim();
      if (!phone) {
        errors++;
        continue;
      }

      const existing = await ctx.db
        .query("contacts")
        .withIndex("by_userId_and_phone", (q) =>
          q.eq("userId", userId).eq("phone", phone),
        )
        .unique();

      if (existing) {
        duplicates++;
        continue;
      }

      await ctx.db.insert("contacts", {
        userId: userId,
        phone,
        name: contact.name?.trim() || undefined,
        status: "pending",
      });
      added++;
    }

    return { added, duplicates, errors };
  },
});
