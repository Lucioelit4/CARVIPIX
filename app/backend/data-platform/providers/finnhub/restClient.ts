import { formatHttpError, isRetryableStatus } from "./errors";
import type { FinnhubResponseMeta, FinnhubRuntimeConfig } from "./types";

async function sleepMs(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, Math.max(ms, 0)));
}

function extractRateLimit(headers: Headers): FinnhubResponseMeta["rateLimit"] {
  const limit = Number(headers.get("x-ratelimit-limit"));
  const remaining = Number(headers.get("x-ratelimit-remaining"));
  const reset = Number(headers.get("x-ratelimit-reset"));

  return {
    limit: Number.isFinite(limit) ? limit : undefined,
    remaining: Number.isFinite(remaining) ? remaining : undefined,
    reset: Number.isFinite(reset) ? reset : undefined,
  };
}

export class FinnhubRestClient {
  constructor(private readonly config: FinnhubRuntimeConfig) {}

  async getJson<T>(url: string): Promise<{ data: T; meta: FinnhubResponseMeta }> {
    let attempt = 0;

    while (attempt <= this.config.maxRetries) {
      const started = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      try {
        const response = await fetch(url, {
          method: "GET",
          signal: controller.signal,
        });

        const latencyMs = Date.now() - started;
        const fetchedAt = new Date().toISOString();
        const rateLimit = extractRateLimit(response.headers);
        const meta: FinnhubResponseMeta = {
          url,
          status: response.status,
          latencyMs,
          fetchedAt,
          rateLimit,
        };

        let payload: unknown = null;
        try {
          payload = await response.json();
        } catch {
          payload = {};
        }

        if (!response.ok) {
          const err = formatHttpError(response.status, url, payload);
          if (err.retryable && attempt < this.config.maxRetries) {
            attempt += 1;
            await sleepMs(this.config.retryBaseMs * attempt);
            continue;
          }
          throw err;
        }

        return { data: payload as T, meta };
      } catch (error) {
        if (error instanceof Error && /aborted|timeout/i.test(error.message)) {
          if (attempt < this.config.maxRetries) {
            attempt += 1;
            await sleepMs(this.config.retryBaseMs * attempt);
            continue;
          }
          throw new Error("FINNHUB_TIMEOUT");
        }

        if (error instanceof Error && !("status" in (error as object)) && attempt < this.config.maxRetries) {
          attempt += 1;
          await sleepMs(this.config.retryBaseMs * attempt);
          continue;
        }

        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw new Error(`FINNHUB_REQUEST_FAILED:${url}`);
  }

  isStatusRetryable(status: number): boolean {
    return isRetryableStatus(status);
  }
}
