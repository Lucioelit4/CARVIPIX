import type { AIUsageMetrics } from "./types";

const DEFAULT_INPUT_COST_PER_1K = 0.005;
const DEFAULT_OUTPUT_COST_PER_1K = 0.015;

const MODEL_PRICING: Record<string, { inPer1k: number; outPer1k: number }> = {
  "gpt-4o-mini": { inPer1k: 0.00015, outPer1k: 0.0006 },
  "gpt-4.1-mini": { inPer1k: 0.0008, outPer1k: 0.0032 },
  "gpt-5.3-codex": { inPer1k: 0.005, outPer1k: 0.015 },
};

export function estimateCostUsd(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING[model] ?? { inPer1k: DEFAULT_INPUT_COST_PER_1K, outPer1k: DEFAULT_OUTPUT_COST_PER_1K };
  const inCost = (Math.max(0, promptTokens) / 1000) * pricing.inPer1k;
  const outCost = (Math.max(0, completionTokens) / 1000) * pricing.outPer1k;
  return Number((inCost + outCost).toFixed(8));
}

export function buildUsageMetrics(input: {
  model: string;
  promptTokens: number;
  cachedTokens?: number;
  completionTokens: number;
  durationMs: number;
  retries: number;
}): AIUsageMetrics {
  const promptTokens = Math.max(0, input.promptTokens);
  const cachedTokens = Math.max(0, input.cachedTokens ?? 0);
  const completionTokens = Math.max(0, input.completionTokens);
  const totalTokens = promptTokens + completionTokens;
  return {
    model: input.model,
    promptTokens,
    completionTokens,
    totalTokens,
    estimatedCostUsd: estimateCostUsd(input.model, promptTokens - cachedTokens, completionTokens),
    durationMs: input.durationMs,
    retries: input.retries,
    timestampUtc: new Date().toISOString(),
  };
}

export function assertMaxCost(usage: AIUsageMetrics, maxUsd: number): void {
  if (usage.estimatedCostUsd > maxUsd) {
    throw new Error(`COST_LIMIT_EXCEEDED: ${usage.estimatedCostUsd} > ${maxUsd}`);
  }
}
