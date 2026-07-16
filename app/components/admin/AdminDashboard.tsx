"use client";

import React, { useState, useEffect } from "react";

interface License {
  id: string;
  license_id: string;
  status: string;
  expires_at: string;
  subscription_tier: string;
  created_at: string;
}

interface Installation {
  id: string;
  license_id: string;
  installation_id: string;
  broker: string;
  server: string;
  account_number: number;
  status: string;
  open_positions: number;
  daily_trades: number;
  last_heartbeat: string;
}

interface Signal {
  id: string;
  signal_id: string;
  symbol: string;
  decision: string;
  entry: number;
  stop_loss: number;
  take_profit: number;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"licenses" | "installations" | "signals">("licenses");

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Actualizar cada 10 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch licenses
      const licensesRes = await fetch("/api/admin/bot/mt5/licenses");
      if (licensesRes.ok) {
        const data = await licensesRes.json();
        setLicenses(data.licenses || []);
      }

      // Fetch installations
      const installationsRes = await fetch("/api/admin/bot/mt5/installations");
      if (installationsRes.ok) {
        const data = await installationsRes.json();
        setInstallations(data.installations || []);
      }

      // Fetch signals
      const signalsRes = await fetch("/api/admin/bot/mt5/signals");
      if (signalsRes.ok) {
        const data = await signalsRes.json();
        setSignals(data.signals || []);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const createNewLicense = async () => {
    const tier = prompt("Subscription tier (BASIC, PRO, ENTERPRISE):");
    if (!tier) return;

    try {
      const res = await fetch("/api/admin/bot/mt5/licenses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription_tier: tier,
          max_installations: tier === "ENTERPRISE" ? 999 : tier === "PRO" ? 5 : 1,
          expires_in_days: 365,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`✅ Licencia creada:\n${data.license_id}`);
        fetchData();
      }
    } catch (error) {
      alert(`❌ Error: ${error}`);
    }
  };

  const suspendLicense = async (licenseId: string) => {
    try {
      const res = await fetch(`/api/admin/bot/mt5/licenses/${licenseId}/suspend`, {
        method: "POST",
      });

      if (res.ok) {
        alert("✅ Licencia suspendida");
        fetchData();
      }
    } catch (error) {
      alert(`❌ Error: ${error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-2xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🎮 CARVIPIX EA Admin Dashboard</h1>
          <p className="text-gray-400">Gestión de Licencias, Instalaciones y Señales</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-lg">
            <div className="text-3xl font-bold">{licenses.length}</div>
            <div className="text-gray-300">Licencias Activas</div>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-lg">
            <div className="text-3xl font-bold">{installations.filter(i => i.status === 'CONNECTED').length}</div>
            <div className="text-gray-300">Instalaciones Conectadas</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 p-6 rounded-lg">
            <div className="text-3xl font-bold">{signals.filter(s => s.status === 'PENDING').length}</div>
            <div className="text-gray-300">Señales Pendientes</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-lg">
            <div className="text-3xl font-bold">{signals.filter(s => s.status === 'EXECUTED').length}</div>
            <div className="text-gray-300">Señales Ejecutadas</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-700">
          <button
            onClick={() => setActiveTab("licenses")}
            className={`py-2 px-4 font-semibold ${
              activeTab === "licenses"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            📜 Licencias
          </button>
          <button
            onClick={() => setActiveTab("installations")}
            className={`py-2 px-4 font-semibold ${
              activeTab === "installations"
                ? "border-b-2 border-green-500 text-green-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            💻 Instalaciones
          </button>
          <button
            onClick={() => setActiveTab("signals")}
            className={`py-2 px-4 font-semibold ${
              activeTab === "signals"
                ? "border-b-2 border-yellow-500 text-yellow-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            📊 Señales
          </button>
        </div>

        {/* Content */}
        <div className="bg-gray-800 rounded-lg p-6">
          {/* LICENSES TAB */}
          {activeTab === "licenses" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Licencias</h2>
                <button
                  onClick={createNewLicense}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold"
                >
                  + Nueva Licencia
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-600">
                    <tr>
                      <th className="text-left py-3 px-4">License ID</th>
                      <th className="text-left py-3 px-4">Tier</th>
                      <th className="text-left py-3 px-4">Estado</th>
                      <th className="text-left py-3 px-4">Expires</th>
                      <th className="text-left py-3 px-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {licenses.map((license) => (
                      <tr key={license.id} className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-4 font-mono text-xs">{license.license_id}</td>
                        <td className="py-3 px-4">
                          <span className="bg-purple-900 px-2 py-1 rounded text-xs">
                            {license.subscription_tier}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              license.status === "ACTIVE"
                                ? "bg-green-900 text-green-200"
                                : "bg-red-900 text-red-200"
                            }`}
                          >
                            {license.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {new Date(license.expires_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => suspendLicense(license.license_id)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            Suspender
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INSTALLATIONS TAB */}
          {activeTab === "installations" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Instalaciones Conectadas</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-600">
                    <tr>
                      <th className="text-left py-3 px-4">Installation ID</th>
                      <th className="text-left py-3 px-4">Broker</th>
                      <th className="text-left py-3 px-4">Account</th>
                      <th className="text-left py-3 px-4">Estado</th>
                      <th className="text-left py-3 px-4">Posiciones</th>
                      <th className="text-left py-3 px-4">Último Heartbeat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installations.map((inst) => (
                      <tr key={inst.id} className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-4 font-mono text-xs">{inst.installation_id}</td>
                        <td className="py-3 px-4">{inst.broker}</td>
                        <td className="py-3 px-4 text-xs">{inst.account_number}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              inst.status === "CONNECTED"
                                ? "bg-green-900 text-green-200"
                                : "bg-red-900 text-red-200"
                            }`}
                          >
                            {inst.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">{inst.open_positions}</td>
                        <td className="py-3 px-4 text-xs">
                          {new Date(inst.last_heartbeat).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SIGNALS TAB */}
          {activeTab === "signals" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Señales</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-600">
                    <tr>
                      <th className="text-left py-3 px-4">Signal ID</th>
                      <th className="text-left py-3 px-4">Símbolo</th>
                      <th className="text-left py-3 px-4">Decision</th>
                      <th className="text-left py-3 px-4">Entry</th>
                      <th className="text-left py-3 px-4">SL / TP</th>
                      <th className="text-left py-3 px-4">Estado</th>
                      <th className="text-left py-3 px-4">Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signals.map((signal) => (
                      <tr key={signal.id} className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-4 font-mono text-xs">{signal.signal_id}</td>
                        <td className="py-3 px-4 font-bold">{signal.symbol}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              signal.decision === "BUY"
                                ? "bg-green-900 text-green-200"
                                : "bg-red-900 text-red-200"
                            }`}
                          >
                            {signal.decision}
                          </span>
                        </td>
                        <td className="py-3 px-4">{signal.entry.toFixed(2)}</td>
                        <td className="py-3 px-4 text-xs">
                          {signal.stop_loss.toFixed(2)} / {signal.take_profit.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              signal.status === "EXECUTED"
                                ? "bg-blue-900 text-blue-200"
                                : signal.status === "PENDING"
                                ? "bg-yellow-900 text-yellow-200"
                                : "bg-gray-700 text-gray-300"
                            }`}
                          >
                            {signal.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {new Date(signal.created_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
