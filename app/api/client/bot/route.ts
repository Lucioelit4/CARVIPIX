import { NextRequest, NextResponse } from "next/server";

import { ecosystemServices } from "@/app/backend";
import { BotAccessGuard, CommercialAccessError, LicenseGuard } from "@/app/backend/commercial/access-control";
import { recordCommercialAuditEvent } from "@/app/backend/commercial/audit-store";
import { hashCredentialSecret, listBotConnections, listBotLogs } from "@/app/backend/commercial/portal-service";
import { resolveUserCommercialAccess } from "@/app/backend/commercial/plan-entitlements-store";
import { backendDatabase } from "@/app/backend/core/database";
import { requireClientSession } from "@/app/api/client/_auth";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function insertBotLog(userId: string, botInstanceId: string | null, level: "info" | "warning" | "error", eventType: string, message: string, metadata: Record<string, unknown> = {}) {
  await backendDatabase.query(
    `
    INSERT INTO bot_event_logs (id, user_id, bot_instance_id, level, event_type, message, metadata, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW())
    `,
    [createId("blog"), userId, botInstanceId, level, eventType, message, JSON.stringify(metadata)]
  );
}

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const commercialAccess = await resolveUserCommercialAccess(auth.user.id);
    const context = { membershipActive: commercialAccess.membershipActive, entitlements: commercialAccess.entitlements };
    new BotAccessGuard().assertCanProvisionBot(context, 0);

    const [license, instances, connections, logs, updates] = await Promise.all([
      ecosystemServices.bot.getLicense(auth.user.id),
      ecosystemServices.bot.getBotInstances(auth.user.id),
      listBotConnections(auth.user.id),
      listBotLogs(auth.user.id),
      ecosystemServices.bot.getAvailableUpdates(),
    ]);

    return NextResponse.json({ data: { license, instances, connections, logs, updates } }, { status: 200 });
  } catch (error) {
    if (error instanceof CommercialAccessError) {
      await recordCommercialAuditEvent({ userId: auth.user.id, actorType: "client", action: "bot.read", resource: "bot", result: "denied", metadata: { code: error.code } });
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    return NextResponse.json({ error: "No se pudo cargar el Bot" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "").trim();

  try {
    const commercialAccess = await resolveUserCommercialAccess(auth.user.id);
    const context = { membershipActive: commercialAccess.membershipActive, entitlements: commercialAccess.entitlements };

    if (action === "createInstance") {
      const existing = await ecosystemServices.bot.getBotInstances(auth.user.id);
      new BotAccessGuard().assertCanProvisionBot(context, existing.length);
      const data = await ecosystemServices.bot.createBotInstance(auth.user.id, {
        name: String(body.name ?? "Bot CARVIPIX").trim() || "Bot CARVIPIX",
        strategy: (body.strategy as "grid" | "momentum" | "breakout" | "scalping") ?? "momentum",
        status: "inactive",
        symbol: String(body.symbol ?? "EURUSD").trim().toUpperCase(),
        riskLevel: (body.riskLevel as "low" | "medium" | "high") ?? "medium",
        configuration: typeof body.configuration === "object" && body.configuration ? (body.configuration as Record<string, unknown>) : {},
        startedAt: undefined,
      });
      await insertBotLog(auth.user.id, data.id, "info", "instance.created", "Instancia de bot creada", { symbol: data.symbol, strategy: data.strategy });
      await recordCommercialAuditEvent({ userId: auth.user.id, actorType: "client", action: "bot.instance.create", resource: data.id, result: "success" });
      return NextResponse.json({ data }, { status: 201 });
    }

    if (action === "updateConfiguration") {
      const botId = String(body.botId ?? "").trim();
      const configuration = typeof body.configuration === "object" && body.configuration ? (body.configuration as Record<string, unknown>) : {};
      await backendDatabase.query(
        `
        UPDATE bot_instances
        SET name = COALESCE($3, name),
            symbol = COALESCE($4, symbol),
            risk_level = COALESCE($5, risk_level),
            configuration = $6::jsonb
        WHERE id = $1 AND user_id = $2
        `,
        [
          botId,
          auth.user.id,
          body.name ? String(body.name) : null,
          body.symbol ? String(body.symbol).trim().toUpperCase() : null,
          body.riskLevel ? String(body.riskLevel) : null,
          JSON.stringify(configuration),
        ]
      );
      await insertBotLog(auth.user.id, botId, "info", "configuration.updated", "Configuracion del bot actualizada", { configuration });
      await recordCommercialAuditEvent({ userId: auth.user.id, actorType: "client", action: "bot.configuration.update", resource: botId, result: "success" });
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (action === "changeStatus") {
      const botId = String(body.botId ?? "").trim();
      const nextStatus = String(body.status ?? "inactive") as "inactive" | "running" | "paused" | "error";
      const license = await ecosystemServices.bot.getLicense(auth.user.id);
      if (nextStatus === "running") {
        new LicenseGuard().assertActive(license ? { active: license.active, expiryDate: license.expiryDate } : null);
      }
      await backendDatabase.query(
        `
        UPDATE bot_instances
        SET status = $3,
            started_at = CASE WHEN $3 = 'running' THEN NOW() ELSE started_at END
        WHERE id = $1 AND user_id = $2
        `,
        [botId, auth.user.id, nextStatus]
      );
      await insertBotLog(auth.user.id, botId, "info", "status.changed", `Estado del bot actualizado a ${nextStatus}`, { nextStatus });
      await recordCommercialAuditEvent({ userId: auth.user.id, actorType: "client", action: "bot.status.change", resource: botId, result: "success", metadata: { nextStatus } });
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (action === "connectBroker") {
      const botId = String(body.botId ?? "").trim();
      const brokerType = String(body.brokerType ?? "MT5") as "MT4" | "MT5";
      const server = String(body.server ?? "").trim();
      const login = String(body.login ?? "").trim();
      const password = String(body.password ?? "").trim();
      const mode = String(body.mode ?? "demo").trim();
      const license = await ecosystemServices.bot.getLicense(auth.user.id);
      new LicenseGuard().assertActive(license ? { active: license.active, expiryDate: license.expiryDate } : null);

      await ecosystemServices.bot.connectBroker(botId, brokerType, { server, login, password });
      await backendDatabase.query(
        `
        INSERT INTO bot_connection_profiles (
          id, user_id, bot_instance_id, broker_type, server, login, mode, connection_status, credentials_hash, last_synced_at, heartbeat_at, reconnect_attempts, diagnostic_summary, metadata, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'connected', $8, NOW(), NOW(), 0, $9, $10::jsonb, NOW(), NOW()
        )
        ON CONFLICT (id) DO NOTHING
        `,
        [
          createId("bcp"),
          auth.user.id,
          botId,
          brokerType,
          server,
          login,
          mode,
          hashCredentialSecret(password),
          `Conexion preparada para ${brokerType} ${mode}`,
          JSON.stringify({ mode }),
        ]
      );
      await insertBotLog(auth.user.id, botId, "info", "broker.connected", "Infraestructura de conexion preparada", { brokerType, server, login, mode });
      await recordCommercialAuditEvent({ userId: auth.user.id, actorType: "client", action: "bot.broker.connect", resource: botId, result: "success", metadata: { brokerType, mode } });
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (action === "runDiagnostics") {
      const botId = String(body.botId ?? "").trim();
      await insertBotLog(auth.user.id, botId, "info", "diagnostics.completed", "Diagnostico completado: conexion preparada, heartbeat pendiente de broker real.", {});
      await backendDatabase.query(
        `
        UPDATE bot_connection_profiles
        SET diagnostic_summary = $3, updated_at = NOW()
        WHERE bot_instance_id = $1 AND user_id = $2
        `,
        [botId, auth.user.id, "Diagnostico OK. Broker no implementado aun; infraestructura preparada."]
      );
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    return NextResponse.json({ error: "Accion de bot no soportada" }, { status: 400 });
  } catch (error) {
    if (error instanceof CommercialAccessError) {
      await recordCommercialAuditEvent({ userId: auth.user.id, actorType: "client", action: `bot.${action}`, resource: "bot", result: "denied", metadata: { code: error.code } });
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    await recordCommercialAuditEvent({ userId: auth.user.id, actorType: "client", action: `bot.${action || 'unknown'}`, resource: "bot", result: "error" });
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo ejecutar la accion del bot" }, { status: 500 });
  }
}