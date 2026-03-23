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

// Count contacts for current user
export const count = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return contacts.length;
  },
});

// Count contacts added in the last 7 days
export const countThisWeek = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return contacts.filter((c) => c._creationTime > weekAgo).length;
  },
});

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

// Search contacts by first name using full-text search index
export const search = query({
  args: { term: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    return await ctx.db
      .query("contacts")
      .withSearchIndex("search_by_firstName", (q) =>
        q.search("firstName", args.term).eq("userId", userId),
      )
      .take(50);
  },
});

// Add a new contact (enforces unique phone per user)
export const add = mutation({
  args: {
    phone: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
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
      firstName: args.firstName?.trim() || undefined,
      lastName: args.lastName?.trim() || undefined,
      status: "pending",
    });
  },
});

// Update an existing contact (verify ownership, check phone uniqueness if changed)
export const update = mutation({
  args: {
    id: v.id("contacts"),
    phone: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
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
      firstName: args.firstName?.trim() || undefined,
      lastName: args.lastName?.trim() || undefined,
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

// Export all contacts for current user (capped at 10k)
export const exportAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    return await ctx.db
      .query("contacts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(10000);
  },
});

// --- CRM Functions ---

// Add a tag to a contact
export const addTag = mutation({
  args: {
    contactId: v.id("contacts"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== userId) {
      throw new Error("Contact not found");
    }

    const tag = args.tag.trim();
    if (!tag) {
      throw new Error("Tag is required");
    }

    const currentTags = contact.tags || [];
    if (currentTags.includes(tag)) {
      return; // already has this tag
    }

    await ctx.db.patch(args.contactId, {
      tags: [...currentTags, tag],
    });
  },
});

// Remove a tag from a contact
export const removeTag = mutation({
  args: {
    contactId: v.id("contacts"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== userId) {
      throw new Error("Contact not found");
    }

    const currentTags = contact.tags || [];
    const filtered = currentTags.filter((t) => t !== args.tag);
    await ctx.db.patch(args.contactId, { tags: filtered });
  },
});

// Set a custom field on a contact
export const setCustomField = mutation({
  args: {
    contactId: v.id("contacts"),
    key: v.string(),
    value: v.union(v.string(), v.number(), v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== userId) {
      throw new Error("Contact not found");
    }

    const key = args.key.trim();
    if (!key) {
      throw new Error("Field key is required");
    }

    const currentFields = contact.customFields || {};
    await ctx.db.patch(args.contactId, {
      customFields: { ...currentFields, [key]: args.value },
    });
  },
});

// Remove a custom field from a contact
export const removeCustomField = mutation({
  args: {
    contactId: v.id("contacts"),
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== userId) {
      throw new Error("Contact not found");
    }

    const currentFields = contact.customFields || {};
    const { [args.key]: _, ...rest } = currentFields;
    await ctx.db.patch(args.contactId, {
      customFields: Object.keys(rest).length > 0 ? rest : undefined,
    });
  },
});

// Get detailed contact info including conversation and recent messages
export const getDetail = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== userId) {
      return null;
    }

    // Get the conversation for this contact
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_userId_and_phone", (q) =>
        q.eq("userId", userId).eq("phone", contact.phone),
      )
      .unique();

    // Get recent messages for this contact
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_userId_and_phone", (q) =>
        q.eq("userId", userId).eq("phone", contact.phone),
      )
      .order("desc")
      .take(50);

    // Get pipeline stage info if assigned
    let pipelineStage = null;
    if (contact.pipelineStageId) {
      pipelineStage = await ctx.db.get(contact.pipelineStageId);
    }

    return {
      contact,
      conversation,
      messages,
      pipelineStage,
    };
  },
});

// List contacts filtered by tag
export const listByTag = query({
  args: { tag: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    // No tag-specific index, so filter in memory after index scan
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(1000);
    return contacts.filter(
      (c) => c.tags && c.tags.includes(args.tag),
    );
  },
});

// List contacts filtered by pipeline stage
export const listByStage = query({
  args: { stageId: v.id("pipelineStages") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    return await ctx.db
      .query("contacts")
      .withIndex("by_userId_and_pipelineStageId", (q) =>
        q.eq("userId", userId).eq("pipelineStageId", args.stageId),
      )
      .take(500);
  },
});

// Import a batch of contacts from CSV (max 100 per call)
export const importBatch = mutation({
  args: {
    contacts: v.array(
      v.object({
        phone: v.string(),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
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
        firstName: contact.firstName?.trim() || undefined,
        lastName: contact.lastName?.trim() || undefined,
        status: "pending",
      });
      added++;
    }

    return { added, duplicates, errors };
  },
});
