type UsageTokens = {
  input_tokens: number;
  cached_tokens: number;
  output_tokens: number;
  reasoning_tokens: number;
};

type ModelPricingRecord = {
  model_id: string;
  pricing_version: string;
  effective_from: string;
  input_usd_per_million: number;
  cached_input_usd_per_million: number;
  output_usd_per_million: number;
  web_search_cost: number;
  other_tool_costs: number;
};

const MODEL_PRICING_CATALOG: ModelPricingRecord[] = [
  {
    model_id: "gpt-5.6-sol",
    pricing_version: "openai-2026-07-12-v1",
    effective_from: "2026-07-12",
    input_usd_per_million: 5,
    cached_input_usd_per_million: 0.5,
    output_usd_per_million: 15,
    web_search_cost: 0,
    other_tool_costs: 0,
  },
  {
    model_id: "gpt-5.3-codex",
    pricing_version: "carvipix-legacy-v1",
    effective_from: "2026-07-01",
    input_usd_per_million: 5,
    cached_input_usd_per_million: 5,
    output_usd_per_million: 15,
    web_search_cost: 0,
    other_tool_costs: 0,
  },
  {
    model_id: "gpt-4o-mini",
    pricing_version: "carvipix-legacy-v1",
    effective_from: "2026-07-01",
    input_usd_per_million: 0.15,
    cached_input_usd_per_million: 0.15,
    output_usd_per_million: 0.6,
    web_search_cost: 0,
    other_tool_costs: 0,
  },
  {
    model_id: "gpt-4.1-mini",
    pricing_version: "carvipix-legacy-v1",
    effective_from: "2026-07-01",
    input_usd_per_million: 0.8,
    cached_input_usd_per_million: 0.8,
    output_usd_per_million: 3.2,
    web_search_cost: 0,
    other_tool_costs: 0,
  },
];

const DEFAULT_PRICING: ModelPricingRecord = {
  model_id: "default",
  pricing_version: "default-v1",
  effective_from: "1970-01-01",
  input_usd_per_million: 5,
  cached_input_usd_per_million: 5,
  output_usd_per_million: 15,
  web_search_cost: 0,
  other_tool_costs: 0,
};

function resolvePricing(model: string): ModelPricingRecord {
  const normalized = model.trim().toLowerCase();
  return MODEL_PRICING_CATALOG.find((entry) => entry.model_id.toLowerCase() === normalized) ?? DEFAULT_PRICING;
}

function estimateByCatalog(model: string, usage: UsageTokens): {
  locally_estimated_cost_usd: number;
  pricing_version: string;
} {
  const pricing = resolvePricing(model);
  const inputNonCached = Math.max(0, usage.input_tokens - usage.cached_tokens);
  const cachedInput = Math.max(0, usage.cached_tokens);
  const output = Math.max(0, usage.output_tokens);

  const cost =
    (inputNonCached / 1_000_000) * pricing.input_usd_per_million +
    (cachedInput / 1_000_000) * pricing.cached_input_usd_per_million +
    (output / 1_000_000) * pricing.output_usd_per_million +
    pricing.web_search_cost +
    pricing.other_tool_costs;

  return {
    locally_estimated_cost_usd: Number(cost.toFixed(8)),
    pricing_version: pricing.pricing_version,
  };
}

type CostRecord = {
  analysis_id: string;
  decision: string;
  model_id: string;
  pricing_version: string;
  provider_response_id: string | null;
  provider_endpoint: string | null;
  input_tokens: number;
  cached_tokens: number;
  output_tokens: number;
  reasoning_tokens: number;
  provider_reported_usage: {
    input_tokens: number;
    cached_tokens: number;
    output_tokens: number;
    reasoning_tokens: number;
    total_tokens: number;
  };
  images_sent: number;
  locally_estimated_cost_usd: number;
  duration_ms: number;
  created_at: string;
};

export class CadpCostManager {
  private readonly records: CostRecord[] = [];

  register(input: {
    analysisId: string;
    decision: string;
    modelId: string;
    providerResponseId?: string | null;
    providerEndpoint?: string | null;
    usage: UsageTokens;
    imagesSent: number;
    estimatedCostUsd?: number;
    durationMs: number;
  }): CostRecord {
    const normalizedUsage = {
      input_tokens: Math.max(0, input.usage.input_tokens),
      cached_tokens: Math.max(0, input.usage.cached_tokens),
      output_tokens: Math.max(0, input.usage.output_tokens),
      reasoning_tokens: Math.max(0, input.usage.reasoning_tokens),
    };
    const providerReportedUsage = {
      ...normalizedUsage,
      total_tokens: normalizedUsage.input_tokens + normalizedUsage.output_tokens,
    };
    const estimated = estimateByCatalog(input.modelId, normalizedUsage);

    const record: CostRecord = {
      analysis_id: input.analysisId,
      decision: input.decision,
      model_id: input.modelId,
      pricing_version: estimated.pricing_version,
      provider_response_id: input.providerResponseId ?? null,
      provider_endpoint: input.providerEndpoint ?? null,
      input_tokens: normalizedUsage.input_tokens,
      cached_tokens: normalizedUsage.cached_tokens,
      output_tokens: normalizedUsage.output_tokens,
      reasoning_tokens: normalizedUsage.reasoning_tokens,
      provider_reported_usage: providerReportedUsage,
      images_sent: Math.max(0, input.imagesSent),
      locally_estimated_cost_usd:
        input.estimatedCostUsd != null ? Number(input.estimatedCostUsd.toFixed(8)) : estimated.locally_estimated_cost_usd,
      duration_ms: Math.max(0, input.durationMs),
      created_at: new Date().toISOString(),
    };
    this.records.push(record);
    return record;
  }

  summarize(now = new Date()): {
    daily_cost_usd: number;
    monthly_cost_usd: number;
    cost_per_analysis_usd: number;
    cost_per_approved_signal_usd: number;
    cost_per_no_trade_usd: number;
    total_records: number;
  } {
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();
    const d = now.getUTCDate();
    const sameDay = this.records.filter((r) => {
      const dt = new Date(r.created_at);
      return dt.getUTCFullYear() === y && dt.getUTCMonth() === m && dt.getUTCDate() === d;
    });
    const sameMonth = this.records.filter((r) => {
      const dt = new Date(r.created_at);
      return dt.getUTCFullYear() === y && dt.getUTCMonth() === m;
    });
    const daily = sameDay.reduce((sum, r) => sum + r.locally_estimated_cost_usd, 0);
    const monthly = sameMonth.reduce((sum, r) => sum + r.locally_estimated_cost_usd, 0);
    const approved = this.records.filter((r) => r.decision === "ENTER_BUY" || r.decision === "ENTER_SELL");
    const noTrade = this.records.filter((r) => r.decision === "NO_TRADE");

    return {
      daily_cost_usd: Number(daily.toFixed(8)),
      monthly_cost_usd: Number(monthly.toFixed(8)),
      cost_per_analysis_usd: this.records.length === 0 ? 0 : Number((monthly / this.records.length).toFixed(8)),
      cost_per_approved_signal_usd:
        approved.length === 0 ? 0 : Number((approved.reduce((sum, r) => sum + r.locally_estimated_cost_usd, 0) / approved.length).toFixed(8)),
      cost_per_no_trade_usd:
        noTrade.length === 0 ? 0 : Number((noTrade.reduce((sum, r) => sum + r.locally_estimated_cost_usd, 0) / noTrade.length).toFixed(8)),
      total_records: this.records.length,
    };
  }
}
