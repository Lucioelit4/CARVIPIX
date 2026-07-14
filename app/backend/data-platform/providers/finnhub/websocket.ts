import { finnhubWebSocketUrl } from "./auth";
import type { FinnhubRuntimeConfig } from "./types";

export interface FinnhubWebSocketProbeResult {
  ok: boolean;
  details: string;
  latencyMs: number;
}

export class FinnhubWebSocketClient {
  constructor(private readonly config: FinnhubRuntimeConfig) {}

  async probeConnection(timeoutMs = 7000): Promise<FinnhubWebSocketProbeResult> {
    const started = Date.now();

    if (typeof WebSocket === "undefined") {
      return {
        ok: false,
        details: "WEBSOCKET_NOT_AVAILABLE_IN_RUNTIME",
        latencyMs: Date.now() - started,
      };
    }

    const socket = new WebSocket(finnhubWebSocketUrl(this.config));

    return await new Promise<FinnhubWebSocketProbeResult>((resolve) => {
      const timeoutId = setTimeout(() => {
        try {
          socket.close();
        } catch {
          // no-op
        }
        resolve({
          ok: false,
          details: "WEBSOCKET_TIMEOUT",
          latencyMs: Date.now() - started,
        });
      }, timeoutMs);

      socket.addEventListener("open", () => {
        clearTimeout(timeoutId);
        socket.close();
        resolve({
          ok: true,
          details: "WEBSOCKET_CONNECTED",
          latencyMs: Date.now() - started,
        });
      });

      socket.addEventListener("error", () => {
        clearTimeout(timeoutId);
        try {
          socket.close();
        } catch {
          // no-op
        }
        resolve({
          ok: false,
          details: "WEBSOCKET_ERROR_OR_BLOCKED",
          latencyMs: Date.now() - started,
        });
      });
    });
  }
}
