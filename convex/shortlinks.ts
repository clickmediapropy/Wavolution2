import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const SLUG_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateSlugString(): string {
  let slug = "";
  for (let i = 0; i < 6; i++) {
    slug += SLUG_CHARS[Math.floor(Math.random() * SLUG_CHARS.length)];
  }
  return slug;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("shortlinks")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(200);
  },
});

export const create = mutation({
  args: {
    affiliateLinkId: v.id("affiliateLinks"),
    domainId: v.optional(v.id("domains")),
    customSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify affiliate link ownership
    const link = await ctx.db.get(args.affiliateLinkId);
    if (!link || link.userId !== userId) {
      throw new Error("Affiliate link not found");
    }

    // Generate unique slug
    let slug = args.customSlug ?? generateSlugString();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await ctx.db
        .query("shortlinks")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
      if (!existing) break;
      slug = generateSlugString();
      attempts++;
    }
    if (attempts >= 10) {
      throw new Error("Could not generate unique slug");
    }

    // Build full URL
    let baseDomain = "bulk.agentifycrm.io/r";
    if (args.domainId) {
      const domain = await ctx.db.get(args.domainId);
      if (domain && domain.userId === userId) {
        baseDomain = domain.domain;
      }
    }
    const fullUrl = `https://${baseDomain}/${slug}`;

    return await ctx.db.insert("shortlinks", {
      userId,
      affiliateLinkId: args.affiliateLinkId,
      domainId: args.domainId,
      slug,
      fullUrl,
      targetUrl: link.originalUrl,
      clickCount: 0,
      isActive: true,
    });
  },
});

// Public query — no auth required (used by redirect handler)
export const resolve = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const shortlink = await ctx.db
      .query("shortlinks")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!shortlink || !shortlink.isActive) return null;
    return { targetUrl: shortlink.targetUrl, id: shortlink._id };
  },
});

export const recordClick = internalMutation({
  args: { id: v.id("shortlinks") },
  handler: async (ctx, args) => {
    const shortlink = await ctx.db.get(args.id);
    if (!shortlink) return;

    await ctx.db.patch(args.id, {
      clickCount: shortlink.clickCount + 1,
      lastClickedAt: Date.now(),
    });
  },
});
