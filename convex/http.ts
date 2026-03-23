import { httpRouter } from "convex/server";
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

export default http;
