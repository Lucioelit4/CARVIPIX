import { NextRequest, NextResponse } from "next/server";
import { backendDatabase } from "@/app/backend/core/database";
import { requireActiveMt5License } from "../../_auth";
import { getTemporaryCertificationMode } from "@/app/backend/services/temporary-demo-certification-service";

type DbQueryResult<T> = { rows: T[] };

export type SignalNextInput = {
  licenseId: string;
  installationId: string;
  signalMode: "SHORT" | "MEDIUM" | "EXTENDED" | null;
};

type SignalNextDependencies = {
  authenticate: typeof requireActiveMt5License;
  query: typeof backendDatabase.query;
  getCertificationMode: typeof getTemporaryCertificationMode;
};

const defaultDependencies: SignalNextDependencies = {
  authenticate: requireActiveMt5License,
  query: backendDatabase.query.bind(backendDatabase),
  getCertificationMode: getTemporaryCertificationMode,
};

export async function handleSignalNext(
  input: SignalNextInput,
  request: NextRequest,
  dependencies: SignalNextDependencies = defaultDependencies,
) {
  const auth = await dependencies.authenticate(request);
  if (!auth.ok) return auth.response;

  const { licenseId, installationId, signalMode } = input;
  if (!licenseId || auth.licenseKey !== licenseId) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
  if (!installationId) {
    return NextResponse.json({ error: "Parámetro requerido: installation_id" }, { status: 400 });
  }

  const license = await dependencies.query(
    `SELECT id FROM bot_mt5_licenses WHERE license_id = $1 AND status = 'ACTIVE' LIMIT 1`,
    [licenseId],
  );
  const licenseResult = license as unknown as DbQueryResult<{ id: string }>;
  if (licenseResult.rows.length === 0) {
    return NextResponse.json({ has_signal: false, error: "Licencia inválida o inactiva" }, { status: 403 });
  }

  const signals = await dependencies.query(
    `WITH candidate AS (
       SELECT s.id, i.broker_symbol, i.installation_id
       FROM bot_mt5_signals s
       INNER JOIN bot_mt5_installations i
         ON i.license_id = s.license_id
        AND i.installation_id = $2
        AND i.status = 'ACTIVE'
        AND i.is_revoked = false
        AND NULLIF(i.broker_symbol, '') IS NOT NULL
        AND (i.canonical_symbol IS NULL OR UPPER(i.canonical_symbol) = 'MULTI' OR UPPER(i.canonical_symbol) = UPPER(s.canonical_symbol))
       WHERE s.license_id = $1
         AND s.status = 'PENDING'
         AND s.expires_at > NOW()
         AND ($3::text IS NULL OR s.signal_mode = $3)
       ORDER BY s.created_at ASC
       LIMIT 1
       FOR UPDATE OF s SKIP LOCKED
     )
     UPDATE bot_mt5_signals s
     SET status = 'DELIVERED',
         delivered_at = NOW(),
         delivered_installation_id = candidate.installation_id
     FROM candidate
     WHERE s.id = candidate.id
     RETURNING s.id, s.signal_id, s.event_id, s.symbol, s.canonical_symbol,
       candidate.broker_symbol, candidate.installation_id, s.decision, s.entry,
       s.stop_loss, s.take_profit, s.risk_reward, s.signature, s.created_at,
       s.expires_at, s.signal_mode, s.validity_minutes, s.source`,
    [licenseId, installationId, signalMode],
  );
  const signalResult = signals as unknown as DbQueryResult<{
    id: string;
    signal_id: string;
    event_id?: string;
    symbol: string;
    canonical_symbol: string;
    broker_symbol: string;
    installation_id: string;
    decision: string;
    entry: string;
    stop_loss: string;
    take_profit: string;
    risk_reward?: string;
    signature: string;
    created_at: string;
    expires_at: string;
    signal_mode: "SHORT" | "MEDIUM" | "EXTENDED";
    validity_minutes: number | null;
    source: string | null;
  }>;
  const signal = signalResult.rows[0];
  if (!signal) {
    return NextResponse.json({ has_signal: false, message: "No hay señales pendientes" });
  }

  const certificationMode = await dependencies.getCertificationMode(licenseId, signal.signal_id);
  return NextResponse.json({
    has_signal: true,
    signal_id: signal.signal_id,
    event_id: signal.event_id || signal.signal_id,
    symbol: signal.broker_symbol,
    canonical_symbol: signal.canonical_symbol,
    broker_symbol: signal.broker_symbol,
    installation_id: signal.installation_id,
    direction: signal.decision,
    decision: signal.decision,
    signature: signal.signature,
    entry: parseFloat(signal.entry),
    stop_loss: parseFloat(signal.stop_loss),
    take_profit: parseFloat(signal.take_profit),
    risk_reward: parseFloat(signal.risk_reward || "1.5"),
    status: "DELIVERED",
    certification_mode: certificationMode,
    signal_mode: signal.signal_mode,
    horizon: signal.signal_mode,
    validity_minutes: signal.validity_minutes,
    source: signal.source,
    created_at: signal.created_at,
    expires_at: signal.expires_at,
  });
}