"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";

declare const process: { env: Record<string, string | undefined> };

function getConfig(): { baseUrl: string; apiKey: string } {
  const baseUrl = process.env.HEROSMS_BASE_URL;
  const apiKey = process.env.HEROSMS_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "HeroSMS not configured. Set HEROSMS_BASE_URL and HEROSMS_API_KEY in Convex environment variables.",
    );
  }

  return { baseUrl, apiKey };
}

async function heroFetch(
  endpoint: string,
  method: string = "GET",
  body?: unknown,
): Promise<unknown> {
  const { baseUrl, apiKey } = getConfig();

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[herosms] API error ${response.status}:`, text);
    throw new Error(`HeroSMS API error: ${response.status}`);
  }

  return response.json();
}

// TODO: HeroSMS API documentation is limited.
// These actions implement the expected REST API pattern.
// If the actual API differs, adjust endpoints and payloads accordingly.

export const listAvailableNumbers = action({
  args: {
    country: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const country = args.country ?? "US";
    const type = args.type ?? "mobile";

    console.log(
      `[herosms] Listing available ${type} numbers in ${country}`,
    );

    try {
      const data = await heroFetch(
        `/api/v1/numbers/available?country=${country}&type=${type}`,
      );
      return data;
    } catch (err) {
      console.error("[herosms] listAvailableNumbers failed:", err);
      return {
        error: "Failed to list available numbers. Check API configuration.",
        // Mock response format for development
        mockFormat: [
          {
            number: "+1234567890",
            country: "US",
            type: "mobile",
            price: 1.5,
            capabilities: ["sms", "whatsapp"],
          },
        ],
      };
    }
  },
});

export const purchaseNumber = action({
  args: {
    number: v.optional(v.string()),
    country: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    console.log(`[herosms] Purchasing number: ${args.number ?? "auto-select"}`);

    try {
      const data = await heroFetch("/api/v1/numbers/purchase", "POST", {
        number: args.number,
        country: args.country ?? "US",
        type: args.type ?? "mobile",
      });
      return data;
    } catch (err) {
      console.error("[herosms] purchaseNumber failed:", err);
      return {
        error: "Failed to purchase number. Check API configuration.",
        mockFormat: {
          number: "+1234567890",
          purchaseId: "pur_abc123",
          status: "active",
          monthlyPrice: 1.5,
        },
      };
    }
  },
});

export const listMyNumbers = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    console.log("[herosms] Listing purchased numbers");

    try {
      const data = await heroFetch("/api/v1/numbers");
      return data;
    } catch (err) {
      console.error("[herosms] listMyNumbers failed:", err);
      return {
        error: "Failed to list numbers. Check API configuration.",
        mockFormat: [
          {
            number: "+1234567890",
            status: "active",
            expires: "2026-04-23",
            monthlyPrice: 1.5,
          },
        ],
      };
    }
  },
});

export const getNumberStatus = action({
  args: { number: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    console.log(`[herosms] Getting status for: ${args.number}`);

    try {
      const encoded = encodeURIComponent(args.number);
      const data = await heroFetch(`/api/v1/numbers/${encoded}/status`);
      return data;
    } catch (err) {
      console.error("[herosms] getNumberStatus failed:", err);
      return {
        error: "Failed to get number status. Check API configuration.",
        mockFormat: {
          number: args.number,
          status: "active",
          messages: [],
        },
      };
    }
  },
});
