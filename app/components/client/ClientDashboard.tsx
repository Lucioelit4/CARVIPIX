"use client";

import React, { useCallback, useEffect, useState } from "react";

interface ClientLicense {
  license_id: string;
  status: string;
  expires_at: string;
  subscription_tier: string;
}

interface ClientInstallation {
  installation_id: string;
  broker: string;
  server: string;
  status: string;
  open_positions: number;
  daily_trades: number;
  last_heartbeat: string;
}

interface ClientExecution {
  signal_id: string;
  symbol: string;
  direction: string;
  entry_price: number;
  pnl: number;
  status: string;
  opened_at: string;
}

export default function ClientDashboard() {
  const [license, setLicense] = useState<ClientLicense | null>(null);
  const [installations, setInstallations] = useState<ClientInstallation[]>([]);
  const [executions, setExecutions] = useState<ClientExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "installations" | "results">("overview");
  const [showDownload, setShowDownload] = useState(false);
  const [nowTs] = useState(() => Date.now());

  const fetchClientData = useCallback(async () => {
    try {
      // Fetch license
      const licenseRes = await fetch("/api/client/bot/mt5/license");
      if (licenseRes.ok) {
        const data = await licenseRes.json();
        setLicense(data.license);
      }

      // Fetch installations
      const installationsRes = await fetch("/api/client/bot/mt5/installations");
      if (installationsRes.ok) {
        const data = await installationsRes.json();
        setInstallations(data.installations || []);
      }

      // Fetch executions
      const executionsRes = await fetch("/api/client/bot/mt5/executions");
      if (executionsRes.ok) {
        const data = await executionsRes.json();
        setExecutions(data.executions || []);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const bootstrap = setTimeout(() => {
      void fetchClientData();
    }, 0);
    const interval = setInterval(() => {
      void fetchClientData();
    }, 30000); // Actualizar cada 30 segundos
    return () => {
      clearTimeout(bootstrap);
      clearInterval(interval);
    };
  }, [fetchClientData]);

  const downloadEA = async () => {
    try {
      const res = await fetch("/api/client/bot/mt5/download-ea");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "CARVIPIX_EA_MT5_V1.ex5";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      alert(`Error downloading: ${error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-white text-2xl">Cargando...</div>
      </div>
    );
  }

  const isLicenseValid = license && license.status === "ACTIVE" && new Date(license.expires_at) > new Date();
  const daysUntilExpiration = license
    ? Math.ceil((new Date(license.expires_at).getTime() - nowTs) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-3 text-white sm:p-5 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl md:text-5xl">
            🚀 Panel de Control CARVIPIX
          </h1>
          <p className="text-gray-400">Gestión de tu Licencia y Operaciones Automatizadas</p>
        </div>

        {/* License Card */}
        {license && (
          <div className={`mb-8 rounded-xl p-8 border-2 ${
            isLicenseValid
              ? "bg-gradient-to-br from-green-900 to-green-800 border-green-600"
              : "bg-gradient-to-br from-red-900 to-red-800 border-red-600"
          }`}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
              <div>
                <p className="text-gray-300 text-sm">Estado</p>
                <p className="text-2xl font-bold">
                  {isLicenseValid ? "✅ Activo" : "⚠️ Inactivo"}
                </p>
              </div>
              <div>
                <p className="text-gray-300 text-sm">Plan</p>
                <p className="text-2xl font-bold">{license.subscription_tier}</p>
              </div>
              <div>
                <p className="text-gray-300 text-sm">Vence en</p>
                <p className="text-2xl font-bold">{daysUntilExpiration} días</p>
              </div>
              <div>
                <p className="text-gray-300 text-sm">Licencia</p>
                <p className="text-lg font-mono">{license.license_id.slice(0, 12)}...</p>
              </div>
            </div>

            {isLicenseValid && (
              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => setShowDownload(true)}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold flex items-center gap-2"
                >
                  📥 Descargar EA
                </button>
                <button
                  onClick={() => setActiveTab("installations")}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-bold flex items-center gap-2"
                >
                  💻 Mis Instalaciones
                </button>
              </div>
            )}
          </div>
        )}

        {/* Download Modal */}
        {showDownload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-3">
            <div className="max-w-md rounded-xl bg-gray-800 p-5 sm:p-8">
              <h2 className="text-2xl font-bold mb-4">📥 Descargar EA</h2>
              <p className="text-gray-300 mb-6">
                Descarga el Expert Advisor V1 compilado. Requiere:
              </p>
              <ul className="text-gray-300 text-sm mb-6 space-y-2">
                <li>✓ MetaTrader 5</li>
                <li>✓ Tu Licencia CARVIPIX</li>
                <li>✓ Conexión a Internet</li>
              </ul>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <button
                  onClick={downloadEA}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg font-bold"
                >
                  Descargar
                </button>
                <button
                  onClick={() => setShowDownload(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg font-bold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8 flex flex-wrap gap-2 border-b border-gray-700 pb-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-2 px-4 font-semibold ${
              activeTab === "overview"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            📊 Resumen
          </button>
          <button
            onClick={() => setActiveTab("installations")}
            className={`py-2 px-4 font-semibold ${
              activeTab === "installations"
                ? "border-b-2 border-green-500 text-green-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            💻 Instalaciones ({installations.length})
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`py-2 px-4 font-semibold ${
              activeTab === "results"
                ? "border-b-2 border-yellow-500 text-yellow-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            📈 Resultados ({executions.length})
          </button>
        </div>

        {/* Content */}
        <div className="rounded-xl bg-gray-800 p-4 sm:p-6">
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Resumen de Cuenta</h2>
              
              <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Instalaciones Activas</p>
                  <p className="text-3xl font-bold">
                    {installations.filter(i => i.status === "CONNECTED").length}
                  </p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Posiciones Abiertas</p>
                  <p className="text-3xl font-bold">
                    {installations.reduce((sum, i) => sum + (i.open_positions || 0), 0)}
                  </p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Operaciones Hoy</p>
                  <p className="text-3xl font-bold">
                    {installations.reduce((sum, i) => sum + (i.daily_trades || 0), 0)}
                  </p>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">📋 Instrucciones de Instalación</h3>
                <ol className="space-y-3 text-gray-300">
                  <li>
                    <strong>1. Descargar:</strong> Haz clic en &quot;Descargar EA&quot; en tu licencia
                  </li>
                  <li>
                    <strong>2. Instalar:</strong> Copia el archivo .ex5 a tu carpeta de Experts en MT5
                  </li>
                  <li>
                    <strong>3. Configurar:</strong> Abre MT5, ve a Advisors y busca CARVIPIX_EA_MT5_V1
                  </li>
                  <li>
                    <strong>4. Licencia:</strong> En los inputs del EA, ingresa tu License Key
                  </li>
                  <li>
                    <strong>5. Ejecutar:</strong> Habilita AutoTrading y el EA comienza a operar
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* INSTALLATIONS TAB */}
          {activeTab === "installations" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Mis Instalaciones</h2>

              {installations.length === 0 ? (
                <div className="bg-gray-700 rounded-lg p-8 text-center">
                  <p className="text-gray-400 mb-4">No hay instalaciones conectadas</p>
                  <p className="text-sm text-gray-500">
                    Descarga el EA e instálalo en tu MetaTrader 5
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {installations.map((inst, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-700 rounded-lg p-6 border-l-4 border-green-500"
                    >
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-4">
                        <div>
                          <p className="text-gray-400 text-sm">Broker</p>
                          <p className="font-bold">{inst.broker}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Servidor</p>
                          <p className="font-mono text-sm">{inst.server}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Estado</p>
                          <p className={`font-bold ${
                            inst.status === "CONNECTED" ? "text-green-400" : "text-red-400"
                          }`}>
                            {inst.status === "CONNECTED" ? "✅ Conectado" : "❌ Desconectado"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Última Conexión</p>
                          <p className="text-sm">
                            {new Date(inst.last_heartbeat).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-sm">
                        <span className="bg-blue-900 px-2 py-1 rounded">
                          Posiciones: {inst.open_positions}
                        </span>
                        <span className="bg-purple-900 px-2 py-1 rounded">
                          Trades hoy: {inst.daily_trades}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* RESULTS TAB */}
          {activeTab === "results" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Resultados de Operaciones</h2>

              {executions.length === 0 ? (
                <div className="bg-gray-700 rounded-lg p-8 text-center">
                  <p className="text-gray-400">Sin operaciones registradas</p>
                </div>
              ) : (
                <div className="cv-table-wrap">
                  <table className="cv-mobile-table w-full text-sm">
                    <thead className="border-b border-gray-600">
                      <tr>
                        <th className="text-left py-3 px-4">Símbolo</th>
                        <th className="text-left py-3 px-4">Tipo</th>
                        <th className="text-left py-3 px-4">Entrada</th>
                        <th className="text-left py-3 px-4">P/L</th>
                        <th className="text-left py-3 px-4">Estado</th>
                        <th className="text-left py-3 px-4">Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {executions.map((exec, idx) => (
                        <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700">
                          <td data-label="Símbolo" className="py-3 px-4 font-bold">{exec.symbol}</td>
                          <td data-label="Tipo" className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              exec.direction === "BUY"
                                ? "bg-green-900 text-green-200"
                                : "bg-red-900 text-red-200"
                            }`}>
                              {exec.direction}
                            </span>
                          </td>
                          <td data-label="Entrada" className="py-3 px-4">{exec.entry_price.toFixed(2)}</td>
                          <td data-label="P/L" className={`py-3 px-4 font-bold ${
                            exec.pnl >= 0 ? "text-green-400" : "text-red-400"
                          }`}>
                            ${exec.pnl.toFixed(2)}
                          </td>
                          <td data-label="Estado" className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              exec.status === "CLOSED"
                                ? "bg-blue-900 text-blue-200"
                                : "bg-yellow-900 text-yellow-200"
                            }`}>
                              {exec.status}
                            </span>
                          </td>
                          <td data-label="Hora" className="py-3 px-4 text-xs">
                            {new Date(exec.opened_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
