/**
 * Community Publisher V1 - Validation Endpoint
 *
 * GET /api/internal/community-publisher/validate
 *
 * Ejecuta validación completa de la infraestructura Telegram.
 * No envía ningún mensaje. Solo verifica conexión y permisos.
 *
 * Protegido con x-internal-token (INTERNAL_OBSERVER_TOKEN).
 */

import { NextRequest, NextResponse } from "next/server";
import TelegramClientService from "@/app/lib/services/telegramClientService";
import { isSameOriginRequest } from "@/app/api/admin/_shared/security";

export const dynamic = "force-dynamic";

/**
 * Ocultar parcialmente el chat_id por seguridad en logs de frontend.
 * Ejemplo: -1001234567890 → -100*****7890
 */
function maskChatId(chatId: string | number): string {
  const s = String(chatId);
  if (s.length <= 6) return "***";
  return s.slice(0, 4) + "*".repeat(Math.max(0, s.length - 8)) + s.slice(-4);
}

export async function GET(request: NextRequest) {
  // ─── Auth: solo same-origin (admin panel) ───────────────────────────────
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ─── Variables de entorno ───────────────────────────────────────────────
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
  const channelTest = process.env.TELEGRAM_CHANNEL_TEST?.trim() || "";
  const channelOfficial = process.env.TELEGRAM_CHANNEL_OFFICIAL?.trim() || "";
  const testOnly = process.env.TEST_ONLY !== "false"; // default: true
  const enabled = process.env.COMMUNITY_PUBLISHER_ENABLED === "true";
  const timezone = process.env.CARVIPIX_TIMEZONE || "America/Mazatlan";

  const envStatus = {
    TELEGRAM_BOT_TOKEN: botToken.length > 0,
    TELEGRAM_CHANNEL_TEST: channelTest.length > 0,
    TELEGRAM_CHANNEL_OFFICIAL: channelOfficial.length > 0,
    COMMUNITY_PUBLISHER_ENABLED: enabled,
    TEST_ONLY: testOnly,
    CARVIPIX_TIMEZONE: timezone,
  };

  // ─── Si falta token, retornar inmediatamente ─────────────────────────────
  if (!botToken) {
    return NextResponse.json(
      {
        ok: false,
        status: "MISCONFIGURED",
        message: "TELEGRAM_BOT_TOKEN no está configurado en .env.local",
        env: envStatus,
        bot: null,
        channel_test: null,
        channel_official: null,
        permissions: null,
        validatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }

  // ─── Crear cliente (sin polling, solo fetch) ──────────────────────────────
  let client: TelegramClientService;
  try {
    client = new TelegramClientService({
      botToken,
      channelTest,
      channelOfficial,
      testOnly,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        status: "ERROR",
        message: (e as Error).message,
        env: envStatus,
        bot: null,
        channel_test: null,
        channel_official: null,
        permissions: null,
        validatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }

  // ─── 1. Verificar bot (getMe) ─────────────────────────────────────────────
  const botInfo = await client.getBotInfo();
  if (!botInfo.ok) {
    return NextResponse.json(
      {
        ok: false,
        status: "BOT_INVALID",
        message: botInfo.error || "Token inválido o bot no encontrado",
        env: envStatus,
        bot: null,
        channel_test: null,
        channel_official: null,
        permissions: null,
        validatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }

  const bot = {
    id: botInfo.id,
    name: botInfo.first_name,
    username: botInfo.username,
    connected: true,
  };

  // ─── 2. Validar canal de prueba ───────────────────────────────────────────
  let channelTestResult: {
    ok: boolean;
    title?: string;
    type?: string;
    chat_id_masked?: string;
    error?: string;
  } | null = null;

  if (channelTest) {
    const ch = await client.validateChannel(channelTest);
    channelTestResult = {
      ok: ch.valid,
      title: ch.info?.title,
      type: ch.info?.type,
      chat_id_masked: ch.info ? maskChatId(ch.info.id) : undefined,
      error: ch.error,
    };
  } else {
    channelTestResult = { ok: false, error: "TELEGRAM_CHANNEL_TEST no configurado" };
  }

  // ─── 3. Validar canal oficial ─────────────────────────────────────────────
  let channelOfficialResult: {
    ok: boolean;
    title?: string;
    type?: string;
    chat_id_masked?: string;
    error?: string;
  } | null = null;

  if (channelOfficial) {
    const ch = await client.validateChannel(channelOfficial);
    channelOfficialResult = {
      ok: ch.valid,
      title: ch.info?.title,
      type: ch.info?.type,
      chat_id_masked: ch.info ? maskChatId(ch.info.id) : undefined,
      error: ch.error,
    };
  } else {
    channelOfficialResult = {
      ok: false,
      error: "TELEGRAM_CHANNEL_OFFICIAL no configurado",
    };
  }

  // ─── 4. Verificar permisos en canal de prueba ─────────────────────────────
  let permissionsResult: {
    canSendMessages: boolean;
    canEditMessages: boolean;
    canDeleteMessages: boolean;
    detected: string[];
    missing: string[];
  } | null = null;

  if (channelTestResult.ok && channelTest) {
    const perms = await client.verifyBotPermissions(channelTest);
    const detected: string[] = [];
    const missing: string[] = [];

    if (perms.canSendMessages) detected.push("send_messages");
    else missing.push("send_messages");

    if (perms.canEditMessages) detected.push("edit_messages");
    else missing.push("edit_messages");

    if (perms.canDeleteMessages) detected.push("delete_messages");
    else missing.push("delete_messages");

    permissionsResult = {
      canSendMessages: perms.canSendMessages,
      canEditMessages: perms.canEditMessages,
      canDeleteMessages: perms.canDeleteMessages,
      detected,
      missing,
    };
  }

  // ─── 5. Determinar estado general ─────────────────────────────────────────
  const allGood =
    bot.connected &&
    channelTestResult.ok &&
    (permissionsResult?.canSendMessages ?? false);

  const hasWarnings =
    allGood &&
    (!(permissionsResult?.canEditMessages) || !(permissionsResult?.canDeleteMessages));

  let overallStatus: "READY_TO_TEST" | "WARNING" | "ERROR" | "MISCONFIGURED";
  if (!bot.connected || !channelTestResult.ok) {
    overallStatus = "ERROR";
  } else if (!enabled || !channelTest) {
    overallStatus = "MISCONFIGURED";
  } else if (hasWarnings) {
    overallStatus = "WARNING";
  } else {
    overallStatus = "READY_TO_TEST";
  }

  return NextResponse.json({
    ok: allGood,
    status: overallStatus,
    message:
      overallStatus === "READY_TO_TEST"
        ? "Infraestructura Telegram validada. Lista para pruebas."
        : overallStatus === "WARNING"
        ? "Conexión OK pero algunos permisos opcionales están ausentes."
        : "Validación incompleta. Revisar errores.",
    env: envStatus,
    bot,
    channel_test: channelTestResult,
    channel_official: channelOfficialResult,
    permissions: permissionsResult,
    test_only: testOnly,
    no_messages_sent: true,
    validatedAt: new Date().toISOString(),
  });
}
