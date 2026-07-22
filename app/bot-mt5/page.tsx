"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Activity, AlertCircle, CheckCircle2, Download, Settings } from "lucide-react";
import { CARVIPIXCard, CARVIPIXButton, colors } from "@/app/design-system";

interface MT5Status {
  connected: boolean;
  licenseId: string;
  accountNumber: number;
  broker: string;
  eaVersion: string;
  lastSignal: string | null;
  openTrades: number;
  lastHeartbeat: string | null;
  status: "ACTIVE" | "READ_ONLY" | "SUSPENDED" | "ERROR";
}

interface MT5Trade {
  id: string;
  symbol: string;
  direction: "BUY" | "SELL";
  entry: number;
  exit: number | null;
  sl: number;
  tp: number;
  pnl: number | null;
  openedAt: string;
  closedAt: string | null;
}

export default function ClientMT5Page() {
  const [now] = useState(() => Date.now());
  const [status] = useState<MT5Status | null>({
    connected: true,
    licenseId: "CARVIPIX-user1-LICENSE",
    accountNumber: 987654,
    broker: "OANDA",
    eaVersion: "1.0.0",
    lastSignal: new Date(now - 120000).toISOString(),
    openTrades: 2,
    lastHeartbeat: new Date(now - 5000).toISOString(),
    status: "ACTIVE",
  });
  const [trades] = useState<MT5Trade[]>([
    {
      id: "trade-1",
      symbol: "XAUUSD",
      direction: "BUY",
      entry: 2338.45,
      exit: 2345.20,
      sl: 2332.00,
      tp: 2345.00,
      pnl: 340.0,
      openedAt: new Date(now - 3600000).toISOString(),
      closedAt: new Date(now - 1800000).toISOString(),
    },
    {
      id: "trade-2",
      symbol: "EURUSD",
      direction: "BUY",
      entry: 1.07153,
      exit: null,
      sl: 1.06900,
      tp: 1.07900,
      pnl: null,
      openedAt: new Date(now - 600000).toISOString(),
      closedAt: null,
    },
  ]);

  if (!status) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="space-y-5 overflow-x-clip p-3 sm:p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold sm:text-3xl">Mi EA MT5</h1>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
          <CARVIPIXButton variant="primary" leftIcon={<Download className="w-4 h-4" />}>
            Descargar EA
          </CARVIPIXButton>
          <CARVIPIXButton variant="secondary" leftIcon={<Settings className="w-4 h-4" />}>
            Configurar
          </CARVIPIXButton>
        </div>
      </div>

      {/* Status Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <CARVIPIXCard className="p-6 border-l-4 border-green-500">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Estado del EA</h2>
              <div className="flex items-center gap-2 mb-4">
                {status.connected ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-700 font-medium">Conectado</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span className="text-red-700 font-medium">Desconectado</span>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 sm:gap-6">
                <div>
                  <p className="text-gray-600">Licencia</p>
                  <p className="break-all font-mono text-xs">{status.licenseId.substring(0, 25)}...</p>
                </div>
                <div>
                  <p className="text-gray-600">Cuenta</p>
                  <p className="font-bold">{status.accountNumber}</p>
                </div>
                <div>
                  <p className="text-gray-600">Broker</p>
                  <p className="font-bold">{status.broker}</p>
                </div>
                <div>
                  <p className="text-gray-600">Versión EA</p>
                  <p className="font-bold">{status.eaVersion}</p>
                </div>
                <div>
                  <p className="text-gray-600">Operaciones Abiertas</p>
                  <p className="font-bold text-lg">{status.openTrades}</p>
                </div>
                <div>
                  <p className="text-gray-600">Último Heartbeat</p>
                  <p className="text-xs">
                    {status.lastHeartbeat ? new Date(status.lastHeartbeat).toLocaleTimeString() : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-left md:text-right">
              <span
                className={`text-sm px-3 py-1 rounded-full font-medium ${
                  status.status === "ACTIVE"
                    ? "bg-green-100 text-green-700"
                    : status.status === "READ_ONLY"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {status.status}
              </span>
            </div>
          </div>
        </CARVIPIXCard>
      </motion.div>

      {/* Trades Table */}
      <CARVIPIXCard className="p-6">
        <h2 className="text-xl font-bold mb-4">Mis Operaciones</h2>

        {trades.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Sin operaciones aún</p>
        ) : (
          <div className="cv-table-wrap">
            <table className="cv-mobile-table w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Símbolo</th>
                  <th className="text-center py-3 px-4">Dirección</th>
                  <th className="text-right py-3 px-4">Entrada</th>
                  <th className="text-right py-3 px-4">Salida</th>
                  <th className="text-right py-3 px-4">SL</th>
                  <th className="text-right py-3 px-4">TP</th>
                  <th className="text-right py-3 px-4">P&L</th>
                  <th className="text-center py-3 px-4">Duración</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td data-label="Símbolo" className="py-3 px-4 font-bold">{trade.symbol}</td>
                    <td data-label="Dirección" className="py-3 px-4 text-center">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          trade.direction === "BUY" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {trade.direction}
                      </span>
                    </td>
                    <td data-label="Entrada" className="py-3 px-4 text-right font-mono">{trade.entry.toFixed(5)}</td>
                    <td data-label="Salida" className="py-3 px-4 text-right font-mono">
                      {trade.exit ? trade.exit.toFixed(5) : "—"}
                    </td>
                    <td data-label="SL" className="py-3 px-4 text-right font-mono text-xs text-gray-600">
                      {trade.sl.toFixed(5)}
                    </td>
                    <td data-label="TP" className="py-3 px-4 text-right font-mono text-xs text-gray-600">
                      {trade.tp.toFixed(5)}
                    </td>
                    <td data-label="P&L" className={`py-3 px-4 text-right font-bold ${trade.pnl! > 0 ? "text-green-600" : "text-red-600"}`}>
                      {trade.pnl ? `$${trade.pnl.toFixed(2)}` : "—"}
                    </td>
                    <td data-label="Duración" className="py-3 px-4 text-center text-xs text-gray-600">
                      {trade.closedAt
                        ? `${Math.floor(
                            (new Date(trade.closedAt).getTime() - new Date(trade.openedAt).getTime()) / 60000
                          )}m`
                        : "Abierta"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CARVIPIXCard>

      {/* Installation Instructions */}
      <CARVIPIXCard className="p-6 bg-blue-50 border border-blue-200">
        <h3 className="text-lg font-bold mb-3">¿Cómo instalar el EA?</h3>
        <ol className="space-y-2 text-sm list-decimal list-inside break-words">
          <li>Descarga el archivo CARVIPIX_EA_MT5_V1.ex5</li>
          <li>
            Abre MT5 y ve a <code className="bg-gray-200 px-1 rounded">File → Open Data Folder</code>
          </li>
          <li>
            Copia el archivo a <code className="bg-gray-200 px-1 rounded">MQL5\Experts</code>
          </li>
          <li>Reinicia MT5</li>
          <li>Abre el EA en el Market Watch</li>
          <li>
            En Inputs, ingresa tu licencia: <code className="bg-gray-200 px-1 rounded">{status.licenseId}</code>
          </li>
          <li>Compila y ejecuta</li>
        </ol>
      </CARVIPIXCard>
    </div>
  );
}
