import type { Asset } from "../../engine/types/marketData";
import { AI_ENGINE_VERSION, CADP_PROMPT_VERSION, CADP_RESPONSE_SCHEMA_VERSION } from "../aiVersioning";
import { getOpenAIRuntimeConfig } from "../openAIConfig";
import { AnalyticalCoreRegistry } from "./analyticalCoreRegistry";
import { CanonicalSnapshotStore } from "./canonicalSnapshotStore";
import { CadpCostManager } from "./costManager";
import { DefaultEconomicEventProvider } from "./defaultEconomicEventProvider";
import { ImageCacheStore } from "./imageCacheStore";
import { CadpMasterSignalBuilder } from "./masterSignalBuilder";
import { masterSignalStore } from "./masterSignalStore";
import { NewsContextProvider } from "./newsContextProvider";
import { OpenAIAdapterV2 } from "./openAIAdapterV2";
import { CadpPromptBuilderV2 } from "./promptBuilderV2";
import { PromptCacheStore } from "./promptCacheStore";
import { ResponseCacheStore } from "./responseCacheStore";
import { SessionContextService } from "./sessionContextService";
import { CadpSnapshotBuilder } from "./snapshotBuilder";
import { CADP_V1_PROFILE, type CadpAnalysisRequestV2, type CadpAnalysisResponseV2, type CadpShadowSignal } from "./types";
import { CadpVerifierV2 } from "./verifierV2";
import { VisualChartRenderer } from "./visualChartRenderer";

export interface ShadowFlowInput {
  analysisId: string;
  signalId: string;
  symbol: Asset;
  brokerSymbol: string;
}

export interface ShadowFlowResult {
  request: CadpAnalysisRequestV2;
  prompt: {
    prompt_id: string;
    prompt_version: string;
    text: string;
    hash: string;
    prompt_cache_key: string;
    core_hash: string;
    cache_eligible: boolean;
    section_order: string[];
  };
  response: CadpAnalysisResponseV2 | null;
  validation: { valid: boolean; errors: string[] };
  signal: CadpShadowSignal;
}

export class CadpShadowFlow {
  constructor(
    private readonly snapshotBuilder: CadpSnapshotBuilder,
    private readonly coreRegistry = new AnalyticalCoreRegistry(),
    private readonly promptBuilder = new CadpPromptBuilderV2(),
    private readonly verifier = new CadpVerifierV2(),
    private readonly snapshotStore = new CanonicalSnapshotStore(),
    private readonly chartRenderer = new VisualChartRenderer(),
    private readonly imageCache = new ImageCacheStore(),
    private readonly sessionService = new SessionContextService(),
    private readonly newsProvider = new NewsContextProvider(new DefaultEconomicEventProvider()),
    private readonly promptCache = new PromptCacheStore(),
    private readonly responseCache = new ResponseCacheStore(),
    private readonly adapterV2 = new OpenAIAdapterV2(),
    private readonly costManager = new CadpCostManager(),
    private readonly masterSignalBuilder = new CadpMasterSignalBuilder()
  ) {}

  private responseSchema(): Record<string, unknown> {
    return {
      type: "object",
      additionalProperties: false,
      required: [
        "analysis_id",
        "snapshot_utc",
        "symbol",
        "analysis_profile",
        "data_assessment",
        "market_assessment",
        "strategy",
        "analyst_decision",
        "system_validation_result",
        "final_system_status",
        "setup",
        "order_plan",
        "quality",
        "news",
        "evidence",
        "client_message_code",
        "human_review_required",
        "visual_manifest_hash",
        "prompt_version",
        "response_schema_version",
        "engine_version",
      ],
      properties: {
        analysis_id: { type: "string" },
        snapshot_utc: { type: "string" },
        symbol: { type: "string" },
        analysis_profile: { type: "string" },
        data_assessment: {
          type: "object",
          additionalProperties: false,
          required: ["sufficient", "visual_numeric_consistent", "issues"],
          properties: {
            sufficient: { type: "boolean" },
            visual_numeric_consistent: { type: "boolean" },
            issues: { type: "array", items: { type: "string" } },
          },
        },
        market_assessment: {
          type: "object",
          additionalProperties: false,
          required: ["regime", "timeframe_alignment", "volatility_state", "session_assessment", "news_risk"],
          properties: {
            regime: { type: ["string", "null"] },
            timeframe_alignment: { type: ["string", "null"], enum: ["ALIGNED", "MISALIGNED", null] },
            volatility_state: { type: ["string", "null"] },
            session_assessment: { type: ["string", "null"] },
            news_risk: { type: ["string", "null"] },
          },
        },
        strategy: {
          type: "object",
          additionalProperties: false,
          required: ["selected_strategy_id", "selected_strategy_version", "selection_reason"],
          properties: {
            selected_strategy_id: { type: ["string", "null"] },
            selected_strategy_version: { type: ["string", "null"] },
            selection_reason: { type: ["string", "null"] },
          },
        },
        analyst_decision: { type: "string" },
        system_validation_result: { type: "string" },
        final_system_status: { type: "string" },
        setup: {
          type: "object",
          additionalProperties: false,
          required: ["valid", "direction", "activation_condition", "entry_missed", "invalidation_condition"],
          properties: {
            valid: { type: ["boolean", "null"] },
            direction: { type: ["string", "null"], enum: ["BUY", "SELL", "NONE", null] },
            activation_condition: { type: ["string", "null"] },
            entry_missed: { type: ["boolean", "null"] },
            invalidation_condition: { type: ["string", "null"] },
          },
        },
        order_plan: {
          type: "object",
          additionalProperties: false,
          required: [
            "entry_type",
            "entry_price",
            "entry_zone_min",
            "entry_zone_max",
            "stop_loss",
            "stop_anchor_source",
            "stop_anchor_timeframe",
            "stop_anchor_timestamp",
            "stop_anchor_price",
            "stop_buffer",
            "stop_distance_price",
            "stop_distance_atr",
            "stop_reason",
            "take_profit",
            "target_anchor_source",
            "target_anchor_id",
            "target_anchor_timeframe",
            "target_anchor_timestamp",
            "target_anchor_price",
            "reward_distance_price",
            "proposed_gross_rr",
            "proposed_net_rr",
            "target_reason",
            "expected_duration",
            "expires_at",
          ],
          properties: {
            entry_type: { type: ["string", "null"] },
            entry_price: { type: ["number", "null"] },
            entry_zone_min: { type: ["number", "null"] },
            entry_zone_max: { type: ["number", "null"] },
            stop_loss: { type: ["number", "null"] },
            stop_anchor_source: { type: ["string", "null"] },
            stop_anchor_timeframe: { type: ["string", "null"] },
            stop_anchor_timestamp: { type: ["string", "null"] },
            stop_anchor_price: { type: ["number", "null"] },
            stop_buffer: { type: ["number", "null"] },
            stop_distance_price: { type: ["number", "null"] },
            stop_distance_atr: { type: ["number", "null"] },
            stop_reason: { type: ["string", "null"] },
            take_profit: { type: ["number", "null"] },
            target_anchor_source: { type: ["string", "null"] },
            target_anchor_id: { type: ["string", "null"] },
            target_anchor_timeframe: { type: ["string", "null"] },
            target_anchor_timestamp: { type: ["string", "null"] },
            target_anchor_price: { type: ["number", "null"] },
            reward_distance_price: { type: ["number", "null"] },
            proposed_gross_rr: { type: ["number", "null"] },
            proposed_net_rr: { type: ["number", "null"] },
            target_reason: { type: ["string", "null"] },
            expected_duration: { type: ["string", "null"] },
            expires_at: { type: ["string", "null"] },
          },
        },
        quality: {
          type: "object",
          additionalProperties: false,
          required: ["setup_quality_score", "model_confidence", "empirical_probability_used"],
          properties: {
            setup_quality_score: { type: ["number", "null"] },
            model_confidence: { type: ["number", "null"] },
            empirical_probability_used: { type: "boolean" },
          },
        },
        news: {
          type: "object",
          additionalProperties: false,
          required: ["verification_requested", "research_used", "status", "relevant_event_ids", "source_ids"],
          properties: {
            verification_requested: { type: "boolean" },
            research_used: { type: "boolean" },
            status: { type: ["string", "null"] },
            relevant_event_ids: { type: "array", items: { type: "string" } },
            source_ids: { type: "array", items: { type: "string" } },
          },
        },
        evidence: {
          type: "object",
          additionalProperties: false,
          required: ["supporting_factors", "conflicting_factors", "warnings"],
          properties: {
            supporting_factors: { type: "array", items: { type: "string" } },
            conflicting_factors: { type: "array", items: { type: "string" } },
            warnings: { type: "array", items: { type: "string" } },
          },
        },
        client_message_code: { type: "string" },
        human_review_required: { type: "boolean" },
        visual_manifest_hash: { type: "string" },
        prompt_version: { type: "string" },
        response_schema_version: { type: "string" },
        engine_version: { type: "string" },
      },
    };
  }

  private buildFallbackResponse(request: CadpAnalysisRequestV2, selectedStrategyId: string): CadpAnalysisResponseV2 {
    return {
      analysis_id: request.identity.analysis_id,
      snapshot_utc: request.identity.snapshot_utc,
      symbol: request.identity.symbol,
      analysis_profile: request.identity.analysis_profile,
      data_assessment: {
        sufficient: request.identity.current_bid > 0 && request.identity.current_ask > 0,
        visual_numeric_consistent: true,
        issues: [],
      },
      market_assessment: {
        regime: null,
        timeframe_alignment: null,
        volatility_state: null,
        session_assessment: request.sessions.market_status,
        news_risk: request.news_bundle.news_status,
      },
      strategy: {
        selected_strategy_id: selectedStrategyId,
        selected_strategy_version: request.authorized_strategies[0]?.strategy_version ?? null,
        selection_reason: "SHADOW_DRAFT",
      },
      analyst_decision: "WAIT",
      system_validation_result: "PENDING_OBJECTIVE_VALIDATION",
      final_system_status: "SHADOW_PENDING_REVIEW",
      setup: {
        valid: null,
        direction: null,
        activation_condition: null,
        entry_missed: null,
        invalidation_condition: null,
      },
      order_plan: {
        entry_type: null,
        entry_price: null,
        entry_zone_min: null,
        entry_zone_max: null,
        stop_loss: null,
        stop_anchor_source: null,
        stop_anchor_timeframe: null,
        stop_anchor_timestamp: null,
        stop_anchor_price: null,
        stop_buffer: null,
        stop_distance_price: null,
        stop_distance_atr: null,
        stop_reason: null,
        take_profit: null,
        target_anchor_source: null,
        target_anchor_id: null,
        target_anchor_timeframe: null,
        target_anchor_timestamp: null,
        target_anchor_price: null,
        reward_distance_price: null,
        proposed_gross_rr: null,
        proposed_net_rr: null,
        target_reason: null,
        expected_duration: null,
        expires_at: null,
      },
      quality: {
        setup_quality_score: null,
        model_confidence: null,
        empirical_probability_used: false,
      },
      news: {
        verification_requested: request.news_bundle.verification_requested,
        research_used: request.news_bundle.research_used,
        status: request.news_bundle.news_status,
        relevant_event_ids: request.news_bundle.events.map((event) => event.event_id),
        source_ids: request.news_bundle.source_ids,
      },
      evidence: {
        supporting_factors: ["MULTIMODAL_EXPEDIENT_READY"],
        conflicting_factors: [],
        warnings: [],
      },
      client_message_code: "WAIT_CONFIRMATION",
      human_review_required: true,
      visual_manifest_hash: request.visual_manifest.visual_manifest_hash,
      prompt_version: CADP_PROMPT_VERSION,
      response_schema_version: CADP_RESPONSE_SCHEMA_VERSION,
      engine_version: AI_ENGINE_VERSION,
    };
  }

  async build(input: ShadowFlowInput): Promise<ShadowFlowResult> {
    const started = Date.now();
    const openAIModel = getOpenAIRuntimeConfig().model;
    const failFastDiagnostic = String(process.env.OPENAI_DIAGNOSTIC_FAIL_FAST ?? "").trim().toLowerCase() === "true";
    const request = this.snapshotBuilder.build(input);
    const snapshotRecord = this.snapshotStore.save(request);
    const snapshotKey = `${request.identity.symbol}:${request.identity.analysis_profile}:${request.identity.snapshot_utc}:${snapshotRecord.context_hash}`;

    request.sessions = this.sessionService.build({
      nowUtc: Date.parse(request.identity.snapshot_utc),
      sessionTimezone: "UTC",
      dailyMaintenanceMinuteUtc: 0,
      weeklyCloseDayUtc: 5,
      holidayScheduleActive: false,
      earlyClose: false,
      scheduleSource: "carvipix-session-service-v1",
    });
    request.market_now.session = request.sessions.primary_session;
    request.market_now.market_open = request.sessions.market_status !== "CLOSED";

    request.news_bundle = await this.newsProvider.build({
      symbol: request.identity.symbol,
      snapshotUtc: request.identity.snapshot_utc,
    });
    request.market_now.news_status = request.news_bundle.news_status;

    const frameDefs = [
      { tf: "1H", block: request.timeframes.H1 },
      { tf: "30M", block: request.timeframes.M30 },
      { tf: "5M", block: request.timeframes.M5 },
    ] as const;

    const images = frameDefs.map(({ tf, block }) => {
      const cached = this.imageCache.get(snapshotKey, tf);
      if (cached) {
        return {
          timeframe: tf,
          filename: cached.filename,
          width: 1280,
          height: 720,
          first_candle_timestamp: block.closed_candles[0]?.timestamp ?? null,
          last_closed_candle_timestamp: block.closed_candles.at(-1)?.timestamp ?? null,
          open_candle_included: Boolean(block.open_candle),
          sha256: cached.image_hash,
          source_snapshot_id: request.identity.analysis_id,
        };
      }

      const rendered = this.chartRenderer.render({
        analysisId: request.identity.analysis_id,
        snapshotUtc: request.identity.snapshot_utc,
        timeframe: tf,
        candles: [...block.closed_candles, ...(block.open_candle ? [block.open_candle] : [])],
        ema20: block.ema20,
        ema50: block.ema50,
        ema200: block.ema200,
        structuralHighs: block.structural_highs,
        structuralLows: block.structural_lows,
        supportZones: block.support_zones,
        resistanceZones: block.resistance_zones,
        currentPrice: request.identity.current_bid,
      });
      this.imageCache.save({
        snapshot_key: snapshotKey,
        timeframe: tf,
        image_hash: rendered.sha256,
        filename: rendered.filename,
        created_at: new Date().toISOString(),
      });
      return rendered;
    });

    request.visual_manifest = {
      analysis_id: request.identity.analysis_id,
      images,
      visual_manifest_hash: request.visual_manifest.visual_manifest_hash,
    };

    const core = this.coreRegistry.getOfficialCore();
    const promptAssembly = this.promptBuilder.build({
      request,
      responseSchema: JSON.stringify(this.responseSchema()),
    });

    this.promptCache.save({
      prompt_cache_key: promptAssembly.prompt_cache_key,
      core_hash: promptAssembly.core_hash,
      prompt_hash: promptAssembly.prompt_hash,
      prompt_text: promptAssembly.prompt_text,
      cache_eligible: promptAssembly.cache_eligible,
      created_at: new Date().toISOString(),
    });

    const dedupeKey = `${request.identity.symbol}:${request.identity.analysis_profile}:${request.identity.snapshot_utc}:${snapshotRecord.context_hash}`;
    const cachedResponse = this.responseCache.get(dedupeKey);

    let responseCandidate: CadpAnalysisResponseV2;
    let usageForCost = {
      input_tokens: 0,
      cached_tokens: 0,
      output_tokens: 0,
      reasoning_tokens: 0,
      estimated_cost_usd: 0,
      provider_response_id: null as string | null,
      provider_endpoint: null as string | null,
    };

    if (cachedResponse) {
      responseCandidate = cachedResponse.response;
    } else {
      try {
        const ai = await this.adapterV2.analyze({
          promptText: promptAssembly.prompt_text,
          responseSchemaName: "carvipix_cadp_response_v2",
          responseSchema: this.responseSchema(),
          imageFiles: request.visual_manifest.images.map((image) => image.filename),
          promptCacheKey: promptAssembly.prompt_cache_key,
        });
        responseCandidate = ai.response;
        usageForCost = {
          input_tokens: ai.usage.promptTokens,
          cached_tokens: ai.cachedTokens,
          output_tokens: ai.usage.completionTokens,
          reasoning_tokens: ai.reasoningTokens,
          estimated_cost_usd: ai.usage.estimatedCostUsd,
          provider_response_id: ai.provider.responseId,
          provider_endpoint: ai.provider.endpoint,
        };
      } catch (error) {
        if (failFastDiagnostic) {
          throw error;
        }
        responseCandidate = this.buildFallbackResponse(request, request.authorized_strategies[0]?.strategy_id ?? "CARVIPIX_NO_TRADE_V1");
      }
      this.responseCache.save({
        dedupe_key: dedupeKey,
        analysis_id: request.identity.analysis_id,
        response: responseCandidate,
        created_at: new Date().toISOString(),
      });
    }

    const validation = this.verifier.verify({ request, response: responseCandidate });
    const validatedResponse = validation.valid && validation.repairedResponse ? validation.repairedResponse : this.buildFallbackResponse(request, request.authorized_strategies[0]?.strategy_id ?? "CARVIPIX_NO_TRADE_V1");

    const signal: CadpShadowSignal = this.masterSignalBuilder.build({
      signalId: input.signalId,
      analysisId: input.analysisId,
      symbol: input.symbol,
      profile: CADP_V1_PROFILE,
      response: validatedResponse,
    });

    masterSignalStore.save(signal);

    this.costManager.register({
      analysisId: request.identity.analysis_id,
      decision: validatedResponse.analyst_decision,
      modelId: openAIModel,
      providerResponseId: usageForCost.provider_response_id,
      providerEndpoint: usageForCost.provider_endpoint,
      usage: {
        input_tokens: usageForCost.input_tokens,
        cached_tokens: usageForCost.cached_tokens,
        output_tokens: usageForCost.output_tokens,
        reasoning_tokens: usageForCost.reasoning_tokens,
      },
      imagesSent: request.visual_manifest.images.length,
      estimatedCostUsd: usageForCost.estimated_cost_usd,
      durationMs: Date.now() - started,
    });

    return {
      request,
      prompt: {
        prompt_id: core.core_id,
        prompt_version: CADP_PROMPT_VERSION,
        text: promptAssembly.prompt_text,
        hash: promptAssembly.prompt_hash,
        prompt_cache_key: promptAssembly.prompt_cache_key,
        core_hash: promptAssembly.core_hash,
        cache_eligible: promptAssembly.cache_eligible,
        section_order: promptAssembly.section_order,
      },
      response: validation.valid ? validation.repairedResponse : null,
      validation: {
        valid: validation.valid,
        errors: validation.errors,
      },
      signal,
    };
  }
}
