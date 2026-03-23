import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper: get authenticated user ID or throw
async function getAuthedUserId(ctx: QueryCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

// Helper: escape a CSV field value
function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Export contacts as CSV string
export const exportContacts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(10000);

    const header = "phone,first_name,last_name,tags,status,engagement_score";
    const rows = contacts.map((c) => {
      const phone = csvEscape(c.phone);
      const firstName = csvEscape(c.firstName ?? "");
      const lastName = csvEscape(c.lastName ?? "");
      const tags = csvEscape((c.tags ?? []).join(";"));
      const status = csvEscape(c.status);
      const score = c.engagementScore !== undefined ? String(c.engagementScore) : "";
      return `${phone},${firstName},${lastName},${tags},${status},${score}`;
    });

    return {
      csv: [header, ...rows].join("\n"),
      count: contacts.length,
    };
  },
});

// Export messages as CSV string
export const exportMessages = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(10000);

    const header = "phone,message,status,direction,timestamp";
    const rows = messages.map((m) => {
      const phone = csvEscape(m.phone);
      const message = csvEscape(m.message);
      const status = csvEscape(m.status);
      const direction = csvEscape(m.direction ?? "outgoing");
      const timestamp = new Date(m._creationTime).toISOString();
      return `${phone},${message},${status},${direction},${timestamp}`;
    });

    return {
      csv: [header, ...rows].join("\n"),
      count: messages.length,
    };
  },
});

// Export messages for a specific campaign as CSV string
export const exportCampaignMessages = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    const userId = await getAuthedUserId(ctx);

    // Verify campaign ownership
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign || campaign.userId !== userId) {
      throw new Error("Campaign not found");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .take(10000);

    const header = "phone,message,status,direction,timestamp";
    const rows = messages.map((m) => {
      const phone = csvEscape(m.phone);
      const message = csvEscape(m.message);
      const status = csvEscape(m.status);
      const direction = csvEscape(m.direction ?? "outgoing");
      const timestamp = new Date(m._creationTime).toISOString();
      return `${phone},${message},${status},${direction},${timestamp}`;
    });

    return {
      csv: [header, ...rows].join("\n"),
      count: messages.length,
      campaignName: campaign.name,
    };
  },
});
