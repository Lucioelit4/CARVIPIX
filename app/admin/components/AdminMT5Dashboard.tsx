import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, AlertCircle, CheckCircle2, Download, Settings, Zap } from "lucide-react";
import { CARVIPIXCard, CARVIPIXButton, colors, spacing } from "@/app/design-system";

interface MT5Installation {
  id: string;
  licenseId: string;
  installationId: string;
  accountNumber: number;
  brokerServer: string;
  magicNumber: number;
  eaVersion: string;
  status: "VALIDATING" | "ACTIVE" | "READ_ONLY" | "SUSPENDED" | "ERROR";
  lastHeartbeat: string | null;
  isRevoked: boolean;
  maxOpenTrades: number;
  maxDailyTrades: number;
  maxDailyLossPercent: number;
}

interface MT5Stats {
  totalInstallations: number;
  activeInstallations: number;
  totalExecutions: number;
  totalPnL: number;
  lastUpdateTime: string;
  installations: MT5Installation[];
}

export default function AdminMT5Dashboard() {
  const [stats, setStats] = useState<MT5Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInstallation, setSelectedInstallation] = useState<MT5Installation | null>(null);

  useEffect(() => {
    // En producción, obtener datos reales
    setStats({
      totalInstallations: 3,
      activeInstallations: 2,
      totalExecutions: 45,
      totalPnL: 1250.5,
      lastUpdateTime: new Date().toISOString(),
      installations: [
        {
          id: "inst-1",
          licenseId: "CARVIPIX-user1-LICENSE",
          installationId: "INST-12345678",
          accountNumber: 987654,
          brokerServer: "mt5.broker.com",
          magicNumber: 123456,
          eaVersion: "1.0.0",
          status: "ACTIVE",
          lastHeartbeat: new Date(Date.now() - 30000).toISOString(),
          isRevoked: false,
          maxOpenTrades: 3,
          maxDailyTrades: 10,
          maxDailyLossPercent: 5,
        },
        {
          id: "inst-2",
          licenseId: "CARVIPIX-user2-LICENSE",
          installationId: "INST-87654321",
          accountNumber: 111222,
          brokerServer: "mt5.broker.com",
          magicNumber: 654321,
          eaVersion: "1.0.0",
          status: "ACTIVE",
          lastHeartbeat: new Date(Date.now() - 5000).toISOString(),
          isRevoked: false,
          maxOpenTrades: 3,
          maxDailyTrades: 10,
          maxDailyLossPercent: 5,
        },
        {
          id: "inst-3",
          licenseId: "CARVIPIX-user3-LICENSE",
          installationId: "INST-55555555",
          accountNumber: 333444,
          brokerServer: "mt5.broker.com",
          magicNumber: 333333,
          eaVersion: "0.9.5",
          status: "READ_ONLY",
          lastHeartbeat: null,
          isRevoked: false,
          maxOpenTrades: 1,
          maxDailyTrades: 5,
          maxDailyLossPercent: 3,
        },
      ],
    });
    setLoading(false);
  }, []);

  if (loading || !stats) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">EA MT5 Dashboard</h1>
        <CARVIPIXButton
          variant="primary"
          onClick={() => {
            /* Refresh stats */
          }}
        >
          Actualizar
        </CARVIPIXButton>
      </div>

      {/* Stats Grid */}
      <motion.div className="grid grid-cols-1 md:grid-cols-4 gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <CARVIPIXCard className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Instalaciones Activas</p>
            <p className="text-3xl font-bold text-blue-600">{stats.activeInstallations}</p>
            <p className="text-xs text-gray-500">(de {stats.totalInstallations})</p>
          </div>
        </CARVIPIXCard>

        <CARVIPIXCard className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Ejecuciones Totales</p>
            <p className="text-3xl font-bold text-green-600">{stats.totalExecutions}</p>
          </div>
        </CARVIPIXCard>

        <CARVIPIXCard className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">P&L Acumulado</p>
            <p className={`text-3xl font-bold ${stats.totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${stats.totalPnL.toFixed(2)}
            </p>
          </div>
        </CARVIPIXCard>

        <CARVIPIXCard className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Última Actualización</p>
            <p className="text-xs font-mono">{new Date(stats.lastUpdateTime).toLocaleTimeString()}</p>
          </div>
        </CARVIPIXCard>
      </motion.div>

      {/* Installations Table */}
      <CARVIPIXCard className="p-6">
        <h2 className="text-xl font-bold mb-4">Instalaciones Activas</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">License ID</th>
                <th className="text-left py-3 px-4">Cuenta</th>
                <th className="text-left py-3 px-4">Servidor</th>
                <th className="text-left py-3 px-4">EA Version</th>
                <th className="text-center py-3 px-4">Status</th>
                <th className="text-center py-3 px-4">Último Heartbeat</th>
                <th className="text-right py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {stats.installations.map((inst) => (
                <motion.tr key={inst.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">{inst.licenseId.substring(0, 20)}...</td>
                  <td className="py-3 px-4 text-xs text-gray-600">{inst.accountNumber}</td>
                  <td className="py-3 px-4 text-xs text-gray-600">{inst.brokerServer}</td>
                  <td className="py-3 px-4 text-xs">{inst.eaVersion}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        inst.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : inst.status === "READ_ONLY"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {inst.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-xs text-gray-600">
                    {inst.lastHeartbeat ? new Date(inst.lastHeartbeat).toLocaleTimeString() : "—"}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => setSelectedInstallation(inst)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      Ver
                    </button>
                    {inst.status === "ACTIVE" && (
                      <button
                        onClick={() => {
                          /* Suspend */
                        }}
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        Suspender
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </CARVIPIXCard>

      {/* Details Panel */}
      {selectedInstallation && (
        <CARVIPIXCard className="p-6 border border-blue-200 bg-blue-50">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold">Detalles de Instalación</h3>
            <button
              onClick={() => setSelectedInstallation(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">License ID</p>
              <p className="font-mono text-xs">{selectedInstallation.licenseId}</p>
            </div>
            <div>
              <p className="text-gray-600">Installation ID</p>
              <p className="font-mono text-xs">{selectedInstallation.installationId}</p>
            </div>
            <div>
              <p className="text-gray-600">Magic Number</p>
              <p className="font-bold">{selectedInstallation.magicNumber}</p>
            </div>
            <div>
              <p className="text-gray-600">Max Open Trades</p>
              <p className="font-bold">{selectedInstallation.maxOpenTrades}</p>
            </div>
            <div>
              <p className="text-gray-600">Max Daily Trades</p>
              <p className="font-bold">{selectedInstallation.maxDailyTrades}</p>
            </div>
            <div>
              <p className="text-gray-600">Max Daily Loss %</p>
              <p className="font-bold">{selectedInstallation.maxDailyLossPercent}%</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t flex gap-2">
            <CARVIPIXButton variant="secondary" size="sm">
              Ver Ejecuciones
            </CARVIPIXButton>
            <CARVIPIXButton variant="danger" size="sm">
              Revocar Licencia
            </CARVIPIXButton>
          </div>
        </CARVIPIXCard>
      )}
    </div>
  );
}
