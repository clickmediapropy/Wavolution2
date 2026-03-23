import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

declare const process: { env: Record<string, string | undefined> };

const BATCH_SIZE = 20;

function getBaseUrl(): string {
  const url = process.env.EVOLUTION_API_URL;
  if (!url) throw new Error("EVOLUTION_API_URL not configured");
  return url.replace(/\/$/, "");
}

function getGlobalApiKey(): string {
  const key = process.env.EVOLUTION_API_KEY;
  if (!key) throw new Error("EVOLUTION_API_KEY not configured");
  return key;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function personalizeMessage(
  template: string,
  contact: {
    firstName?: string;
    lastName?: string;
    name?: string;
    phone: string;
  },
): string {
  const fullName =
    [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
    contact.name ||
    contact.phone;
  return template
    .replace(/\{name\}/g, fullName)
    .replace(/\{phone\}/g, contact.phone);
}

// --- Internal queries ---

export const getCampaignState = internalQuery({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.campaignId);
  },
});

export const getInstance = internalQuery({
  args: { instanceId: v.id("instances") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.instanceId);
  },
});

export const getFileUrl = internalQuery({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const getUnprocessedContacts = internalQuery({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return [];

    // Build set of already-sent phone numbers for this campaign
    const sentMessages = await ctx.db
      .query("messages")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .collect();
    const sentPhones = new Set(sentMessages.map((m) => m.phone));

    // Resolve contacts based on recipientType
    let contacts;
    if (campaign.recipientType === "manual" && campaign.selectedContactIds) {
      const all = [];
      for (const id of campaign.selectedContactIds) {
        const contact = await ctx.db.get(id);
        if (contact) all.push(contact);
      }
      contacts = all;
    } else {
      const allContacts = await ctx.db
        .query("contacts")
        .withIndex("by_userId", (q) => q.eq("userId", campaign.userId))
        .collect();
      contacts =
        campaign.recipientType === "pending"
          ? allContacts.filter((c) => c.status === "pending")
          : allContacts;
    }

    // Filter out already-processed, return next batch
    return contacts.filter((c) => !sentPhones.has(c.phone)).slice(0, BATCH_SIZE);
  },
});

// --- Internal mutations ---

export const recordSuccess = internalMutation({
  args: {
    campaignId: v.id("campaigns"),
    userId: v.id("users"),
    instanceId: v.optional(v.id("instances")),
    phone: v.string(),
    message: v.string(),
    whatsappMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find or create conversation for this contact
    let conversation = await ctx.db
      .query("conversations")
      .withIndex("by_userId_and_phone", (q) =>
        q.eq("userId", args.userId).eq("phone", args.phone),
      )
      .first();

    if (!conversation) {
      const contact = await ctx.db
        .query("contacts")
        .withIndex("by_userId_and_phone", (q) =>
          q.eq("userId", args.userId).eq("phone", args.phone),
        )
        .unique();

      const contactName = contact
        ? [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
          contact.name ||
          args.phone
        : args.phone;

      const convId = await ctx.db.insert("conversations", {
        userId: args.userId,
        instanceId: args.instanceId,
        contactId: contact?._id,
        phone: args.phone,
        status: "human",
        unreadCount: 0,
        hasBeenInteracted: true,
        isArchived: false,
        contactName,
      });
      conversation = await ctx.db.get(convId);
    }

    await ctx.db.insert("messages", {
      userId: args.userId,
      instanceId: args.instanceId,
      campaignId: args.campaignId,
      conversationId: conversation?._id,
      phone: args.phone,
      message: args.message,
      status: "sent",
      whatsappMessageId: args.whatsappMessageId,
      direction: "outgoing",
      sentBy: "campaign",
    });

    // Update conversation denormalized fields
    if (conversation) {
      await ctx.db.patch(conversation._id, {
        lastMessageAt: Date.now(),
        lastMessageText: args.message.slice(0, 200),
        lastMessageDirection: "outbound",
        hasBeenInteracted: true,
      });
    }

    const campaign = await ctx.db.get(args.campaignId);
    if (campaign) {
      await ctx.db.patch(args.campaignId, {
        processed: campaign.processed + 1,
        sent: campaign.sent + 1,
      });
    }

    // Mark contact as sent
    const contact = await ctx.db
      .query("contacts")
      .withIndex("by_userId_and_phone", (q) =>
        q.eq("userId", args.userId).eq("phone", args.phone),
      )
      .unique();
    if (contact) {
      await ctx.db.patch(contact._id, { status: "sent", sentAt: Date.now() });
    }
  },
});

export const recordFailure = internalMutation({
  args: {
    campaignId: v.id("campaigns"),
    userId: v.id("users"),
    instanceId: v.optional(v.id("instances")),
    phone: v.string(),
    message: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      userId: args.userId,
      instanceId: args.instanceId,
      campaignId: args.campaignId,
      phone: args.phone,
      message: args.message,
      status: "failed",
    });

    const campaign = await ctx.db.get(args.campaignId);
    if (campaign) {
      await ctx.db.patch(args.campaignId, {
        processed: campaign.processed + 1,
        failed: campaign.failed + 1,
      });
    }

    const contact = await ctx.db
      .query("contacts")
      .withIndex("by_userId_and_phone", (q) =>
        q.eq("userId", args.userId).eq("phone", args.phone),
      )
      .unique();
    if (contact) {
      await ctx.db.patch(contact._id, { status: "failed" });
    }
  },
});

export const completeCampaign = internalMutation({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (campaign && campaign.status === "running") {
      await ctx.db.patch(args.campaignId, {
        status: "completed",
        completedAt: Date.now(),
      });
    }
  },
});

// --- Main worker action ---

export const processBatch = internalAction({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    // 1. Check campaign is still running
    const campaign = await ctx.runQuery(
      internal.campaignWorker.getCampaignState,
      { campaignId: args.campaignId },
    );
    if (!campaign || campaign.status !== "running") return;

    if (!campaign.instanceId) {
      console.error(`Campaign ${args.campaignId}: no instanceId`);
      return;
    }

    // 2. Get instance info for the Evolution API call
    const instance = await ctx.runQuery(
      internal.campaignWorker.getInstance,
      { instanceId: campaign.instanceId },
    );
    if (!instance) {
      console.error(`Campaign ${args.campaignId}: instance not found`);
      return;
    }

    // 3. Get next batch of unprocessed contacts
    const contacts = await ctx.runQuery(
      internal.campaignWorker.getUnprocessedContacts,
      { campaignId: args.campaignId },
    );

    if (contacts.length === 0) {
      await ctx.runMutation(internal.campaignWorker.completeCampaign, {
        campaignId: args.campaignId,
      });
      return;
    }

    const baseUrl = getBaseUrl();
    const apiKey = getGlobalApiKey();

    // Resolve media URL once if campaign has media
    let mediaUrl: string | null = null;
    if (campaign.hasMedia && campaign.mediaStorageIds?.length) {
      mediaUrl = await ctx.runQuery(internal.campaignWorker.getFileUrl, {
        storageId: campaign.mediaStorageIds[0]!,
      });
    }

    // 4. Process each contact in the batch
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i]!;

      // Re-check status before each send (user may have paused/stopped)
      const current = await ctx.runQuery(
        internal.campaignWorker.getCampaignState,
        { campaignId: args.campaignId },
      );
      if (!current || current.status !== "running") return;

      const message = personalizeMessage(campaign.messageTemplate, contact);

      try {
        let apiResponse: Record<string, unknown>;

        if (mediaUrl) {
          const res = await fetch(
            `${baseUrl}/message/sendMedia/${instance.name}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: apiKey,
              },
              body: JSON.stringify({
                number: contact.phone,
                mediatype: "image",
                media: mediaUrl,
                caption: message,
                fileName: "",
              }),
            },
          );
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${await res.text()}`);
          }
          apiResponse = await res.json();
        } else {
          const res = await fetch(
            `${baseUrl}/message/sendText/${instance.name}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: apiKey,
              },
              body: JSON.stringify({
                number: contact.phone,
                text: message,
              }),
            },
          );
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${await res.text()}`);
          }
          apiResponse = await res.json();
        }

        // Extract WhatsApp message ID from API response
        const whatsappMessageId =
          (apiResponse.key as Record<string, unknown>)?.id as string | undefined;

        await ctx.runMutation(internal.campaignWorker.recordSuccess, {
          campaignId: args.campaignId,
          userId: campaign.userId,
          instanceId: campaign.instanceId,
          phone: contact.phone,
          message,
          whatsappMessageId,
        });
      } catch (err) {
        console.error(`Campaign ${args.campaignId}: failed ${contact.phone}:`, err);
        await ctx.runMutation(internal.campaignWorker.recordFailure, {
          campaignId: args.campaignId,
          userId: campaign.userId,
          instanceId: campaign.instanceId,
          phone: contact.phone,
          message,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }

      // Delay between messages (skip after last contact in batch)
      if (i < contacts.length - 1) {
        await sleep(campaign.delay);
      }
    }

    // 5. Schedule next batch
    await ctx.scheduler.runAfter(500, internal.campaignWorker.processBatch, {
      campaignId: args.campaignId,
    });
  },
});
