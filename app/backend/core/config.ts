export type BackendEnvironment = "development" | "staging" | "production" | "test";
export type BackendLogLevel = "debug" | "info" | "warn" | "error";

export interface BackendConfig {
  environment: BackendEnvironment;
  engine: {
    seedFromScenarios: boolean;
  };
  logging: {
    level: BackendLogLevel;
    includeAudit: boolean;
  };
  observability: {
    enabled: boolean;
    slowCallThresholdMs: number;
  };
  errors: {
    includeStackInPayload: boolean;
  };
  auth: {
    enabled: boolean;
    strategy: "none" | "jwt" | "session";
  };
  queue: {
    enabled: boolean;
    defaultMaxRetries: number;
  };
  scheduler: {
    enabled: boolean;
    maxTasks: number;
  };
  rateLimit: {
    enabled: boolean;
    defaultLimit: number;
    defaultWindowMs: number;
  };
  cache: {
    enabled: boolean;
    defaultTtlMs: number;
    maxEntries: number;
  };
  audit: {
    enabled: boolean;
    maxRecords: number;
  };
}

type EnvRecord = Record<string, string | undefined>;

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

function parseEnvironment(value: string | undefined): BackendEnvironment {
  if (value === "production" || value === "staging" || value === "test") {
    return value;
  }

  return "development";
}

function parseLogLevel(value: string | undefined): BackendLogLevel {
  if (value === "debug" || value === "info" || value === "warn" || value === "error") {
    return value;
  }

  return "info";
}

function parseAuthStrategy(value: string | undefined): "none" | "jwt" | "session" {
  if (value === "jwt" || value === "session") {
    return value;
  }

  return "none";
}

export function createBackendConfig(env: EnvRecord = process.env): BackendConfig {
  const environment = parseEnvironment(env.NODE_ENV);

  return {
    environment,
    engine: {
      seedFromScenarios: parseBoolean(env.BACKEND_ENGINE_SEED_SCENARIOS, true),
    },
    logging: {
      level: parseLogLevel(env.BACKEND_LOG_LEVEL),
      includeAudit: parseBoolean(env.BACKEND_LOG_AUDIT, true),
    },
    observability: {
      enabled: parseBoolean(env.BACKEND_OBSERVABILITY_ENABLED, true),
      slowCallThresholdMs: parseNumber(env.BACKEND_OBSERVABILITY_SLOW_CALL_MS, 450),
    },
    errors: {
      includeStackInPayload: parseBoolean(env.BACKEND_ERRORS_INCLUDE_STACK, environment !== "production"),
    },
    auth: {
      enabled: parseBoolean(env.BACKEND_AUTH_ENABLED, false),
      strategy: parseAuthStrategy(env.BACKEND_AUTH_STRATEGY),
    },
    queue: {
      enabled: parseBoolean(env.BACKEND_QUEUE_ENABLED, true),
      defaultMaxRetries: parseNumber(env.BACKEND_QUEUE_MAX_RETRIES, 3),
    },
    scheduler: {
      enabled: parseBoolean(env.BACKEND_SCHEDULER_ENABLED, true),
      maxTasks: parseNumber(env.BACKEND_SCHEDULER_MAX_TASKS, 200),
    },
    rateLimit: {
      enabled: parseBoolean(env.BACKEND_RATE_LIMIT_ENABLED, false),
      defaultLimit: parseNumber(env.BACKEND_RATE_LIMIT_DEFAULT_LIMIT, 120),
      defaultWindowMs: parseNumber(env.BACKEND_RATE_LIMIT_DEFAULT_WINDOW_MS, 60_000),
    },
    cache: {
      enabled: parseBoolean(env.BACKEND_CACHE_ENABLED, true),
      defaultTtlMs: parseNumber(env.BACKEND_CACHE_DEFAULT_TTL_MS, 30_000),
      maxEntries: parseNumber(env.BACKEND_CACHE_MAX_ENTRIES, 5_000),
    },
    audit: {
      enabled: parseBoolean(env.BACKEND_AUDIT_ENABLED, true),
      maxRecords: parseNumber(env.BACKEND_AUDIT_MAX_RECORDS, 10_000),
    },
  };
}

export const backendConfig = createBackendConfig();
