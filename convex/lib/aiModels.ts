"use node";

/**
 * AI Model Resolver (Node runtime)
 *
 * Centralized OpenRouter provider setup for all AI actions.
 * Simplified from Agentify — no tenant overrides or trial limits.
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  MODEL_REGISTRY,
  type AITaskType,
  type ModelConfig,
} from "./aiModelRegistry";

declare const process: { env: Record<string, string | undefined> };

type OpenRouterProvider = ReturnType<typeof createOpenRouter>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get the model configuration for a given task type.
 */
export function getModelConfig(taskType: AITaskType): ModelConfig {
  return MODEL_REGISTRY[taskType];
}

/**
 * Estimate cost in USD for a given task type and token usage.
 */
export function estimateCost(
  taskType: AITaskType,
  inputTokens: number,
  outputTokens: number,
): number {
  const config = getModelConfig(taskType);
  const inputCost = (inputTokens / 1_000_000) * config.pricing.input;
  const outputCost = (outputTokens / 1_000_000) * config.pricing.output;
  return inputCost + outputCost;
}

// ---------------------------------------------------------------------------
// OpenRouter Provider
// ---------------------------------------------------------------------------

let _openRouter: OpenRouterProvider | null = null;

function buildOpenRouterHeaders(): Record<string, string> {
  const referer = process.env.SITE_URL ?? process.env.APP_URL;
  return {
    "X-Title": "OfferBlast",
    ...(referer ? { "HTTP-Referer": referer } : {}),
  };
}

/**
 * Get a singleton OpenRouter provider instance.
 * Uses `OPENROUTER_API_KEY` from environment variables.
 */
export function getOpenRouterProvider(): OpenRouterProvider {
  if (_openRouter) return _openRouter;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Configure it in Convex environment variables.",
    );
  }

  _openRouter = createOpenRouter({
    apiKey,
    headers: buildOpenRouterHeaders(),
  });
  return _openRouter;
}
