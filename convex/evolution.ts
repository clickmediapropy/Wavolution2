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

// Create a new Evolution API instance for the user
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

    await ctx.runMutation(api.users.updateWhatsAppState, {
      evolutionInstanceName: args.instanceName,
      evolutionApiKey: data.hash || undefined,
      instanceCreated: true,
      connectionStatus: "pending",
    });

    return data;
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

// Check if WhatsApp is connected
export const checkConnectionStatus = action({
  args: { instanceName: v.string() },
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

    if (state === "open") {
      await ctx.runMutation(api.users.updateWhatsAppState, {
        whatsappConnected: true,
        connectionStatus: "open",
      });
    } else {
      await ctx.runMutation(api.users.updateWhatsAppState, {
        connectionStatus: state,
      });
    }

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

// Delete an instance
export const deleteInstance = action({
  args: { instanceName: v.string() },
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

    await ctx.runMutation(api.users.updateWhatsAppState, {
      instanceCreated: false,
      whatsappConnected: false,
      connectionStatus: undefined,
      evolutionInstanceName: undefined,
      evolutionApiKey: undefined,
    });

    return { success: true };
  },
});
