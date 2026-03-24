"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { z } from "zod";
import { generateText, Output } from "ai";
import { getOpenRouterProvider, getModelConfig } from "../lib/aiModels";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const templateSchema = z.object({
  templates: z.array(
    z.object({
      name: z.string(),
      message: z.string(),
      cta: z.string(),
      emoji_level: z.enum(["none", "minimal", "heavy"]),
    }),
  ),
});

const singleTemplateSchema = z.object({
  name: z.string(),
  message: z.string(),
  cta: z.string(),
});

// ---------------------------------------------------------------------------
// generateOfferTemplates
// ---------------------------------------------------------------------------

export const generateOfferTemplates = action({
  args: {
    offerName: v.string(),
    vertical: v.string(),
    offerUrl: v.string(),
    tone: v.union(
      v.literal("urgent"),
      v.literal("friendly"),
      v.literal("professional"),
      v.literal("casual"),
    ),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const count = args.count ?? 3;
    const gateway = getOpenRouterProvider();
    const config = getModelConfig("template-gen");
    const startTime = Date.now();

    const systemPrompt = `You are an expert affiliate marketing copywriter specializing in WhatsApp messages.
Generate ${count} unique WhatsApp message templates for promoting this offer:

OFFER: ${args.offerName}
VERTICAL: ${args.vertical}
LINK: ${args.offerUrl}
TONE: ${args.tone}

RULES:
- Messages must be 1-3 short paragraphs (WhatsApp style, not email)
- Use {name} placeholder for personalization
- Include the offer link naturally in the message
- Each template should have a different angle/hook
- Keep messages under 500 characters for best delivery
- For health offers: focus on transformation stories, not medical claims
- For finance offers: focus on savings/opportunity, not guarantees
- Include a clear CTA (call-to-action)
- Vary emoji usage across templates`;

    const genOpts = {
      output: Output.object({ schema: templateSchema }),
      system: systemPrompt,
      prompt: `Generate ${count} WhatsApp message templates for the "${args.offerName}" offer.`,
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
    };

    try {
      const result = await generateText({
        model: gateway(config.model),
        ...genOpts,
      });

      const elapsed = Date.now() - startTime;
      console.log(
        `[templateGenerator] Generated ${count} templates in ${elapsed}ms`,
        { model: config.model, usage: result.usage },
      );

      return { templates: result.output!.templates };
    } catch (primaryErr) {
      console.warn(
        "[templateGenerator] Primary model failed, trying fallback",
        primaryErr,
      );

      if (config.fallback) {
        try {
          const result = await generateText({
            model: gateway(config.fallback),
            ...genOpts,
          });

          const elapsed = Date.now() - startTime;
          console.log(
            `[templateGenerator] Fallback generated ${count} templates in ${elapsed}ms`,
            { model: config.fallback, usage: result.usage },
          );

          return { templates: result.output!.templates };
        } catch (fallbackErr) {
          console.error(
            "[templateGenerator] Fallback model also failed",
            fallbackErr,
          );
          return {
            error:
              "Template generation failed after all retries. Please try again.",
          };
        }
      }

      return {
        error: "Template generation failed. Please try again.",
      };
    }
  },
});

// ---------------------------------------------------------------------------
// generateSingleTemplate
// ---------------------------------------------------------------------------

export const generateSingleTemplate = action({
  args: {
    offerName: v.string(),
    vertical: v.string(),
    offerUrl: v.string(),
    angle: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const gateway = getOpenRouterProvider();
    const config = getModelConfig("offer-copy");
    const startTime = Date.now();

    const systemPrompt = `You are an expert affiliate marketing copywriter for WhatsApp.
Generate ONE WhatsApp message template for this offer:

OFFER: ${args.offerName}
VERTICAL: ${args.vertical}
LINK: ${args.offerUrl}
ANGLE: ${args.angle}

RULES:
- Message must be 1-3 short paragraphs (WhatsApp style)
- Use {name} placeholder for personalization
- Include the offer link naturally
- Keep under 500 characters
- For health offers: transformation stories, not medical claims
- For finance offers: savings/opportunity, not guarantees
- Match the specified angle (urgency, social proof, curiosity, etc.)`;

    try {
      const result = await generateText({
        model: gateway(config.model),
        output: Output.object({ schema: singleTemplateSchema }),
        system: systemPrompt,
        prompt: `Generate a WhatsApp message template with a "${args.angle}" angle for "${args.offerName}".`,
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
      });

      const elapsed = Date.now() - startTime;
      console.log(`[templateGenerator] Single template in ${elapsed}ms`, {
        model: config.model,
        usage: result.usage,
      });

      return { template: result.output! };
    } catch (err) {
      console.error("[templateGenerator] Single generation failed", err);
      return {
        error: "Template generation failed. Please try again.",
      };
    }
  },
});
