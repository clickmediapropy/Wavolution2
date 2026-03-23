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

// Get a contact by phone number (lightweight, for inbox use)
export const getByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    return await ctx.db
      .query("contacts")
      .withIndex("by_userId_and_phone", (q) =>
        q.eq("userId", userId).eq("phone", args.phone),
      )
      .unique();
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

// Bulk add a tag to multiple contacts (max 100)
export const bulkAddTag = mutation({
  args: {
    contactIds: v.array(v.id("contacts")),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.contactIds.length > 100) {
      throw new Error("Cannot update more than 100 contacts at once");
    }
    const tag = args.tag.trim();
    if (!tag) {
      throw new Error("Tag is required");
    }
    const userId = await getAuthedUserId(ctx);
    let updated = 0;
    for (const id of args.contactIds) {
      const contact = await ctx.db.get(id);
      if (!contact || contact.userId !== userId) continue;
      const currentTags = contact.tags || [];
      if (!currentTags.includes(tag)) {
        await ctx.db.patch(id, { tags: [...currentTags, tag] });
        updated++;
      }
    }
    return { updated };
  },
});

// Bulk remove a tag from multiple contacts (max 100)
export const bulkRemoveTag = mutation({
  args: {
    contactIds: v.array(v.id("contacts")),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.contactIds.length > 100) {
      throw new Error("Cannot update more than 100 contacts at once");
    }
    const tag = args.tag.trim();
    if (!tag) {
      throw new Error("Tag is required");
    }
    const userId = await getAuthedUserId(ctx);
    let updated = 0;
    for (const id of args.contactIds) {
      const contact = await ctx.db.get(id);
      if (!contact || contact.userId !== userId) continue;
      const currentTags = contact.tags || [];
      if (currentTags.includes(tag)) {
        await ctx.db.patch(id, { tags: currentTags.filter((t) => t !== tag) });
        updated++;
      }
    }
    return { updated };
  },
});

// Segment counts — computes counts for all predefined segments in one query
export const segmentCounts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const total = contacts.length;
    let replied = 0;
    let engaged = 0;
    let pending = 0;
    let sent = 0;
    let failed = 0;
    let tagged = 0;
    let noWhatsApp = 0;

    for (const c of contacts) {
      if (c.repliedAt !== undefined) replied++;
      if (c.engagementScore !== undefined && c.engagementScore > 50) engaged++;
      if (c.status === "pending") pending++;
      if (c.status === "sent") sent++;
      if (c.status === "failed") {
        failed++;
        noWhatsApp++;
      }
      if (c.tags && c.tags.length > 0) tagged++;
    }

    return { total, replied, engaged, pending, sent, failed, tagged, noWhatsApp };
  },
});

// Block a contact
export const block = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== userId) {
      throw new Error("Contact not found");
    }
    await ctx.db.patch(args.contactId, { isBlocked: true });
  },
});

// Unblock a contact
export const unblock = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== userId) {
      throw new Error("Contact not found");
    }
    await ctx.db.patch(args.contactId, { isBlocked: false });
  },
});

// --- Duplicate Detection & Merge ---

// Levenshtein distance between two strings (case-insensitive)
function levenshtein(a: string, b: string): number {
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  const m = al.length;
  const n = bl.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array<number>(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = al[i - 1] === bl[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost,
      );
    }
  }
  return dp[m]![n]!;
}

// Compute a "richness" score -- contacts with more data should be kept
function contactRichness(contact: {
  tags?: string[];
  engagementScore?: number;
  repliedAt?: number;
  lastMessageAt?: number;
  customFields?: Record<string, string | number | boolean>;
  aiSummary?: string;
  pipelineStageId?: any;
}): number {
  let score = 0;
  if (contact.tags && contact.tags.length > 0) score += contact.tags.length * 2;
  if (contact.engagementScore) score += contact.engagementScore;
  if (contact.repliedAt) score += 10;
  if (contact.lastMessageAt) score += 5;
  if (contact.customFields) score += Object.keys(contact.customFields).length * 3;
  if (contact.aiSummary) score += 5;
  if (contact.pipelineStageId) score += 5;
  return score;
}

// Find duplicate contacts: exact phone matches and similar names (Levenshtein)
export const findDuplicates = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(2000);

    type DuplicatePair = {
      contactA: (typeof contacts)[number];
      contactB: (typeof contacts)[number];
      reason: "phone" | "name";
      distance?: number;
    };

    const pairs: DuplicatePair[] = [];
    const seenPairKeys = new Set<string>();

    // 1. Exact phone duplicates (shouldn't exist but can via imports/migrations)
    const phoneMap = new Map<string, typeof contacts>();
    for (const c of contacts) {
      const normalized = c.phone.replace(/\D/g, "");
      const group = phoneMap.get(normalized) ?? [];
      group.push(c);
      phoneMap.set(normalized, group);
    }
    for (const group of phoneMap.values()) {
      if (group.length > 1) {
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const a = group[i]!;
            const b = group[j]!;
            const key = [a._id, b._id].sort().join(":");
            if (!seenPairKeys.has(key)) {
              seenPairKeys.add(key);
              pairs.push({
                contactA: a,
                contactB: b,
                reason: "phone",
              });
            }
          }
        }
      }
    }

    // 2. Similar names (Levenshtein distance <= 2, both names must be non-empty)
    const NAME_THRESHOLD = 2;
    for (let i = 0; i < contacts.length; i++) {
      const cA = contacts[i]!;
      const nameA = [cA.firstName, cA.lastName].filter(Boolean).join(" ");
      if (!nameA || nameA.length < 3) continue;

      for (let j = i + 1; j < contacts.length; j++) {
        const cB = contacts[j]!;
        const nameB = [cB.firstName, cB.lastName].filter(Boolean).join(" ");
        if (!nameB || nameB.length < 3) continue;

        const dist = levenshtein(nameA, nameB);
        if (dist <= NAME_THRESHOLD && dist < Math.min(nameA.length, nameB.length)) {
          const key = [cA._id, cB._id].sort().join(":");
          if (!seenPairKeys.has(key)) {
            seenPairKeys.add(key);
            pairs.push({
              contactA: cA,
              contactB: cB,
              reason: "name",
              distance: dist,
            });
          }
        }
      }
    }

    // Count messages per contact for merge decision (only for contacts in pairs)
    const contactIdsInPairs = new Set<string>();
    for (const p of pairs) {
      contactIdsInPairs.add(p.contactA._id);
      contactIdsInPairs.add(p.contactB._id);
    }

    const messageCountMap: Record<string, number> = {};
    for (const c of contacts) {
      if (!contactIdsInPairs.has(c._id)) continue;
      const msgs = await ctx.db
        .query("messages")
        .withIndex("by_userId_and_phone", (q) =>
          q.eq("userId", userId).eq("phone", c.phone),
        )
        .take(500);
      messageCountMap[c._id] = msgs.length;
    }

    return pairs.map((p) => ({
      ...p,
      messageCountA: messageCountMap[p.contactA._id] ?? 0,
      messageCountB: messageCountMap[p.contactB._id] ?? 0,
      richnessA: contactRichness(p.contactA),
      richnessB: contactRichness(p.contactB),
    }));
  },
});

// Merge two contacts: keep the "winner" and transfer data from the "loser"
export const mergeContacts = mutation({
  args: {
    keepId: v.id("contacts"),
    removeId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);
    const keep = await ctx.db.get(args.keepId);
    const remove = await ctx.db.get(args.removeId);

    if (!keep || keep.userId !== userId) {
      throw new Error("Contact to keep not found");
    }
    if (!remove || remove.userId !== userId) {
      throw new Error("Contact to remove not found");
    }

    // Merge tags (union)
    const mergedTags = Array.from(
      new Set([...(keep.tags ?? []), ...(remove.tags ?? [])]),
    );

    // Merge custom fields (keep's values win on conflict)
    const mergedCustomFields = {
      ...(remove.customFields ?? {}),
      ...(keep.customFields ?? {}),
    };

    // Pick best values
    const patch: Record<string, any> = {};
    if (mergedTags.length > 0) patch.tags = mergedTags;
    if (Object.keys(mergedCustomFields).length > 0)
      patch.customFields = mergedCustomFields;
    if (!keep.firstName && remove.firstName) patch.firstName = remove.firstName;
    if (!keep.lastName && remove.lastName) patch.lastName = remove.lastName;
    if (!keep.repliedAt && remove.repliedAt) patch.repliedAt = remove.repliedAt;
    if (!keep.aiSummary && remove.aiSummary) patch.aiSummary = remove.aiSummary;
    if (!keep.pipelineStageId && remove.pipelineStageId)
      patch.pipelineStageId = remove.pipelineStageId;
    // Keep highest engagement score
    const keepScore = keep.engagementScore ?? 0;
    const removeScore = remove.engagementScore ?? 0;
    if (removeScore > keepScore) patch.engagementScore = removeScore;
    // Keep most recent lastMessageAt
    if ((remove.lastMessageAt ?? 0) > (keep.lastMessageAt ?? 0))
      patch.lastMessageAt = remove.lastMessageAt;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.keepId, patch);
    }

    // Transfer conversations from removed contact to kept contact
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_userId_and_phone", (q) =>
        q.eq("userId", userId).eq("phone", remove.phone),
      )
      .take(100);

    for (const conv of conversations) {
      await ctx.db.patch(conv._id, { contactId: args.keepId });
    }

    // Transfer messages: update phone reference on messages belonging to removed contact
    if (remove.phone !== keep.phone) {
      const removeMessages = await ctx.db
        .query("messages")
        .withIndex("by_userId_and_phone", (q) =>
          q.eq("userId", userId).eq("phone", remove.phone),
        )
        .take(1000);

      for (const msg of removeMessages) {
        await ctx.db.patch(msg._id, { phone: keep.phone });
      }
      // Also update conversations phone
      for (const conv of conversations) {
        await ctx.db.patch(conv._id, { phone: keep.phone });
      }
    }

    // Delete the removed contact
    await ctx.db.delete(args.removeId);

    return { merged: true, keptId: args.keepId };
  },
});
