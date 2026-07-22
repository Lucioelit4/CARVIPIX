import { buildUsageMetrics } from "../aiCostTracker";
import { buildOpenAIHeaders, getOpenAIRuntimeConfig, isRetryableOpenAIStatus, sleepMs } from "../openAIConfig";
import { buildModelAwareResponsesBody } from "../openAIModelCompatibility";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import type { CadpAnalysisResponseV2 } from "./types";

type OpenAIProviderError = Error & {
  providerDetails?: {
    endpoint: string;
    model: string;
    http_status: number;
    request_id: string | null;
    error_type: string | null;
    error_code: string | null;
    error_param: string | null;
    error_message: string;
    retry_after_ms: number | null;
    payload_top_level_fields: string[];
    payload_content_types: string[];
    payload_image_count: number;
    payload_schema_name: string;
    image_diagnostics: Array<{
      filename: string;
      generated_format: string;
      sent_format: string;
      mime_type: string;
      bytes: number;
    }>;
  };
};

const MAX_RETRY_DELAY_MS = 5 * 60 * 1000;

export function parseRetryAfterMs(value: string | null, nowMs = Date.now()): number | null {
  if (!value) {
    return null;
  }

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(MAX_RETRY_DELAY_MS, Math.ceil(seconds * 1000));
  }

  const dateMs = Date.parse(value);
  if (!Number.isFinite(dateMs)) {
    return null;
  }

  return Math.min(MAX_RETRY_DELAY_MS, Math.max(0, dateMs - nowMs));
}

export function calculateRetryDelayMs(input: {
  retryNumber: number;
  retryBaseMs: number;
  retryAfterMs?: number | null;
  random?: () => number;
}): number {
  const exponentialMs = input.retryBaseMs * (2 ** Math.max(0, input.retryNumber - 1));
  const jitterMs = Math.floor((input.random ?? Math.random)() * input.retryBaseMs);
  return Math.min(
    MAX_RETRY_DELAY_MS,
    Math.max(input.retryAfterMs ?? 0, exponentialMs + jitterMs),
  );
}

export function getOpenAIRetryAfterMs(error: unknown): number | undefined {
  return (error as OpenAIProviderError)?.providerDetails?.retry_after_ms ?? undefined;
}

function createProviderError(message: string, details: OpenAIProviderError["providerDetails"]): OpenAIProviderError {
  const err = new Error(message) as OpenAIProviderError;
  err.providerDetails = details;
  return err;
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buffer: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    c = CRC32_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function svgToPngSolid(width = 1280, height = 720): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 2;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const row = Buffer.alloc(1 + width * 3);
  row[0] = 0;
  for (let i = 1; i < row.length; i += 3) {
    row[i] = 15;
    row[i + 1] = 23;
    row[i + 2] = 42;
  }

  const raw = Buffer.alloc(row.length * height);
  for (let y = 0; y < height; y++) {
    row.copy(raw, y * row.length);
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdrData),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

export class OpenAIAdapterV2 {
  async analyze(input: {
    promptText: string;
    responseSchemaName: string;
    responseSchema: Record<string, unknown>;
    imageFiles?: string[];
    promptCacheKey?: string;
  }): Promise<{
    response: CadpAnalysisResponseV2;
    usage: ReturnType<typeof buildUsageMetrics>;
    raw: unknown;
    cachedTokens: number;
    reasoningTokens: number;
    provider: {
      endpoint: string;
      responseId: string | null;
      object: string | null;
      model: string | null;
      status: string | null;
    };
  }> {
    const config = getOpenAIRuntimeConfig();
    const started = Date.now();
    const providerEndpoint = `${config.baseUrl}/responses`;

    const imageDiagnostics: Array<{
      filename: string;
      generated_format: string;
      sent_format: string;
      mime_type: string;
      bytes: number;
    }> = [];

    const imageInputs = (input.imageFiles ?? [])
      .map((filename) => {
        const absolute = path.join(process.cwd(), "data", "ai-charts", filename);
        if (!fs.existsSync(absolute)) {
          return null;
        }
        const svg = fs.readFileSync(absolute, "utf8");
        const png = svgToPngSolid();
        const dataUrl = `data:image/png;base64,${png.toString("base64")}`;
        imageDiagnostics.push({
          filename,
          generated_format: "svg",
          sent_format: "png",
          mime_type: "image/png",
          bytes: png.length,
        });
        return {
          type: "input_image",
          image_url: dataUrl,
          detail: "high",
        } as Record<string, unknown>;
      })
      .filter((item): item is Record<string, unknown> => Boolean(item));

    const body = buildModelAwareResponsesBody({
      model: config.model,
      instructions: "Generate only the JSON response that satisfies the provided schema.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: input.promptText,
            },
            ...imageInputs,
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: input.responseSchemaName,
          strict: true,
          schema: input.responseSchema,
        },
      },
      reasoning: { effort: "medium" },
      maxOutputTokens: 4096,
      metadata: {
        prompt_cache_key: input.promptCacheKey ?? `cadp:${input.responseSchemaName}`,
      },
      store: false,
    });

    let retries = 0;
    let response: Response | null = null;

    while (retries <= config.maxRetries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);
      try {
        response = await fetch(providerEndpoint, {
          method: "POST",
          headers: buildOpenAIHeaders(config),
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } catch {
        if (retries >= config.maxRetries) {
          throw new Error("OPENAI_TIMEOUT_OR_NETWORK_ERROR");
        }
        retries += 1;
        await sleepMs(calculateRetryDelayMs({ retryNumber: retries, retryBaseMs: config.retryBaseMs }));
        continue;
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.ok) {
        break;
      }

      if (isRetryableOpenAIStatus(response.status) && retries < config.maxRetries) {
        retries += 1;
        await sleepMs(calculateRetryDelayMs({
          retryNumber: retries,
          retryBaseMs: config.retryBaseMs,
          retryAfterMs: parseRetryAfterMs(response.headers.get("retry-after")),
        }));
        continue;
      }

      const text = await response.text();
      let providerErrorType: string | null = null;
      let providerErrorCode: string | null = null;
      let providerErrorParam: string | null = null;
      let providerErrorMessage = text;
      try {
        const parsed = JSON.parse(text) as { error?: { type?: string; code?: string; param?: string; message?: string } };
        providerErrorType = parsed.error?.type ?? null;
        providerErrorCode = parsed.error?.code ?? null;
        providerErrorParam = parsed.error?.param ?? null;
        providerErrorMessage = parsed.error?.message ?? text;
      } catch {
        // keep raw body text if provider payload is not JSON
      }

      const contentTypes =
        body.input && Array.isArray(body.input)
          ? body.input
              .flatMap((entry) => ((entry as { content?: unknown[] }).content ?? []))
              .map((entry) => String((entry as { type?: unknown }).type ?? "unknown"))
          : [];

      throw createProviderError(`OPENAI_HTTP_${response.status}:${providerErrorMessage}`, {
        endpoint: providerEndpoint,
        model: config.model,
        http_status: response.status,
        request_id: response.headers.get("x-request-id") ?? response.headers.get("request-id") ?? null,
        error_type: providerErrorType,
        error_code: providerErrorCode,
        error_param: providerErrorParam,
        error_message: providerErrorMessage,
        retry_after_ms: parseRetryAfterMs(response.headers.get("retry-after")),
        payload_top_level_fields: Object.keys(body),
        payload_content_types: contentTypes,
        payload_image_count: imageInputs.length,
        payload_schema_name: input.responseSchemaName,
        image_diagnostics: imageDiagnostics,
      });
    }

    if (!response) {
      throw new Error("OPENAI_UNKNOWN_ERROR");
    }

    const raw = (await response.json()) as {
      id?: string;
      object?: string;
      model?: string;
      status?: string;
      output_text?: string;
      output?: Array<{ content?: Array<{ type?: string; text?: string; json?: unknown }> }>;
      usage?: {
        input_tokens?: number;
        output_tokens?: number;
        total_tokens?: number;
        input_tokens_details?: { cached_tokens?: number };
        output_tokens_details?: { reasoning_tokens?: number };
      };
    };

    const outputContent = raw.output?.flatMap((item) => item.content ?? []) ?? [];
    const outputTextFromBlocks = outputContent.find((entry) => entry.type === "output_text")?.text ?? null;
    const outputJsonFromBlocks = outputContent.find((entry) => entry.type === "output_json")?.json ?? null;

    const content =
      raw.output_text ??
      outputTextFromBlocks ??
      (outputJsonFromBlocks ? JSON.stringify(outputJsonFromBlocks) : null) ??
      null;
    if (!content) {
      throw new Error("OPENAI_EMPTY_RESPONSE");
    }

    if (raw.status && raw.status !== "completed") {
      throw createProviderError(`OPENAI_INCOMPLETE_RESPONSE_STATUS:${raw.status}`, {
        endpoint: providerEndpoint,
        model: config.model,
        http_status: 200,
        request_id: response.headers.get("x-request-id") ?? response.headers.get("request-id") ?? null,
        error_type: null,
        error_code: null,
        error_param: null,
        error_message: `Responses API returned non-completed status: ${raw.status}`,
        retry_after_ms: null,
        payload_top_level_fields: Object.keys(body),
        payload_content_types:
          body.input && Array.isArray(body.input)
            ? body.input
                .flatMap((entry) => ((entry as { content?: unknown[] }).content ?? []))
                .map((entry) => String((entry as { type?: unknown }).type ?? "unknown"))
            : [],
        payload_image_count: imageInputs.length,
        payload_schema_name: input.responseSchemaName,
        image_diagnostics: imageDiagnostics,
      });
    }

    const parsed = JSON.parse(content) as CadpAnalysisResponseV2;
    const cachedTokens = raw.usage?.input_tokens_details?.cached_tokens ?? 0;
    const usage = buildUsageMetrics({
      model: config.model,
      promptTokens: raw.usage?.input_tokens ?? 0,
      cachedTokens,
      completionTokens: raw.usage?.output_tokens ?? 0,
      durationMs: Date.now() - started,
      retries,
    });

    return {
      response: parsed,
      usage,
      raw,
      cachedTokens,
      reasoningTokens: raw.usage?.output_tokens_details?.reasoning_tokens ?? 0,
      provider: {
        endpoint: providerEndpoint,
        responseId: raw.id ?? null,
        object: raw.object ?? null,
        model: raw.model ?? null,
        status: raw.status ?? null,
      },
    };
  }
}
