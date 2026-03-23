import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

declare const process: { env: Record<string, string | undefined> };

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

// Create a new Evolution API instance and store it in the instances table
export const createInstance = action({
  args: { instanceName: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const baseUrl = getBaseUrl();
    const apiKey = getGlobalApiKey();

    const res = await fetch(`${baseUrl}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        instanceName: args.instanceName,
        integration: "WHATSAPP-BAILEYS",
        qrcode: true,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create instance: ${text}`);
    }

    const data = await res.json();

    // Store in instances table
    const instanceId: string = await ctx.runMutation(api.instances.create, {
      name: args.instanceName,
      apiKey: data.hash || undefined,
    });

    return { ...data, instanceId } as Record<string, unknown>;
  },
});

// Get QR code for connecting WhatsApp
export const getQrCode = action({
  args: { instanceName: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const baseUrl = getBaseUrl();
    const apiKey = getGlobalApiKey();

    const res = await fetch(
      `${baseUrl}/instance/connect/${args.instanceName}`,
      {
        method: "GET",
        headers: { apikey: apiKey },
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to get QR code: ${text}`);
    }

    return await res.json();
  },
});

// Check if WhatsApp is connected — updates the instances table
export const checkConnectionStatus = action({
  args: {
    instanceName: v.string(),
    instanceId: v.id("instances"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const baseUrl = getBaseUrl();
    const apiKey = getGlobalApiKey();

    const res = await fetch(
      `${baseUrl}/instance/connectionState/${args.instanceName}`,
      {
        method: "GET",
        headers: { apikey: apiKey },
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to check status: ${text}`);
    }

    const data = await res.json();
    const state = data.instance?.state || data.state || "unknown";

    await ctx.runMutation(api.instances.updateState, {
      id: args.instanceId,
      whatsappConnected: state === "open",
      connectionStatus: state,
    });

    return { state };
  },
});

// Send a text message
export const sendText = action({
  args: {
    instanceName: v.string(),
    phone: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const recentCount: number = await ctx.runQuery(api.messages.countRecent, { minutes: 60 });
    if (recentCount >= 100) {
      throw new Error("Rate limit exceeded. Max 100 messages per hour. Please wait and try again.");
    }

    const baseUrl = getBaseUrl();
    const apiKey = getGlobalApiKey();

    const res = await fetch(
      `${baseUrl}/message/sendText/${args.instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
        body: JSON.stringify({
          number: args.phone,
          text: args.message,
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to send message: ${text}`);
    }

    return await res.json();
  },
});

// Send a media message — accepts storageId, resolves URL server-side
export const sendMedia = action({
  args: {
    instanceName: v.string(),
    phone: v.string(),
    storageId: v.id("_storage"),
    mediaType: v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("document"),
      v.literal("audio"),
    ),
    caption: v.optional(v.string()),
    fileName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const recentCount: number = await ctx.runQuery(api.messages.countRecent, { minutes: 60 });
    if (recentCount >= 100) {
      throw new Error("Rate limit exceeded. Max 100 messages per hour. Please wait and try again.");
    }

    // Resolve storage URL server-side
    const mediaUrl: string | null = await ctx.runQuery(
      api.storage.getFileUrl,
      { storageId: args.storageId },
    );
    if (!mediaUrl) throw new Error("Media file not found");

    const baseUrl = getBaseUrl();
    const apiKey = getGlobalApiKey();

    const res = await fetch(
      `${baseUrl}/message/sendMedia/${args.instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
        body: JSON.stringify({
          number: args.phone,
          mediatype: args.mediaType,
          media: mediaUrl,
          caption: args.caption || "",
          fileName: args.fileName || "",
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to send media: ${text}`);
    }

    return await res.json();
  },
});

// Delete an instance from Evolution API and remove from instances table
export const deleteInstance = action({
  args: {
    instanceName: v.string(),
    instanceId: v.id("instances"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const baseUrl = getBaseUrl();
    const apiKey = getGlobalApiKey();

    const res = await fetch(
      `${baseUrl}/instance/delete/${args.instanceName}`,
      {
        method: "DELETE",
        headers: { apikey: apiKey },
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to delete instance: ${text}`);
    }

    // Remove from instances table
    await ctx.runMutation(api.instances.remove, { id: args.instanceId });

    return { success: true };
  },
});

// Check which phone numbers have WhatsApp accounts
export const checkNumbers = action({
  args: {
    instanceName: v.string(),
    numbers: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.numbers.length === 0) return [];
    if (args.numbers.length > 200) {
      throw new Error("Cannot check more than 200 numbers at once");
    }

    const baseUrl = getBaseUrl();
    const apiKey = getGlobalApiKey();

    const res = await fetch(
      `${baseUrl}/chat/whatsappNumbers/${args.instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
        body: JSON.stringify({ numbers: args.numbers }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to check numbers: ${text}`);
    }

    const results: Array<{ jid: string; exists: boolean; number: string }> =
      await res.json();
    return results;
  },
});

// Register webhook on Evolution API instance to send events to Convex
export const registerWebhook = action({
  args: { instanceName: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const baseUrl = getBaseUrl();
    const apiKey = getGlobalApiKey();

    // The Convex site URL for our webhook endpoint
    const convexSiteUrl =
      process.env.CONVEX_SITE_URL || process.env.VITE_CONVEX_SITE_URL;
    if (!convexSiteUrl) {
      throw new Error("CONVEX_SITE_URL not configured");
    }
    const webhookUrl = `${convexSiteUrl}/webhooks/evolution`;

    const res = await fetch(`${baseUrl}/webhook/set/${args.instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        url: webhookUrl,
        webhook_by_events: false,
        webhook_base64: false,
        events: [
          "MESSAGES_UPDATE",
          "MESSAGES_UPSERT",
          "CONNECTION_UPDATE",
          "SEND_MESSAGE",
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to register webhook: ${text}`);
    }

    return await res.json();
  },
});
