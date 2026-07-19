export type BackendEnvironment = "development" | "staging" | "production" | "test";
export type BackendLogLevel = "debug" | "info" | "warn" | "error";
export type RuntimeStage = "development" | "test" | "shadow" | "production";

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

export interface RuntimeEnvironmentValidation {
  stage: RuntimeStage;
  strict: boolean;
  errors: string[];
  warnings: string[];
}

function readEnv(env: EnvRecord, key: string): string {
  return String(env[key] ?? "").trim();
}

export function getRuntimeStage(env: EnvRecord = process.env): RuntimeStage {
  const explicit = readEnv(env, "CARVIPIX_ENV").toLowerCase();
  if (explicit === "shadow") {
    return "shadow";
  }
  if (explicit === "production") {
    return "production";
  }
  if (explicit === "test") {
    return "test";
  }
  if (explicit === "development") {
    return "development";
  }

  const nodeEnv = readEnv(env, "NODE_ENV").toLowerCase();
  if (nodeEnv === "production") {
    return "production";
  }
  if (nodeEnv === "test") {
    return "test";
  }

  return "development";
}

export function isStrictRuntime(env: EnvRecord = process.env): boolean {
  const stage = getRuntimeStage(env);
  return stage === "shadow" || stage === "production";
}

function requiredEnvKeysForPayments(env: EnvRecord): string[] {
  const provider = readEnv(env, "PAYMENT_GATEWAY_PROVIDER").toLowerCase() || "custom";
  const paymentEnv = readEnv(env, "PAYMENT_GATEWAY_ENV").toLowerCase() || "sandbox";

  if (provider === "mercadopago") {
    const prefix = paymentEnv === "production" ? "MERCADOPAGO_PRODUCTION" : "MERCADOPAGO_SANDBOX";
    return [`${prefix}_ACCESS_TOKEN`, `${prefix}_WEBHOOK_SECRET`];
  }

  return ["PAYMENT_GATEWAY_PROVIDER"];
}

export function validateCriticalEnvironment(env: EnvRecord = process.env): RuntimeEnvironmentValidation {
  const stage = getRuntimeStage(env);
  const strict = isStrictRuntime(env);
  const errors: string[] = [];
  const warnings: string[] = [];

  const requiredBase = [
    "ADMIN_SECRET",
    "OPENAI_API_KEY",
    "MT5_BRIDGE_BASE_URL",
    "CARVIPIX_JWT_SECRET",
    "COOKIE_SIGNING_SECRET",
    "DATABASE_URL",
  ];

  const required = [...requiredBase, ...requiredEnvKeysForPayments(env)];
  for (const key of required) {
    if (!readEnv(env, key)) {
      const message = `Missing required environment variable: ${key}`;
      if (strict) {
        errors.push(message);
      } else {
        warnings.push(message);
      }
    }
  }

  const classification = readEnv(env, "CARVIPIX_DATA_CLASSIFICATION");
  const validClassification = ["REAL", "SANDBOX", "DEMO", "MOCK", "PLACEHOLDER", "EMPTY"];
  if (!classification) {
    const message = "Missing required environment variable: CARVIPIX_DATA_CLASSIFICATION";
    if (strict) {
      errors.push(message);
    } else {
      warnings.push(message);
    }
  } else if (!validClassification.includes(classification)) {
    errors.push(
      `Invalid CARVIPIX_DATA_CLASSIFICATION: ${classification}. Expected one of ${validClassification.join(", ")}`
    );
  }

  return {
    stage,
    strict,
    errors,
    warnings,
  };
}

export function assertCriticalEnvironment(env: EnvRecord = process.env): void {
  const validation = validateCriticalEnvironment(env);
  if (validation.errors.length > 0) {
    throw new Error(
      `CARVIPIX_STARTUP_BLOCKED (${validation.stage}): ${validation.errors.join(" | ")}`
    );
  }
}

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
  const runtimeStage = getRuntimeStage(env);

  return {
    environment,
    engine: {
      seedFromScenarios: parseBoolean(env.BACKEND_ENGINE_SEED_SCENARIOS, runtimeStage === "development"),
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
