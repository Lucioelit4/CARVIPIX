function envString(name: string, fallback = ""): string {
  return (process.env[name] ?? fallback).trim();
}

function envInt(name: string, fallback: number, min: number): number {
  const raw = process.env[name];
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.trunc(parsed));
}

export interface OpenAIRuntimeConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  timeoutMs: number;
  maxRetries: number;
  retryBaseMs: number;
  organization: string | null;
  project: string | null;
}

export function getOpenAIRuntimeConfig(): OpenAIRuntimeConfig {
  const apiKey = envString("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("BLOCKED_BY_EXTERNAL_DEPENDENCY: OPENAI_CREDENTIALS");
  }

  const model = envString("OPENAI_MODEL");
  if (!model) {
    throw new Error("BLOCKED_BY_EXTERNAL_DEPENDENCY: OPENAI_MODEL");
  }

  const baseUrl = envString("OPENAI_BASE_URL", "https://api.openai.com/v1").replace(/\/+$/, "");
  const timeoutMs = envInt("OPENAI_TIMEOUT_MS", 30_000, 1_000);
  const maxRetries = envInt("OPENAI_MAX_RETRIES", 2, 0);
  const retryBaseMs = envInt("OPENAI_RETRY_BASE_MS", 750, 100);
  const organization = envString("OPENAI_ORGANIZATION") || null;
  const project = envString("OPENAI_PROJECT") || null;

  return {
    apiKey,
    model,
    baseUrl,
    timeoutMs,
    maxRetries,
    retryBaseMs,
    organization,
    project,
  };
}

export function buildOpenAIHeaders(config: OpenAIRuntimeConfig): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  };

  if (config.organization) {
    headers["OpenAI-Organization"] = config.organization;
  }
  if (config.project) {
    headers["OpenAI-Project"] = config.project;
  }

  return headers;
}

export function isRetryableOpenAIStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

export async function sleepMs(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}
