import { twelveDataWebSocketUrl } from "./auth";
import type { TwelveDataRuntimeConfig } from "./types";

export interface TwelveDataWebSocketProbeResult {
  connected: boolean;
  updatesReceived: number;
  firstUpdateLatencyMs: number | null;
  totalDurationMs: number;
  errorMessage: string | null;
  symbolsSubscribed: string[];
}

export class TwelveDataWebSocketClient {
  constructor(private readonly config: TwelveDataRuntimeConfig) {}

  async probe(input?: { symbols?: string[]; durationMs?: number }): Promise<TwelveDataWebSocketProbeResult> {
    const started = Date.now();

    if (typeof WebSocket === "undefined") {
      return {
        connected: false,
        updatesReceived: 0,
        firstUpdateLatencyMs: null,
        totalDurationMs: 0,
        errorMessage: "WEBSOCKET_NOT_AVAILABLE_IN_RUNTIME",
        symbolsSubscribed: input?.symbols ?? [],
      };
    }

    const symbols = input?.symbols ?? ["BTC/USD", "EUR/USD", "XAU/USD"];
    const durationMs = input?.durationMs ?? 8000;
    const url = twelveDataWebSocketUrl(this.config);
    const socket = new WebSocket(url);

    return await new Promise<TwelveDataWebSocketProbeResult>((resolve) => {
      let connected = false;
      let updatesReceived = 0;
      let firstUpdateLatencyMs: number | null = null;
      let errorMessage: string | null = null;

      const timeoutId = setTimeout(() => {
        try {
          socket.close();
        } catch {
          // no-op
        }
        resolve({
          connected,
          updatesReceived,
          firstUpdateLatencyMs,
          totalDurationMs: Date.now() - started,
          errorMessage,
          symbolsSubscribed: symbols,
        });
      }, durationMs);

      socket.addEventListener("open", () => {
        connected = true;
        for (const symbol of symbols) {
          socket.send(JSON.stringify({ action: "subscribe", params: { symbols: symbol } }));
        }
      });

      socket.addEventListener("message", () => {
        updatesReceived += 1;
        if (firstUpdateLatencyMs === null) {
          firstUpdateLatencyMs = Date.now() - started;
        }
      });

      socket.addEventListener("error", () => {
        errorMessage = "WEBSOCKET_ERROR";
      });

      socket.addEventListener("close", () => {
        clearTimeout(timeoutId);
        resolve({
          connected,
          updatesReceived,
          firstUpdateLatencyMs,
          totalDurationMs: Date.now() - started,
          errorMessage,
          symbolsSubscribed: symbols,
        });
      });
    });
  }
}
