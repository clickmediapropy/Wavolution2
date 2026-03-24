/**
 * Shared AI model registry (runtime-agnostic).
 *
 * This file must stay free of "use node" so it can be imported by
 * queries/mutations/actions alike.
 */

export const AI_TASK_TYPES = [
  "template-gen", // Generate WhatsApp message templates for offers
  "offer-copy", // Generate ad copy / offer descriptions
] as const;

export type AITaskType = (typeof AI_TASK_TYPES)[number];

export interface ModelPricing {
  input: number;
  output: number;
}

export interface ModelConfig {
  /** Gateway model ID (provider/model format) */
  model: string;
  /** Optional fallback model if primary is unavailable */
  fallback?: string;
  /** Maximum output tokens for the model */
  maxTokens: number;
  /** Temperature for generation (0-2). Undefined = provider default */
  temperature?: number;
  /** Pricing per 1M tokens in USD */
  pricing: ModelPricing;
}

export const MODEL_REGISTRY: Record<AITaskType, ModelConfig> = {
  "template-gen": {
    model: "google/gemini-3.1-flash-lite-preview",
    fallback: "openai/gpt-5-nano",
    maxTokens: 2048,
    temperature: 0.7,
    pricing: { input: 0.25, output: 1.5 },
  },
  "offer-copy": {
    model: "openai/gpt-5-nano",
    maxTokens: 1024,
    temperature: 0.5,
    pricing: { input: 0.05, output: 0.4 },
  },
};
