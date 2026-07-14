export interface FinnhubHttpErrorShape {
  error?: string;
  message?: string;
}

export function redactTokenFromEndpoint(endpoint: string): string {
  try {
    const url = new URL(endpoint);
    if (url.searchParams.has("token")) {
      url.searchParams.set("token", "***");
    }
    return url.toString();
  } catch {
    return endpoint.replace(/([?&]token=)[^&]+/i, "$1***");
  }
}

export class FinnhubHttpError extends Error {
  status: number;
  endpoint: string;
  retryable: boolean;
  blockedByPlan: boolean;

  constructor(input: { message: string; status: number; endpoint: string; retryable: boolean; blockedByPlan: boolean }) {
    super(input.message);
    this.status = input.status;
    this.endpoint = input.endpoint;
    this.retryable = input.retryable;
    this.blockedByPlan = input.blockedByPlan;
  }
}

export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

export function isPlanBlockedStatus(status: number): boolean {
  return status === 402 || status === 403;
}

export function formatHttpError(status: number, endpoint: string, payload: unknown): FinnhubHttpError {
  const body = (payload ?? {}) as FinnhubHttpErrorShape;
  const message = body.error ?? body.message ?? `FINNHUB_HTTP_${status}`;
  return new FinnhubHttpError({
    message: `FINNHUB_HTTP_${status}:${message}`,
    status,
    endpoint: redactTokenFromEndpoint(endpoint),
    retryable: isRetryableStatus(status),
    blockedByPlan: isPlanBlockedStatus(status),
  });
}
