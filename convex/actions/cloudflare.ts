"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";

declare const process: { env: Record<string, string | undefined> };

const CF_API = "https://api.cloudflare.com/client/v4";

function getHeaders(): Record<string, string> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    throw new Error(
      "CLOUDFLARE_API_TOKEN is not set. Configure it in Convex environment variables.",
    );
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function cfFetch(
  endpoint: string,
  method: string = "GET",
  body?: unknown,
): Promise<{ success: boolean; result?: unknown; errors?: unknown[] }> {
  const response = await fetch(`${CF_API}${endpoint}`, {
    method,
    headers: getHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    console.error("[cloudflare] API error:", data.errors);
  }
  return data as { success: boolean; result?: unknown; errors?: unknown[] };
}

export const addDomain = action({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    console.log(`[cloudflare] Adding domain: ${args.domain}`);

    const data = await cfFetch("/zones", "POST", {
      name: args.domain,
      type: "full",
    });

    if (!data.success) {
      return { error: "Failed to add domain", details: data.errors };
    }

    const result = data.result as {
      id: string;
      name_servers: string[];
      status: string;
    };

    return {
      zoneId: result.id,
      nameservers: result.name_servers,
      status: result.status,
    };
  },
});

export const listDomains = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const data = await cfFetch("/zones?per_page=50");

    if (!data.success) {
      return { error: "Failed to list domains", details: data.errors };
    }

    const zones = data.result as Array<{
      id: string;
      name: string;
      status: string;
      name_servers: string[];
    }>;

    return zones.map((z) => ({
      zoneId: z.id,
      domain: z.name,
      status: z.status,
      nameservers: z.name_servers,
    }));
  },
});

export const addDnsRecord = action({
  args: {
    zoneId: v.string(),
    type: v.union(v.literal("A"), v.literal("CNAME")),
    name: v.string(),
    content: v.string(),
    proxied: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    console.log(
      `[cloudflare] Adding ${args.type} record: ${args.name} -> ${args.content}`,
    );

    const data = await cfFetch(`/zones/${args.zoneId}/dns_records`, "POST", {
      type: args.type,
      name: args.name,
      content: args.content,
      proxied: args.proxied ?? true,
      ttl: 1, // auto TTL
    });

    if (!data.success) {
      return { error: "Failed to add DNS record", details: data.errors };
    }

    const result = data.result as { id: string; name: string; type: string };
    return { recordId: result.id, name: result.name, type: result.type };
  },
});

export const getDomainStatus = action({
  args: { zoneId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const data = await cfFetch(`/zones/${args.zoneId}`);

    if (!data.success) {
      return { error: "Failed to get domain status", details: data.errors };
    }

    const result = data.result as {
      status: string;
      name_servers: string[];
      meta: { ssl_status?: string };
    };

    return {
      status: result.status,
      nameservers: result.name_servers,
      sslStatus: result.meta?.ssl_status ?? "unknown",
    };
  },
});

export const setupRedirectDomain = action({
  args: {
    zoneId: v.string(),
    serverIp: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    console.log(
      `[cloudflare] Setting up redirect domain for zone ${args.zoneId} -> ${args.serverIp}`,
    );

    // Add A record pointing to redirect server
    const dnsResult = await cfFetch(
      `/zones/${args.zoneId}/dns_records`,
      "POST",
      {
        type: "A",
        name: "@",
        content: args.serverIp,
        proxied: true, // enables SSL via Cloudflare
        ttl: 1,
      },
    );

    if (!dnsResult.success) {
      return {
        error: "Failed to create A record",
        details: dnsResult.errors,
      };
    }

    // Add wildcard CNAME for subdomains
    const wildcardResult = await cfFetch(
      `/zones/${args.zoneId}/dns_records`,
      "POST",
      {
        type: "A",
        name: "*",
        content: args.serverIp,
        proxied: true,
        ttl: 1,
      },
    );

    return {
      success: true,
      aRecord: dnsResult.success,
      wildcardRecord: wildcardResult.success,
      instructions: [
        "1. Update nameservers at your registrar to Cloudflare's NS",
        "2. SSL will be auto-provisioned via Cloudflare proxy",
        "3. Domain will be active once NS propagation completes (up to 24h)",
      ],
    };
  },
});
