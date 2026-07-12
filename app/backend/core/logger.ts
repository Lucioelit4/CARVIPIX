import type { BackendLogLevel } from "./config";
import type { BackendErrorPayload } from "./errors";

export type BackendLogCategory = "event" | "error" | "warning" | "audit" | "performance";

export interface BackendLogEntry {
  level: BackendLogLevel;
  category: BackendLogCategory;
  message: string;
  context: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  error?: BackendErrorPayload;
}

export interface BackendLogger {
  debug(context: string, message: string, metadata?: Record<string, unknown>): void;
  info(context: string, message: string, metadata?: Record<string, unknown>): void;
  warn(context: string, message: string, metadata?: Record<string, unknown>): void;
  error(context: string, message: string, error?: BackendErrorPayload, metadata?: Record<string, unknown>): void;
  audit(context: string, message: string, metadata?: Record<string, unknown>): void;
  performance(context: string, message: string, metadata?: Record<string, unknown>): void;
  child(scope: string): BackendLogger;
}

const logPriority: Record<BackendLogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const sensitiveKeyPattern = /(password|passwd|secret|token|api[-_]?key|authorization|cookie|set-cookie|clientsecret|access[-_]?token|refresh[-_]?token)/i;

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }
  if (value && typeof value === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (sensitiveKeyPattern.test(key)) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = sanitizeValue(nested);
      }
    }
    return sanitized;
  }
  if (typeof value === "string" && value.length > 512) {
    return `${value.slice(0, 509)}...`;
  }
  return value;
}

export class InMemoryBackendLogger implements BackendLogger {
  readonly entries: BackendLogEntry[] = [];

  constructor(
    private readonly minLevel: BackendLogLevel,
    private readonly scope?: string
  ) {}

  debug(context: string, message: string, metadata?: Record<string, unknown>): void {
    this.write("debug", "event", context, message, metadata);
  }

  info(context: string, message: string, metadata?: Record<string, unknown>): void {
    this.write("info", "event", context, message, metadata);
  }

  warn(context: string, message: string, metadata?: Record<string, unknown>): void {
    this.write("warn", "warning", context, message, metadata);
  }

  error(context: string, message: string, error?: BackendErrorPayload, metadata?: Record<string, unknown>): void {
    this.write("error", "error", context, message, metadata, error);
  }

  audit(context: string, message: string, metadata?: Record<string, unknown>): void {
    this.write("info", "audit", context, message, metadata);
  }

  performance(context: string, message: string, metadata?: Record<string, unknown>): void {
    this.write("info", "performance", context, message, metadata);
  }

  child(scope: string): BackendLogger {
    const mergedScope = this.scope ? `${this.scope}.${scope}` : scope;
    return new InMemoryBackendLogger(this.minLevel, mergedScope);
  }

  private canWrite(level: BackendLogLevel): boolean {
    return logPriority[level] >= logPriority[this.minLevel];
  }

  private write(
    level: BackendLogLevel,
    category: BackendLogCategory,
    context: string,
    message: string,
    metadata?: Record<string, unknown>,
    error?: BackendErrorPayload
  ): void {
    if (!this.canWrite(level)) {
      return;
    }

    const entry: BackendLogEntry = {
      level,
      category,
      message,
      context: this.scope ? `${this.scope}.${context}` : context,
      timestamp: new Date().toISOString(),
      metadata: metadata ? (sanitizeValue(metadata) as Record<string, unknown>) : undefined,
      error: error ? (sanitizeValue(error) as BackendErrorPayload) : undefined,
    };

    this.entries.push(entry);
  }
}
