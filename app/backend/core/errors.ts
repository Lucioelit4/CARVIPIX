export type BackendErrorCategory = "internal" | "integration" | "engine" | "validation";

export interface BackendErrorContext {
  category: BackendErrorCategory;
  code: string;
  source: string;
  retryable?: boolean;
  details?: Record<string, unknown>;
}

export interface BackendErrorPayload {
  category: BackendErrorCategory;
  code: string;
  message: string;
  source: string;
  retryable: boolean;
  timestamp: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export class BackendError extends Error {
  readonly category: BackendErrorCategory;
  readonly code: string;
  readonly source: string;
  readonly retryable: boolean;
  readonly details?: Record<string, unknown>;
  readonly causeError?: unknown;

  constructor(message: string, context: BackendErrorContext, causeError?: unknown) {
    super(message);
    this.name = "BackendError";
    this.category = context.category;
    this.code = context.code;
    this.source = context.source;
    this.retryable = context.retryable ?? false;
    this.details = context.details;
    this.causeError = causeError;
  }

  toPayload(includeStack = false): BackendErrorPayload {
    return {
      category: this.category,
      code: this.code,
      message: this.message,
      source: this.source,
      retryable: this.retryable,
      timestamp: new Date().toISOString(),
      details: this.details,
      stack: includeStack ? this.stack : undefined,
    };
  }
}

export function normalizeBackendError(error: unknown, context: BackendErrorContext): BackendError {
  if (error instanceof BackendError) {
    return error;
  }

  if (error instanceof Error) {
    return new BackendError(error.message, context, error);
  }

  return new BackendError("Unknown backend error", {
    ...context,
    details: {
      ...(context.details ?? {}),
      originalError: error,
    },
  });
}

export function createValidationError(message: string, source: string, details?: Record<string, unknown>): BackendError {
  return new BackendError(message, {
    category: "validation",
    code: "VALIDATION_ERROR",
    source,
    retryable: false,
    details,
  });
}

export function createEngineError(message: string, source: string, details?: Record<string, unknown>): BackendError {
  return new BackendError(message, {
    category: "engine",
    code: "ENGINE_ERROR",
    source,
    retryable: true,
    details,
  });
}

export function createIntegrationError(
  message: string,
  source: string,
  details?: Record<string, unknown>
): BackendError {
  return new BackendError(message, {
    category: "integration",
    code: "INTEGRATION_ERROR",
    source,
    retryable: true,
    details,
  });
}

export function createInternalError(message: string, source: string, details?: Record<string, unknown>): BackendError {
  return new BackendError(message, {
    category: "internal",
    code: "INTERNAL_ERROR",
    source,
    retryable: false,
    details,
  });
}
