import { NextRequest, NextResponse } from "next/server";

import { isSameOriginRequest } from "@/app/api/admin/_shared/security";
import { getOfficialDataPlatformSource } from "@/app/backend/data-platform";
import type { ConsumerAccessScope, DatasetKind, ProviderPullRequest } from "@/app/backend/data-platform";

const VALID_KINDS: DatasetKind[] = ["tick", "ohlc", "news", "economic-calendar", "spread", "session", "metadata"];

function parseKind(value: string | null): DatasetKind | null {
  if (!value) {
    return null;
  }

  return VALID_KINDS.includes(value as DatasetKind) ? (value as DatasetKind) : null;
}

function parseScopes(value: unknown): ConsumerAccessScope[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => String(entry).trim())
    .filter((entry) => ["query", "ultra-query", "catalog", "dashboard", "stream", "lineage"].includes(entry)) as ConsumerAccessScope[];
}

function parseBoolean(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function parseNumber(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseAssets(value: string | null): string[] | undefined {
  if (!value) {
    return undefined;
  }

  const assets = value
    .split(",")
    .map((asset) => asset.trim().toUpperCase())
    .filter(Boolean);

  return assets.length > 0 ? assets : undefined;
}

function resolveApiKey(request: NextRequest): string | null {
  const directHeader = request.headers.get("x-data-platform-key")?.trim();
  if (directHeader) {
    return directHeader;
  }

  const authHeader = request.headers.get("authorization")?.trim();
  if (!authHeader) {
    return null;
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function ensureAuthorized(request: NextRequest, requirePrivileged: boolean): NextResponse | null {
  const configuredKey = process.env.DATA_PLATFORM_API_KEY?.trim();
  const sameOrigin = isSameOriginRequest(request);
  const incomingKey = resolveApiKey(request);

  if (configuredKey) {
    if (incomingKey !== configuredKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return null;
  }

  if (!sameOrigin) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        detail: "Cross-origin access requires DATA_PLATFORM_API_KEY",
      },
      { status: 401 },
    );
  }

  if (requirePrivileged) {
    return NextResponse.json(
      {
        error: "Forbidden",
        detail: "Privileged actions require DATA_PLATFORM_API_KEY configuration",
      },
      { status: 403 },
    );
  }

  return null;
}

function requiredModuleId(request: NextRequest, fallback: string | null = null): string | null {
  const header = request.headers.get("x-module-id")?.trim();
  if (header) {
    return header;
  }

  const query = request.nextUrl.searchParams.get("moduleId")?.trim();
  if (query) {
    return query;
  }

  return fallback;
}

export async function GET(request: NextRequest) {
  const unauthorized = ensureAuthorized(request, false);
  if (unauthorized) {
    return unauthorized;
  }

  const source = await getOfficialDataPlatformSource();
  const params = request.nextUrl.searchParams;
  const action = (params.get("action") ?? "dashboard").toLowerCase();

  try {
    if (action === "health") {
      const kind = parseKind(params.get("kind"));
      const health = await source.healthCheck(kind ? [kind] : undefined);
      return NextResponse.json(health);
    }

    if (action === "query") {
      const moduleId = requiredModuleId(request);
      if (!moduleId) {
        return NextResponse.json({ error: "moduleId is required" }, { status: 400 });
      }

      const kind = parseKind(params.get("kind"));
      if (!kind) {
        return NextResponse.json({ error: "invalid kind" }, { status: 400 });
      }

      const rows = await source.queryForModule(
        moduleId,
        {
          kind,
          provider: params.get("provider") || undefined,
          asset: params.get("asset") || undefined,
          fromTs: parseNumber(params.get("fromTs")),
          toTs: parseNumber(params.get("toTs")),
          limit: parseNumber(params.get("limit")),
          sort: params.get("sort") === "desc" ? "desc" : "asc",
        },
        {
          ultraFast: parseBoolean(params.get("ultraFast")),
        },
      );

      return NextResponse.json({ rows, count: rows.length });
    }

    if (action === "catalog") {
      const moduleId = requiredModuleId(request);
      if (!moduleId) {
        return NextResponse.json({ error: "moduleId is required" }, { status: 400 });
      }

      return NextResponse.json({ datasets: source.getDatasetCatalogForModule(moduleId) });
    }

    if (action === "dashboard") {
      const moduleId = requiredModuleId(request);
      if (!moduleId) {
        return NextResponse.json({ error: "moduleId is required" }, { status: 400 });
      }

      return NextResponse.json(source.getDashboardForModule(moduleId));
    }

    if (action === "stream") {
      const moduleId = requiredModuleId(request);
      if (!moduleId) {
        return NextResponse.json({ error: "moduleId is required" }, { status: 400 });
      }

      const events = source.pollStreamEventsForModule(moduleId, {
        sinceTs: params.get("sinceTs") || undefined,
        limit: parseNumber(params.get("limit")),
      });

      return NextResponse.json({ events, count: events.length });
    }

    if (action === "lineage") {
      const moduleId = requiredModuleId(request);
      if (!moduleId) {
        return NextResponse.json({ error: "moduleId is required" }, { status: 400 });
      }

      const kind = parseKind(params.get("kind"));
      const lineage = source.getLineageForModule(moduleId, kind ?? undefined, parseNumber(params.get("limit")) ?? 500);
      return NextResponse.json({ lineage, count: lineage.length });
    }

    if (action === "violations") {
      return NextResponse.json({ violations: source.getDirectDownloadViolations() });
    }

    if (action === "consumers") {
      return NextResponse.json({ consumers: source.getConsumerModules() });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = ensureAuthorized(request, true);
  if (unauthorized) {
    return unauthorized;
  }

  const source = await getOfficialDataPlatformSource();
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "").trim().toLowerCase();

  try {
    if (action === "register-consumer") {
      const moduleId = String(body.moduleId ?? "").trim();
      const scopes = parseScopes(body.scopes);
      if (!moduleId || scopes.length === 0) {
        return NextResponse.json({ error: "moduleId and scopes are required" }, { status: 400 });
      }

      source.registerConsumerModule(moduleId, scopes);
      return NextResponse.json({ ok: true, consumer: source.getConsumerModules().find((entry) => entry.moduleId === moduleId) ?? null });
    }

    if (action === "disable-consumer") {
      const moduleId = String(body.moduleId ?? "").trim();
      if (!moduleId) {
        return NextResponse.json({ error: "moduleId is required" }, { status: 400 });
      }

      source.disableConsumerModule(moduleId);
      return NextResponse.json({ ok: true });
    }

    if (action === "record-violation") {
      const moduleId = String(body.moduleId ?? "").trim();
      const reason = String(body.reason ?? "").trim();
      const kind = parseKind(typeof body.kind === "string" ? body.kind : null) ?? undefined;

      if (!moduleId || !reason) {
        return NextResponse.json({ error: "moduleId and reason are required" }, { status: 400 });
      }

      await source.recordDirectDownloadViolation({ moduleId, reason, kind });
      return NextResponse.json({ ok: true });
    }

    if (action === "manual-sync") {
      const kind = parseKind(typeof body.kind === "string" ? body.kind : null);
      if (!kind) {
        return NextResponse.json({ error: "invalid kind" }, { status: 400 });
      }

      const requestInput: ProviderPullRequest = {
        kind,
        fromTs: typeof body.fromTs === "number" ? body.fromTs : undefined,
        toTs: typeof body.toTs === "number" ? body.toTs : undefined,
        assets: Array.isArray(body.assets) ? body.assets.map((asset) => String(asset).toUpperCase()) : undefined,
      };

      const version = await source.runManualDownload(requestInput);
      return NextResponse.json({ ok: true, version });
    }

    if (action === "sync-all") {
      const kinds = Array.isArray(body.kinds)
        ? body.kinds.map((kind) => parseKind(String(kind))).filter((kind): kind is DatasetKind => Boolean(kind))
        : undefined;
      await source.synchronizeAllKinds(kinds && kinds.length > 0 ? kinds : undefined);
      return NextResponse.json({ ok: true });
    }

    if (action === "integrity") {
      const kinds = Array.isArray(body.kinds)
        ? body.kinds.map((kind) => parseKind(String(kind))).filter((kind): kind is DatasetKind => Boolean(kind))
        : undefined;
      const summary = await source.runIntegrityMaintenance(kinds && kinds.length > 0 ? kinds : undefined);
      return NextResponse.json({ ok: true, summary });
    }

    if (action === "benchmark") {
      const summary = await source.runStressReadinessCheck({
        syntheticRows: typeof body.syntheticRows === "number" ? body.syntheticRows : undefined,
        asset: typeof body.asset === "string" ? body.asset : undefined,
        providerId: typeof body.providerId === "string" ? body.providerId : undefined,
      });
      return NextResponse.json({ ok: true, summary });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

