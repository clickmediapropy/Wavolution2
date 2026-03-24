"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";

declare const process: { env: Record<string, string | undefined> };

function getBaseUrl(): string {
  const sandbox = process.env.NAMECHEAP_SANDBOX !== "false";
  return sandbox
    ? "https://api.sandbox.namecheap.com/xml.response"
    : "https://api.namecheap.com/xml.response";
}

function getBaseParams(): URLSearchParams {
  const apiUser = process.env.NAMECHEAP_API_USER;
  const apiKey = process.env.NAMECHEAP_API_KEY;
  const clientIp = process.env.NAMECHEAP_CLIENT_IP;

  if (!apiUser || !apiKey || !clientIp) {
    throw new Error(
      "Namecheap API credentials not configured. Set NAMECHEAP_API_USER, NAMECHEAP_API_KEY, and NAMECHEAP_CLIENT_IP.",
    );
  }

  return new URLSearchParams({
    ApiUser: apiUser,
    ApiKey: apiKey,
    UserName: apiUser,
    ClientIp: clientIp,
  });
}

// Simple XML attribute parser for Namecheap's responses
function extractAttributes(
  xml: string,
  tagName: string,
): Array<Record<string, string>> {
  const results: Array<Record<string, string>> = [];
  const regex = new RegExp(`<${tagName}\\s+([^>]*)\\/?\\s*>`, "gi");
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const attrs: Record<string, string> = {};
    const attrRegex = /(\w+)="([^"]*)"/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(match[1])) !== null) {
      attrs[attrMatch[1]] = attrMatch[2];
    }
    results.push(attrs);
  }
  return results;
}

function hasErrors(xml: string): string | null {
  const errorMatch = xml.match(/<Error[^>]*>([\s\S]*?)<\/Error>/i);
  return errorMatch ? errorMatch[1].trim() : null;
}

export const checkAvailability = action({
  args: { domains: v.array(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    if (args.domains.length > 50) {
      throw new Error("Maximum 50 domains per check");
    }

    const params = getBaseParams();
    params.set("Command", "namecheap.domains.check");
    params.set("DomainList", args.domains.join(","));

    console.log(
      `[namecheap] Checking availability for ${args.domains.length} domains`,
    );

    const response = await fetch(`${getBaseUrl()}?${params}`);
    const xml = await response.text();

    const error = hasErrors(xml);
    if (error) {
      return { error: `Namecheap API error: ${error}` };
    }

    const results = extractAttributes(xml, "DomainCheckResult");
    return results.map((r) => ({
      domain: r.Domain,
      available: r.Available === "true",
      isPremium: r.IsPremiumName === "true",
      price: r.PremiumRegistrationPrice
        ? parseFloat(r.PremiumRegistrationPrice)
        : undefined,
    }));
  },
});

export const registerDomain = action({
  args: {
    domain: v.string(),
    years: v.optional(v.number()),
    nameservers: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const params = getBaseParams();
    params.set("Command", "namecheap.domains.create");
    params.set("DomainName", args.domain);
    params.set("Years", String(args.years ?? 1));

    // Set nameservers if provided (e.g., Cloudflare NS)
    if (args.nameservers && args.nameservers.length > 0) {
      params.set("Nameservers", args.nameservers.join(","));
    }

    // Registrant info from env defaults
    const registrantFields = [
      "RegistrantFirstName",
      "RegistrantLastName",
      "RegistrantAddress1",
      "RegistrantCity",
      "RegistrantStateProvince",
      "RegistrantPostalCode",
      "RegistrantCountry",
      "RegistrantPhone",
      "RegistrantEmailAddress",
      "TechFirstName",
      "TechLastName",
      "TechAddress1",
      "TechCity",
      "TechStateProvince",
      "TechPostalCode",
      "TechCountry",
      "TechPhone",
      "TechEmailAddress",
      "AdminFirstName",
      "AdminLastName",
      "AdminAddress1",
      "AdminCity",
      "AdminStateProvince",
      "AdminPostalCode",
      "AdminCountry",
      "AdminPhone",
      "AdminEmailAddress",
      "AuxBillingFirstName",
      "AuxBillingLastName",
      "AuxBillingAddress1",
      "AuxBillingCity",
      "AuxBillingStateProvince",
      "AuxBillingPostalCode",
      "AuxBillingCountry",
      "AuxBillingPhone",
      "AuxBillingEmailAddress",
    ];

    // Use env-based defaults for registrant info
    for (const field of registrantFields) {
      const envVal = process.env[`NAMECHEAP_${field.toUpperCase()}`];
      if (envVal) params.set(field, envVal);
    }

    console.log(`[namecheap] Registering domain: ${args.domain}`);

    const response = await fetch(`${getBaseUrl()}?${params}`);
    const xml = await response.text();

    const error = hasErrors(xml);
    if (error) {
      return { error: `Registration failed: ${error}` };
    }

    const results = extractAttributes(xml, "DomainCreateResult");
    if (results.length === 0) {
      return { error: "No registration result returned" };
    }

    const r = results[0];
    return {
      domain: r.Domain,
      registered: r.Registered === "true",
      orderId: r.OrderID,
      transactionId: r.TransactionID,
    };
  },
});

export const bulkCheckAndRegister = action({
  args: { domains: v.array(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    console.log(
      `[namecheap] Bulk checking ${args.domains.length} domains`,
    );

    // Check in batches of 50
    const BATCH_SIZE = 50;
    const allResults: Array<{
      domain: string;
      available: boolean;
      isPremium: boolean;
      price?: number;
    }> = [];

    for (let i = 0; i < args.domains.length; i += BATCH_SIZE) {
      const batch = args.domains.slice(i, i + BATCH_SIZE);
      const params = getBaseParams();
      params.set("Command", "namecheap.domains.check");
      params.set("DomainList", batch.join(","));

      const response = await fetch(`${getBaseUrl()}?${params}`);
      const xml = await response.text();

      const error = hasErrors(xml);
      if (error) {
        console.warn(`[namecheap] Batch error: ${error}`);
        continue;
      }

      const results = extractAttributes(xml, "DomainCheckResult");
      for (const r of results) {
        allResults.push({
          domain: r.Domain,
          available: r.Available === "true",
          isPremium: r.IsPremiumName === "true",
          price: r.PremiumRegistrationPrice
            ? parseFloat(r.PremiumRegistrationPrice)
            : undefined,
        });
      }
    }

    const available = allResults.filter((r) => r.available);
    const unavailable = allResults.filter((r) => !r.available);

    return {
      total: allResults.length,
      available,
      unavailable,
    };
  },
});

export const getDomainInfo = action({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const params = getBaseParams();
    params.set("Command", "namecheap.domains.getInfo");
    params.set("DomainName", args.domain);

    const response = await fetch(`${getBaseUrl()}?${params}`);
    const xml = await response.text();

    const error = hasErrors(xml);
    if (error) {
      return { error: `Failed to get domain info: ${error}` };
    }

    // Extract domain info
    const domainInfo = extractAttributes(xml, "DomainGetInfoResult");
    if (domainInfo.length === 0) {
      return { error: "No domain info returned" };
    }

    const d = domainInfo[0];

    // Extract nameservers
    const nsRegex = /<Nameserver>(.*?)<\/Nameserver>/gi;
    const nameservers: string[] = [];
    let nsMatch;
    while ((nsMatch = nsRegex.exec(xml)) !== null) {
      nameservers.push(nsMatch[1]);
    }

    return {
      domain: d.DomainName,
      status: d.Status,
      createdDate: d.CreatedDate,
      expiredDate: d.ExpiredDate,
      isExpired: d.IsExpired === "true",
      nameservers,
    };
  },
});
