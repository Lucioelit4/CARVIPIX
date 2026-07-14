import { getFinnhubRuntimeConfig } from "./config";
import { FinnhubNewsService } from "./news";
import { FinnhubWebSocketClient } from "./websocket";
import type { FinnhubProbeCheck, FinnhubProbeSummary } from "./types";
import { FinnhubHttpError } from "./errors";

function appendError(checks: FinnhubProbeCheck[], check: string, error: unknown): void {
  if (error instanceof FinnhubHttpError) {
    checks.push({
      check,
      ok: false,
      details: error.message,
      endpoint: error.endpoint,
      blockedByPlan: error.blockedByPlan,
      blockedByAuth: error.status === 401,
      statusCode: error.status,
    });
    return;
  }

  checks.push({
    check,
    ok: false,
    details: error instanceof Error ? error.message : String(error),
  });
}

export async function runFinnhubConnectionProbe(): Promise<FinnhubProbeSummary> {
  const config = getFinnhubRuntimeConfig();
  const checks: FinnhubProbeCheck[] = [];

  const news = new FinnhubNewsService(config);
  const ws = new FinnhubWebSocketClient(config);

  try {
    const auth = await news.getGeneral("general");
    checks.push({
      check: "authentication",
      ok: auth.items.length >= 0,
      details: `General news request executed items=${auth.items.length}`,
      latencyMs: auth.latencyMs,
      endpoint: "/news?category=general",
    });
  } catch (error) {
    appendError(checks, "authentication", error);
  }

  try {
    const now = Date.now();
    const fromYmd = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const toYmd = new Date(now).toISOString().slice(0, 10);
    const companyNews = await news.getCompanyNews("AAPL", fromYmd, toYmd);
    checks.push({
      check: "news:company",
      ok: companyNews.items.length >= 0,
      details: `items=${companyNews.items.length}`,
      latencyMs: companyNews.latencyMs,
      endpoint: "/company-news",
    });
  } catch (error) {
    appendError(checks, "news:company", error);
  }

  try {
    const generalNews = await news.getGeneral("general");
    const relevant = FinnhubNewsService.filterRelevant(generalNews.items, ["gold", "xau", "usd", "btc", "bitcoin"]);
    checks.push({
      check: "news:general-relevance",
      ok: generalNews.items.length >= 0,
      details: `general=${generalNews.items.length} relevant_keywords=${relevant.length}`,
      latencyMs: generalNews.latencyMs,
      endpoint: "/news?category=general",
    });
  } catch (error) {
    appendError(checks, "news:general-relevance", error);
  }

  try {
    const wsProbe = await ws.probeConnection();
    checks.push({
      check: "websocket:connect",
      ok: wsProbe.ok,
      details: wsProbe.details,
      latencyMs: wsProbe.latencyMs,
      endpoint: "wss://ws.finnhub.io",
      blockedByPlan: !wsProbe.ok && /blocked/i.test(wsProbe.details),
    });
  } catch (error) {
    appendError(checks, "websocket:connect", error);
  }

  return {
    provider: "finnhub",
    at: new Date().toISOString(),
    mode: "evaluation",
    checks,
  };
}
