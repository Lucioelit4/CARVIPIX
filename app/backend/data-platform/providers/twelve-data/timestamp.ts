export interface TwelveTimestampParseResult {
  raw: string;
  utcMs: number | null;
  assumedUtc: boolean;
  hadExplicitOffset: boolean;
  reason: string | null;
}

const NO_OFFSET_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;
const EXPLICIT_OFFSET_PATTERN = /(Z|[+-]\d{2}:?\d{2})$/i;

function toUtcFromParts(parts: RegExpExecArray): number | null {
  const year = Number(parts[1]);
  const month = Number(parts[2]);
  const day = Number(parts[3]);
  const hour = Number(parts[4]);
  const minute = Number(parts[5]);
  const second = Number(parts[6] ?? "0");
  const ms = Number((parts[7] ?? "0").padEnd(3, "0"));

  const utcMs = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  const check = new Date(utcMs);

  if (
    check.getUTCFullYear() !== year
    || check.getUTCMonth() !== month - 1
    || check.getUTCDate() !== day
    || check.getUTCHours() !== hour
    || check.getUTCMinutes() !== minute
    || check.getUTCSeconds() !== second
    || check.getUTCMilliseconds() !== ms
  ) {
    return null;
  }

  return utcMs;
}

export function parseTwelveDataTimestampUtc(value: string | number): TwelveTimestampParseResult {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return {
      raw,
      utcMs: null,
      assumedUtc: false,
      hadExplicitOffset: false,
      reason: "EMPTY_TIMESTAMP",
    };
  }

  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    const utcMs = numeric < 10_000_000_000 ? numeric * 1000 : numeric;
    if (!Number.isFinite(utcMs) || utcMs <= 0) {
      return {
        raw,
        utcMs: null,
        assumedUtc: false,
        hadExplicitOffset: false,
        reason: "INVALID_NUMERIC_TIMESTAMP",
      };
    }
    return {
      raw,
      utcMs,
      assumedUtc: false,
      hadExplicitOffset: false,
      reason: null,
    };
  }

  if (EXPLICIT_OFFSET_PATTERN.test(raw)) {
    const utcMs = Date.parse(raw);
    if (!Number.isFinite(utcMs) || utcMs <= 0) {
      return {
        raw,
        utcMs: null,
        assumedUtc: false,
        hadExplicitOffset: true,
        reason: "INVALID_EXPLICIT_OFFSET_TIMESTAMP",
      };
    }
    return {
      raw,
      utcMs,
      assumedUtc: false,
      hadExplicitOffset: true,
      reason: null,
    };
  }

  const noOffset = NO_OFFSET_PATTERN.exec(raw);
  if (noOffset) {
    const utcMs = toUtcFromParts(noOffset);
    if (utcMs === null || utcMs <= 0) {
      return {
        raw,
        utcMs: null,
        assumedUtc: true,
        hadExplicitOffset: false,
        reason: "INVALID_NO_OFFSET_TIMESTAMP",
      };
    }
    return {
      raw,
      utcMs,
      assumedUtc: true,
      hadExplicitOffset: false,
      reason: null,
    };
  }

  return {
    raw,
    utcMs: null,
    assumedUtc: false,
    hadExplicitOffset: false,
    reason: "UNSUPPORTED_TIMESTAMP_FORMAT",
  };
}