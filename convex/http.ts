import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";
import { handleEvolutionWebhook } from "./webhooks";

const http = httpRouter();
auth.addHttpRoutes(http);

// Evolution API webhook endpoint
http.route({
  path: "/webhooks/evolution",
  method: "POST",
  handler: handleEvolutionWebhook,
});

// Postback receiver — GET (most affiliate networks use GET)
http.route({
  path: "/postback",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) {
      return new Response("Missing token", { status: 400 });
    }

    const clickId = url.searchParams.get("clickid") ?? undefined;
    const payoutStr = url.searchParams.get("payout");
    const payout = payoutStr ? parseFloat(payoutStr) : undefined;
    const transactionId = url.searchParams.get("txid") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;

    // Store all raw params for debugging
    const rawParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      rawParams[key] = value;
    });

    await ctx.runMutation(internal.postbacks.processPostback, {
      token,
      clickId,
      payout: payout && !isNaN(payout) ? payout : undefined,
      transactionId,
      status,
      rawParams: JSON.stringify(rawParams),
    });

    return new Response("OK", { status: 200 });
  }),
});

// Postback receiver — POST (for networks that POST)
http.route({
  path: "/postback",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    let token = url.searchParams.get("token");
    let clickId: string | undefined;
    let payout: number | undefined;
    let transactionId: string | undefined;
    let status: string | undefined;
    let rawParams: Record<string, string> = {};

    // Try to parse body as JSON or form data
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = (await req.json()) as Record<string, unknown>;
      token = token ?? (body.token as string) ?? null;
      clickId = (body.clickid as string) ?? (body.click_id as string);
      const payoutVal = body.payout ?? body.amount;
      payout =
        typeof payoutVal === "number"
          ? payoutVal
          : typeof payoutVal === "string"
            ? parseFloat(payoutVal)
            : undefined;
      transactionId = (body.txid as string) ?? (body.transaction_id as string);
      status = body.status as string | undefined;
      rawParams = Object.fromEntries(
        Object.entries(body).map(([k, val]) => [k, String(val)]),
      );
    } else {
      // Treat as form-encoded or use query params
      url.searchParams.forEach((value, key) => {
        rawParams[key] = value;
      });
      clickId = url.searchParams.get("clickid") ?? undefined;
      const payoutStr = url.searchParams.get("payout");
      payout = payoutStr ? parseFloat(payoutStr) : undefined;
      transactionId = url.searchParams.get("txid") ?? undefined;
      status = url.searchParams.get("status") ?? undefined;
    }

    if (!token) {
      return new Response("Missing token", { status: 400 });
    }

    await ctx.runMutation(internal.postbacks.processPostback, {
      token,
      clickId,
      payout: payout && !isNaN(payout) ? payout : undefined,
      transactionId,
      status,
      rawParams: JSON.stringify(rawParams),
    });

    return new Response("OK", { status: 200 });
  }),
});

export default http;
