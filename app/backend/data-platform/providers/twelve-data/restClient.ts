import { formatHttpError } from "./errors";
import type { TwelveDataResponseMeta, TwelveDataRuntimeConfig } from "./types";

async function sleepMs(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, Math.max(ms, 0)));
}

export class TwelveDataRestClient {
  constructor(private readonly config: TwelveDataRuntimeConfig) {}

  async getJson<T>(url: string): Promise<{ data: T; meta: TwelveDataResponseMeta; headers: Headers }> {
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
        const meta: TwelveDataResponseMeta = {
          url,
          status: response.status,
          latencyMs,
          fetchedAt,
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

        const body = payload as { code?: number; message?: string; status?: string };
        if (typeof body.code === "number" && body.code !== 200) {
          throw formatHttpError(400, url, payload);
        }

        return { data: payload as T, meta, headers: response.headers };
      } catch (error) {
        if (error instanceof Error && /aborted|timeout/i.test(error.message)) {
          if (attempt < this.config.maxRetries) {
            attempt += 1;
            await sleepMs(this.config.retryBaseMs * attempt);
            continue;
          }
          throw new Error("TWELVE_DATA_TIMEOUT");
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

    throw new Error(`TWELVE_DATA_REQUEST_FAILED:${url}`);
  }
}
