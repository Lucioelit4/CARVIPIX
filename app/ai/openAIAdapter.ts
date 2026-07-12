import { buildUsageMetrics } from "./aiCostTracker";
import { buildOpenAIHeaders, getOpenAIRuntimeConfig, isRetryableOpenAIStatus, sleepMs } from "./openAIConfig";
import { buildModelAwareChatCompletionBody } from "./openAIModelCompatibility";
import type { AIAnalysisRequest, AIAnalysisResponse, MarketAnalysisAI } from "./types";

export class OpenAIAdapter implements MarketAnalysisAI {
  async analyze(input: AIAnalysisRequest): Promise<{ response: AIAnalysisResponse; usage: ReturnType<typeof buildUsageMetrics>; raw: unknown }> {
    const config = getOpenAIRuntimeConfig();
    const started = Date.now();

    const body = buildModelAwareChatCompletionBody({
      model: config.model,
      temperature: 0,
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "carvipix_ai_response_v1",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: [
              "analysis_id",
              "strategy_id",
              "strategy_version",
              "decision",
              "direction",
              "setup_valid",
              "entry_ready",
              "entry_missed",
              "data_sufficient",
              "levels_match_input",
              "risk_conflict",
              "critical_conflicts",
              "reasons",
              "warnings",
              "confidence",
              "client_message_code",
              "human_review_required",
            ],
            properties: {
              analysis_id: { type: "string" },
              strategy_id: { type: "string" },
              strategy_version: { type: "string" },
              decision: { type: "string" },
              direction: { type: "string" },
              setup_valid: { type: "boolean" },
              entry_ready: { type: "boolean" },
              entry_missed: { type: "boolean" },
              data_sufficient: { type: "boolean" },
              levels_match_input: { type: "boolean" },
              risk_conflict: { type: "boolean" },
              critical_conflicts: { type: "array", items: { type: "string" } },
              reasons: { type: "array", items: { type: "string" } },
              warnings: { type: "array", items: { type: "string" } },
              confidence: { type: "number" },
              client_message_code: { type: "string" },
              human_review_required: { type: "boolean" },
            },
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "You are CARVIPIX analytical assistant. Follow provided strategy id/version strictly. Do not invent levels. Return only valid JSON schema.",
        },
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
    });

    let retries = 0;
    let response: Response | null = null;
    let lastError: unknown = null;

    while (retries <= config.maxRetries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);
      try {
        response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: "POST",
          headers: buildOpenAIHeaders(config),
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (error) {
        lastError = error;
        if (retries >= config.maxRetries) {
          throw new Error("OPENAI_TIMEOUT_OR_NETWORK_ERROR");
        }
        retries += 1;
        await sleepMs(config.retryBaseMs * retries);
        continue;
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.ok) {
        break;
      }

      if (isRetryableOpenAIStatus(response.status) && retries < config.maxRetries) {
        retries += 1;
        await sleepMs(config.retryBaseMs * retries);
        continue;
      }

      if (response.status === 429) {
        throw new Error("OPENAI_RATE_LIMITED");
      }
      if (response.status >= 500) {
        throw new Error(`OPENAI_5XX_${response.status}`);
      }

      const text = await response.text();
      throw new Error(`OPENAI_HTTP_${response.status}:${text}`);
    }

    if (!response) {
      throw new Error(lastError instanceof Error ? lastError.message : "OPENAI_UNKNOWN_ERROR");
    }

    const raw = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const content = raw.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OPENAI_EMPTY_RESPONSE");
    }

    const parsed = JSON.parse(content) as AIAnalysisResponse;
    const usage = buildUsageMetrics({
      model: config.model,
      promptTokens: raw.usage?.prompt_tokens ?? 0,
      completionTokens: raw.usage?.completion_tokens ?? 0,
      durationMs: Date.now() - started,
      retries,
    });

    return {
      response: parsed,
      usage,
      raw,
    };
  }
}
