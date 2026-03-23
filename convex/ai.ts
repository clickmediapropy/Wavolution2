import { action, internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
declare const process: { env: Record<string, string | undefined> };

function getOpenRouterConfig() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");
  const model = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
  return { apiKey, model };
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://bulk.agentifycrm.io",
      "X-Title": "Message Hub",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// --- Public action: Generate a message draft for a human agent ---

export const generateMessageDraft = action({
  args: {
    conversationId: v.id("conversations"),
    intent: v.string(), // what the user wants to say
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { apiKey, model } = getOpenRouterConfig();

    // Load conversation history for context
    const messages: Array<{
      message: string;
      direction?: string;
      _creationTime: number;
    }> = await ctx.runQuery(api.conversations.getMessages, {
      conversationId: args.conversationId,
    });

    // Build conversation context
    const history = messages
      .slice(-20) // last 20 messages for context
      .map(
        (m) =>
          `${m.direction === "incoming" ? "Customer" : "You"}: ${m.message}`,
      )
      .join("\n");

    const systemPrompt = `You are a professional sales and customer service assistant.
You help craft WhatsApp messages for a bulk messaging platform.
Write a natural, conversational reply. Keep it concise (1-3 sentences).
Do NOT include greetings like "Hi" if the conversation is already ongoing.
Write only the message text, no quotes or formatting.
Match the language of the conversation (if they write in Spanish, reply in Spanish).`;

    const userMessage = `Here is the conversation history:
${history || "(No previous messages)"}

The agent wants to: ${args.intent}

Write the reply message:`;

    const draft = await callOpenRouter(apiKey, model, systemPrompt, userMessage);
    return draft.trim();
  },
});

// --- Internal action: Auto-reply bot for incoming messages ---

export const generateAutoReply = internalAction({
  args: {
    conversationId: v.id("conversations"),
    inboundMessageId: v.id("messages"),
    userId: v.id("users"),
    instanceName: v.string(),
    phone: v.string(),
    systemPrompt: v.string(),
  },
  handler: async (ctx, args) => {
    // Re-check conversation is still in bot mode
    const conversation = await ctx.runQuery(
      internal.conversations.getByPhone,
      { userId: args.userId, phone: args.phone },
    );
    if (!conversation || conversation.status !== "bot") return;

    const { apiKey, model } = getOpenRouterConfig();

    // Load recent messages for context
    const messages: Array<{
      message: string;
      direction?: string;
      _creationTime: number;
    }> = await ctx.runQuery(api.conversations.getMessages, {
      conversationId: args.conversationId,
    });

    const history = messages
      .slice(-15)
      .map(
        (m) =>
          `${m.direction === "incoming" ? "Customer" : "Agent"}: ${m.message}`,
      )
      .join("\n");

    const fullSystemPrompt = `${args.systemPrompt}

Important rules:
- Keep responses concise (1-3 sentences)
- Be helpful and professional
- Match the customer's language
- If you don't know something, say so honestly
- Never make up information about products or prices`;

    const reply = await callOpenRouter(
      apiKey,
      model,
      fullSystemPrompt,
      `Conversation history:\n${history}\n\nRespond to the customer's last message:`,
    );

    if (!reply.trim()) return;

    // Send the reply via Evolution API
    const baseUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, "");
    const evoApiKey = process.env.EVOLUTION_API_KEY;
    if (!baseUrl || !evoApiKey) {
      console.error("Evolution API not configured for auto-reply");
      return;
    }

    const sendRes = await fetch(
      `${baseUrl}/message/sendText/${args.instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: evoApiKey,
        },
        body: JSON.stringify({
          number: args.phone,
          text: reply.trim(),
        }),
      },
    );

    if (!sendRes.ok) {
      console.error(
        `Auto-reply send failed: ${sendRes.status} ${await sendRes.text()}`,
      );
      return;
    }

    const sendData = await sendRes.json();
    const whatsappMessageId =
      (sendData.key as Record<string, unknown>)?.id as string | undefined;

    // Log the bot's reply as a message
    await ctx.runMutation(internal.ai.logBotMessage, {
      userId: args.userId,
      conversationId: args.conversationId,
      instanceId: conversation.instanceId,
      phone: args.phone,
      message: reply.trim(),
      whatsappMessageId,
    });
  },
});

// --- Internal mutation: log a bot-sent message ---

export const logBotMessage = internalMutation({
  args: {
    userId: v.id("users"),
    conversationId: v.id("conversations"),
    instanceId: v.optional(v.id("instances")),
    phone: v.string(),
    message: v.string(),
    whatsappMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      userId: args.userId,
      instanceId: args.instanceId,
      conversationId: args.conversationId,
      phone: args.phone,
      message: args.message,
      status: "sent",
      direction: "outgoing",
      sentBy: "bot",
      whatsappMessageId: args.whatsappMessageId,
    });

    // Update conversation
    const conv = await ctx.db.get(args.conversationId);
    if (conv) {
      await ctx.db.patch(args.conversationId, {
        lastMessageAt: Date.now(),
        lastMessageText: args.message.slice(0, 200),
        lastMessageDirection: "outbound",
      });
    }
  },
});

