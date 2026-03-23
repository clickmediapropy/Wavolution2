import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

// Helper: get authenticated user or throw
async function getUserOrThrow(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", identity.email!))
    .unique();
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

// Paginated contact list (newest first)
export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const user = await getUserOrThrow(ctx);
    return await ctx.db
      .query("contacts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// Search contacts by name using full-text search index
export const search = query({
  args: { term: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserOrThrow(ctx);
    return await ctx.db
      .query("contacts")
      .withSearchIndex("search_by_name", (q) =>
        q.search("name", args.term).eq("userId", user._id),
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
    const user = await getUserOrThrow(ctx);
    const phone = args.phone.trim();
    if (!phone) {
      throw new Error("Phone number is required");
    }

    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_userId_and_phone", (q) =>
        q.eq("userId", user._id).eq("phone", phone),
      )
      .unique();
    if (existing) {
      throw new Error("Contact with this phone number already exists");
    }

    return await ctx.db.insert("contacts", {
      userId: user._id,
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
    const user = await getUserOrThrow(ctx);
    const contact = await ctx.db.get(args.id);
    if (!contact || contact.userId !== user._id) {
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
          q.eq("userId", user._id).eq("phone", phone),
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
    const user = await getUserOrThrow(ctx);
    const contact = await ctx.db.get(args.id);
    if (!contact || contact.userId !== user._id) {
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
    const user = await getUserOrThrow(ctx);
    for (const id of args.ids) {
      const contact = await ctx.db.get(id);
      if (contact && contact.userId === user._id) {
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
    const user = await getUserOrThrow(ctx);

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
          q.eq("userId", user._id).eq("phone", phone),
        )
        .unique();

      if (existing) {
        duplicates++;
        continue;
      }

      await ctx.db.insert("contacts", {
        userId: user._id,
        phone,
        name: contact.name?.trim() || undefined,
        status: "pending",
      });
      added++;
    }

    return { added, duplicates, errors };
  },
});
