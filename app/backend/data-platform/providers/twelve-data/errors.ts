export interface TwelveDataErrorBody {
  code?: number;
  status?: string;
  message?: string;
}

export function redactApikeyFromEndpoint(endpoint: string): string {
  try {
    const url = new URL(endpoint);
    if (url.searchParams.has("apikey")) {
      url.searchParams.set("apikey", "***");
    }
    return url.toString();
  } catch {
    return endpoint.replace(/([?&]apikey=)[^&]+/i, "$1***");
  }
}

export class TwelveDataHttpError extends Error {
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

export function formatHttpError(status: number, endpoint: string, payload: unknown): TwelveDataHttpError {
  const body = (payload ?? {}) as TwelveDataErrorBody;
  const message = body.message ?? body.status ?? `TWELVE_DATA_HTTP_${status}`;
  return new TwelveDataHttpError({
    message: `TWELVE_DATA_HTTP_${status}:${message}`,
    status,
    endpoint: redactApikeyFromEndpoint(endpoint),
    retryable: isRetryableStatus(status),
    blockedByPlan: isPlanBlockedStatus(status),
  });
}
