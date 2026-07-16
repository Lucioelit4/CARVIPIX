"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Wifi, WifiOff, AlertTriangle, CheckCircle, XCircle, Shield } from "lucide-react";

interface BotInfo {
  id: number;
  name: string;
  username: string;
  connected: boolean;
}

interface ChannelInfo {
  ok: boolean;
  title?: string;
  type?: string;
  chat_id_masked?: string;
  error?: string;
}

interface PermissionsInfo {
  canSendMessages: boolean;
  canEditMessages: boolean;
  canDeleteMessages: boolean;
  detected: string[];
  missing: string[];
}

interface EnvStatus {
  TELEGRAM_BOT_TOKEN: boolean;
  TELEGRAM_CHANNEL_TEST: boolean;
  TELEGRAM_CHANNEL_OFFICIAL: boolean;
  COMMUNITY_PUBLISHER_ENABLED: boolean;
  TEST_ONLY: boolean;
  CARVIPIX_TIMEZONE: string;
}

interface ValidationData {
  ok: boolean;
  status: "READY_TO_TEST" | "WARNING" | "ERROR" | "MISCONFIGURED" | null;
  message: string;
  env: EnvStatus;
  bot: BotInfo | null;
  channel_test: ChannelInfo | null;
  channel_official: ChannelInfo | null;
  permissions: PermissionsInfo | null;
  test_only: boolean;
  no_messages_sent: boolean;
  validatedAt: string;
}

function StatusDot({ ok, partial }: { ok: boolean; partial?: boolean }) {
  if (partial) return <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-2" />;
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full mr-2 ${ok ? "bg-green-400" : "bg-red-400"}`}
    />
  );
}

function RowItem({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-slate-700 last:border-0">
      <span className="text-gray-400 text-xs">{label}</span>
      <span
        className={`text-xs font-mono font-semibold ${
          ok === true ? "text-green-400" : ok === false ? "text-red-400" : "text-gray-200"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function PermissionBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-mono ${
        ok ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
      }`}
    >
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

export function TelegramStatusCard() {
  const [data, setData] = useState<ValidationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchValidation = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const response = await fetch("/api/internal/community-publisher/validate");

      if (response.status === 401) {
        setError("No autorizado. Verificar sesión de admin.");
        return;
      }

      if (!response.ok) {
        setError(`Error ${response.status}`);
        return;
      }

      const json: ValidationData = await response.json();
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchValidation();
  }, [fetchValidation]);

  // ─── Status color and icon ───────────────────────────────────────────────
  const statusConfig = {
    READY_TO_TEST: {
      label: "🟢 READY TO TEST",
      border: "border-green-500",
      badge: "bg-green-900 text-green-300",
      icon: <CheckCircle className="h-5 w-5 text-green-400" />,
    },
    WARNING: {
      label: "🟡 WARNING",
      border: "border-yellow-500",
      badge: "bg-yellow-900 text-yellow-300",
      icon: <AlertTriangle className="h-5 w-5 text-yellow-400" />,
    },
    ERROR: {
      label: "🔴 ERROR",
      border: "border-red-500",
      badge: "bg-red-900 text-red-300",
      icon: <XCircle className="h-5 w-5 text-red-400" />,
    },
    MISCONFIGURED: {
      label: "🔴 MISCONFIGURED",
      border: "border-red-500",
      badge: "bg-red-900 text-red-300",
      icon: <XCircle className="h-5 w-5 text-red-400" />,
    },
  };

  const currentStatus = data?.status ? statusConfig[data.status] : null;

  if (loading) {
    return (
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-6 animate-pulse">
        <div className="h-5 bg-slate-600 rounded w-48 mb-4" />
        <div className="h-3 bg-slate-600 rounded w-full mb-2" />
        <div className="h-3 bg-slate-600 rounded w-3/4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-700 border border-red-700 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <WifiOff className="h-5 w-5 text-red-400" />
          <h2 className="text-white font-bold text-lg">TELEGRAM STATUS</h2>
        </div>
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={fetchValidation}
          className="mt-3 text-xs text-gray-400 hover:text-white flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" /> Reintentar
        </button>
      </div>
    );
  }

  return (
    <div
      className={`bg-slate-700 border rounded-lg p-6 ${
        currentStatus?.border ?? "border-slate-600"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {currentStatus?.icon ?? <Wifi className="h-5 w-5 text-gray-400" />}
          <h2 className="text-white font-bold text-lg tracking-wide">TELEGRAM STATUS</h2>
          {data?.status && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${currentStatus?.badge}`}
            >
              {currentStatus?.label}
            </span>
          )}
        </div>

        <button
          onClick={fetchValidation}
          disabled={refreshing}
          title="Revalidar conexión"
          className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Message */}
      {data?.message && (
        <p className="text-gray-300 text-sm mb-5">{data.message}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ─── Bot Info ─── */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-gray-300 text-xs font-bold uppercase tracking-wider mb-3">
            🤖 Bot
          </h3>
          {data?.bot ? (
            <div className="space-y-1">
              <RowItem label="Nombre" value={data.bot.name} />
              <RowItem label="Username" value={`@${data.bot.username}`} />
              <RowItem label="ID" value={String(data.bot.id)} />
              <RowItem
                label="Conectado"
                value={data.bot.connected ? "✅ SÍ" : "❌ NO"}
                ok={data.bot.connected}
              />
            </div>
          ) : (
            <p className="text-red-400 text-xs">
              {data?.env.TELEGRAM_BOT_TOKEN
                ? "Token configurado pero bot no responde"
                : "TELEGRAM_BOT_TOKEN no configurado"}
            </p>
          )}
        </div>

        {/* ─── Canal de Prueba ─── */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-gray-300 text-xs font-bold uppercase tracking-wider mb-3">
            🔬 Canal de Prueba
          </h3>
          {data?.channel_test ? (
            data.channel_test.ok ? (
              <div className="space-y-1">
                <RowItem label="Título" value={data.channel_test.title ?? "—"} />
                <RowItem label="Tipo" value={data.channel_test.type ?? "—"} />
                <RowItem label="Chat ID" value={data.channel_test.chat_id_masked ?? "—"} />
                <RowItem label="Accesible" value="✅ SÍ" ok={true} />
              </div>
            ) : (
              <p className="text-red-400 text-xs">{data.channel_test.error}</p>
            )
          ) : (
            <p className="text-gray-500 text-xs">TELEGRAM_CHANNEL_TEST no configurado</p>
          )}
        </div>

        {/* ─── Canal Oficial ─── */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-gray-300 text-xs font-bold uppercase tracking-wider mb-3">
            📣 Canal Oficial
          </h3>
          <div className="mb-2">
            <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded font-bold">
              BLOQUEADO por TEST_ONLY={data?.test_only ? "true" : "false"}
            </span>
          </div>
          {data?.channel_official ? (
            data.channel_official.ok ? (
              <div className="space-y-1">
                <RowItem label="Título" value={data.channel_official.title ?? "—"} />
                <RowItem label="Tipo" value={data.channel_official.type ?? "—"} />
                <RowItem label="Chat ID" value={data.channel_official.chat_id_masked ?? "—"} />
                <RowItem label="Accesible" value="✅ SÍ" ok={true} />
              </div>
            ) : (
              <p className="text-yellow-400 text-xs">{data.channel_official.error}</p>
            )
          ) : (
            <p className="text-gray-500 text-xs">TELEGRAM_CHANNEL_OFFICIAL no configurado</p>
          )}
        </div>

        {/* ─── Permisos ─── */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-gray-300 text-xs font-bold uppercase tracking-wider mb-3">
            🔐 Permisos del Bot
          </h3>
          {data?.permissions ? (
            <div className="flex flex-wrap gap-2">
              <PermissionBadge label="send_messages" ok={data.permissions.canSendMessages} />
              <PermissionBadge label="edit_messages" ok={data.permissions.canEditMessages} />
              <PermissionBadge label="delete_messages" ok={data.permissions.canDeleteMessages} />
              {data.permissions.missing.length > 0 && (
                <p className="w-full text-yellow-400 text-xs mt-2">
                  Faltantes: {data.permissions.missing.join(", ")}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-xs">
              {data?.channel_test?.ok
                ? "Verificando permisos..."
                : "Canal de prueba requerido para verificar permisos"}
            </p>
          )}
        </div>
      </div>

      {/* ─── Variables de Entorno ─── */}
      {data?.env && (
        <div className="mt-5 bg-slate-800 rounded-lg p-4">
          <h3 className="text-gray-300 text-xs font-bold uppercase tracking-wider mb-3">
            ⚙️ Variables de Entorno
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <RowItem
              label="BOT_TOKEN"
              value={data.env.TELEGRAM_BOT_TOKEN ? "✅ SET" : "❌ MISSING"}
              ok={data.env.TELEGRAM_BOT_TOKEN}
            />
            <RowItem
              label="CHANNEL_TEST"
              value={data.env.TELEGRAM_CHANNEL_TEST ? "✅ SET" : "❌ MISSING"}
              ok={data.env.TELEGRAM_CHANNEL_TEST}
            />
            <RowItem
              label="CHANNEL_OFFICIAL"
              value={data.env.TELEGRAM_CHANNEL_OFFICIAL ? "✅ SET" : "❌ MISSING"}
              ok={data.env.TELEGRAM_CHANNEL_OFFICIAL}
            />
            <RowItem
              label="CP_ENABLED"
              value={data.env.COMMUNITY_PUBLISHER_ENABLED ? "true" : "false"}
              ok={data.env.COMMUNITY_PUBLISHER_ENABLED}
            />
            <RowItem
              label="TEST_ONLY"
              value={data.env.TEST_ONLY ? "true ✅" : "false ⚠️"}
              ok={data.env.TEST_ONLY}
            />
            <RowItem
              label="TIMEZONE"
              value={data.env.CARVIPIX_TIMEZONE ?? "—"}
            />
          </div>
        </div>
      )}

      {/* ─── Footer: seguridad y timestamp ─── */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Shield className="h-3 w-3" />
          <span>
            {data?.no_messages_sent
              ? "✅ Cero mensajes enviados — Solo validación"
              : "⚠️ Revisar mensajes enviados"}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          {data?.validatedAt
            ? `Última validación: ${new Date(data.validatedAt).toLocaleTimeString("es-MX")}`
            : "—"}
        </p>
      </div>
    </div>
  );
}
