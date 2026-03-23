import { action, internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
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

    const lastMessage = messages[messages.length - 1]?.message || "";

    // Check for matching bot goals (keyword-triggered flows)
    const matchingGoals: Array<{
      name: string;
      steps: Array<{ message: string; delayMs?: number }>;
    }> = await ctx.runQuery(internal.botGoals.findMatchingGoals, {
      userId: args.userId,
      messageText: lastMessage,
    });

    // If a goal matches, execute its steps instead of AI reply
    const firstGoal = matchingGoals[0];
    if (firstGoal) {
      const baseUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, "");
      const evoApiKey = process.env.EVOLUTION_API_KEY;
      if (!baseUrl || !evoApiKey) {
        console.error("Evolution API not configured for goal step");
        return;
      }

      let stepIndex = 0;
      for (const step of firstGoal.steps) {
        // Delay between steps (skip delay for first step)
        if (stepIndex > 0 && step.delayMs && step.delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, step.delayMs));
        }
        stepIndex++;

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
              text: step.message,
            }),
          },
        );

        if (!sendRes.ok) {
          console.error(
            `Goal step send failed: ${sendRes.status} ${await sendRes.text()}`,
          );
          return;
        }

        const sendData = await sendRes.json();
        const whatsappMessageId =
          (sendData.key as Record<string, unknown>)?.id as string | undefined;

        await ctx.runMutation(internal.ai.logBotMessage, {
          userId: args.userId,
          conversationId: args.conversationId,
          instanceId: conversation.instanceId,
          phone: args.phone,
          message: step.message,
          whatsappMessageId,
        });
      }
      return;
    }

    // Load knowledge base context for RAG
    const kbSnippets: Array<{ title: string; content: string }> =
      await ctx.runQuery(internal.knowledgeBase.searchContext, {
        userId: args.userId,
        queryText: lastMessage,
        maxSnippets: 3,
      });

    const history = messages
      .slice(-15)
      .map(
        (m) =>
          `${m.direction === "incoming" ? "Customer" : "Agent"}: ${m.message}`,
      )
      .join("\n");

    // Build KB context section
    let kbContext = "";
    if (kbSnippets.length > 0) {
      kbContext =
        "\n\nRelevant knowledge base information:\n" +
        kbSnippets
          .map((s) => `### ${s.title}\n${s.content}`)
          .join("\n\n");
    }

    const fullSystemPrompt = `${args.systemPrompt}${kbContext}

Important rules:
- Keep responses concise (1-3 sentences)
- Be helpful and professional
- Match the customer's language
- If you don't know something, say so honestly
- Never make up information about products or prices
- Use the knowledge base information above to answer questions when relevant`;

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

// --- Public action: Generate AI summary for a contact's conversation ---

export const generateAiSummary = action({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { apiKey, model } = getOpenRouterConfig();

    // Load conversation to get contactId
    const conversation: {
      _id: Id<"conversations">;
      userId: Id<"users">;
      contactId?: Id<"contacts">;
      phone: string;
    } | null = await ctx.runQuery(api.conversations.get, {
      id: args.conversationId,
    });
    if (!conversation) throw new Error("Conversation not found");

    // Load messages
    const messages: Array<{
      message: string;
      direction?: string;
      sentBy?: string;
      _creationTime: number;
    }> = await ctx.runQuery(api.conversations.getMessages, {
      conversationId: args.conversationId,
    });

    if (messages.length === 0) return "No messages to summarize.";

    const history = messages
      .slice(-50) // summarize last 50 messages
      .map(
        (m) =>
          `${m.direction === "incoming" ? "Customer" : `Agent (${m.sentBy || "human"})`}: ${m.message}`,
      )
      .join("\n");

    const systemPrompt = `You are a CRM assistant. Summarize the following WhatsApp conversation in 2-4 sentences.
Focus on: the customer's needs/interests, any commitments made, current status/sentiment, and key topics discussed.
Write in the same language as the conversation.
Be concise and actionable — this summary will appear on a contact card.`;

    const summary = await callOpenRouter(
      apiKey,
      model,
      systemPrompt,
      `Conversation:\n${history}\n\nSummary:`,
    );

    const trimmedSummary = summary.trim();

    // Save summary to the contact record if linked
    if (conversation.contactId) {
      await ctx.runMutation(internal.ai.updateContactSummary, {
        contactId: conversation.contactId,
        summary: trimmedSummary,
      });
    }

    return trimmedSummary;
  },
});

// --- Internal mutation: update contact AI summary ---

export const updateContactSummary = internalMutation({
  args: {
    contactId: v.id("contacts"),
    summary: v.string(),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) return;

    await ctx.db.patch(args.contactId, {
      aiSummary: args.summary,
      aiSummaryGeneratedAt: Date.now(),
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
