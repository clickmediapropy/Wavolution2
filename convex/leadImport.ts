import { v } from "convex/values";
import {
  query,
  action,
  internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// --- Vertical auto-detection ---

function detectVertical(text: string): string {
  const lower = text.toLowerCase();
  if (
    lower.includes("glp") ||
    lower.includes("ozempic") ||
    lower.includes("medvi")
  ) {
    return "glp1";
  }
  if (
    lower.includes("credit") ||
    lower.includes("finance") ||
    lower.includes("loan")
  ) {
    return "finance";
  }
  if (
    lower.includes("cloud") ||
    lower.includes("storage") ||
    lower.includes("hosting")
  ) {
    return "tech";
  }
  if (
    lower.includes("nutra") ||
    lower.includes("supplement") ||
    lower.includes("vitamin")
  ) {
    return "nutra";
  }
  return "glp1"; // default — dominant vertical
}

// --- Import batch mutation ---

export const importBatch = internalMutation({
  args: {
    userId: v.id("users"),
    leads: v.array(
      v.object({
        phone: v.string(),
        revenue: v.optional(v.number()),
        vertical: v.optional(v.string()),
        source: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const lead of args.leads) {
      try {
        // Check if contact already exists for this user+phone
        const existing = await ctx.db
          .query("contacts")
          .withIndex("by_userId_and_phone", (q) =>
            q.eq("userId", args.userId).eq("phone", lead.phone),
          )
          .unique();

        if (existing) {
          // Update existing contact
          await ctx.db.patch(existing._id, {
            revenue: (existing.revenue ?? 0) + (lead.revenue ?? 0),
            conversionCount: (existing.conversionCount ?? 0) + 1,
            vertical: lead.vertical ?? existing.vertical,
            source: lead.source ?? existing.source ?? "voluum",
          });
          updated++;
        } else {
          // Create new contact
          await ctx.db.insert("contacts", {
            userId: args.userId,
            phone: lead.phone,
            status: "pending",
            revenue: lead.revenue ?? 0,
            conversionCount: lead.revenue ? 1 : 0,
            vertical: lead.vertical,
            source: lead.source ?? "voluum",
          });
          created++;
        }
      } catch {
        errors++;
      }
    }

    return { created, updated, errors };
  },
});

// --- Parse and import Voluum CSV ---

export const parseVoluumCsv = action({
  args: {
    storageId: v.id("_storage"),
    vertical: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Read file from storage
    const blob = await ctx.storage.get(args.storageId);
    if (!blob) throw new Error("File not found in storage");

    const text = await blob.text();
    const lines = text.split("\n").filter((line) => line.trim().length > 0);

    if (lines.length === 0) {
      throw new Error("CSV file is empty");
    }

    // Parse header
    const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
    const phoneIdx = header.indexOf("phone");
    const revenueIdx = header.indexOf("revenue");

    if (phoneIdx === -1) {
      throw new Error('CSV must have a "phone" column');
    }

    // Parse rows and deduplicate
    const seen = new Set<string>();
    const leads: Array<{
      phone: string;
      revenue?: number;
      vertical?: string;
      source: string;
    }> = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      const rawPhone = cols[phoneIdx];
      if (!rawPhone) continue;

      // Clean phone number: strip +, spaces, dashes, parens
      const phone = rawPhone.replace(/[+\s\-()]/g, "");
      if (!phone || phone.length < 7) continue;

      // Deduplicate
      if (seen.has(phone)) continue;
      seen.add(phone);

      const revenue =
        revenueIdx !== -1 ? parseFloat(cols[revenueIdx]) : undefined;

      leads.push({
        phone,
        revenue: revenue && !isNaN(revenue) ? revenue : undefined,
        vertical: args.vertical ?? detectVertical(lines[0]),
        source: "voluum",
      });
    }

    // Split into batches of 100 and schedule
    const BATCH_SIZE = 100;
    const DELAY_MS = 500;
    let batchIndex = 0;

    for (let i = 0; i < leads.length; i += BATCH_SIZE) {
      const batch = leads.slice(i, i + BATCH_SIZE);
      await ctx.scheduler.runAfter(
        batchIndex * DELAY_MS,
        internal.leadImport.importBatch,
        { userId, leads: batch },
      );
      batchIndex++;
    }

    return {
      totalLeads: leads.length,
      batches: batchIndex,
      skippedDuplicates: seen.size < lines.length - 1 ? lines.length - 1 - seen.size : 0,
    };
  },
});

// --- Import progress query ---

export const importProgress = query({
  args: { vertical: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Count contacts by source=voluum for this user as a proxy for import progress
    if (args.vertical) {
      const contacts = await ctx.db
        .query("contacts")
        .withIndex("by_userId_and_vertical", (q) =>
          q.eq("userId", userId).eq("vertical", args.vertical!),
        )
        .take(10000);

      const voluumContacts = contacts.filter((c) => c.source === "voluum");
      return {
        imported: voluumContacts.length,
        totalInVertical: contacts.length,
      };
    }

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(10000);

    const voluumContacts = contacts.filter((c) => c.source === "voluum");
    return {
      imported: voluumContacts.length,
      totalContacts: contacts.length,
    };
  },
});
