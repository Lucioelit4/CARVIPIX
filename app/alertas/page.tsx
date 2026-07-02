"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import AlertFilters from "./components/AlertFilters";
import AlertStats from "./components/AlertStats";
import AlertsTable from "./components/AlertsTable";
import AlertDetails from "./components/AlertDetails";
import AlertHistory from "./components/AlertHistory";

// Demo alert data. Replace with real API data when available.
const demoAlerts = [
  {
    id: "xauusd-1432",
    symbol: "XAUUSD",
    market: "Oro",
    tipo: "Compra",
    entrada: "2338.45",
    sl: "2332.00",
    tp: "2345.00",
    rr: "2.31",
    estado: "Activa",
    hora: "14:32",
    session: "Londres",
    risk: "Medio",
    probability: "88%",
    analysis:
      "Compra confirmada después de un rompimiento de estructura en H1. El precio mitigó una zona institucional y tomó liquidez antes de continuar el movimiento.",
    plan: "PRO",
    direction: "Compra",
  },
  {
    id: "btcusd-1428",
    symbol: "BTCUSD",
    market: "Crypto",
    tipo: "Compra",
    entrada: "61520.00",
    sl: "60780.00",
    tp: "62880.00",
    rr: "3.12",
    estado: "Activa",
    hora: "14:28",
    session: "NY",
    risk: "Alto",
    probability: "92%",
    analysis:
      "Señal de compra con momentum claro tras soporte en 1H. Las velas muestran fuerza alcista y el riesgo está definido con disciplina.",
    plan: "ELITE",
    direction: "Compra",
  },
  {
    id: "eurusd-1355",
    symbol: "EURUSD",
    market: "Forex",
    tipo: "Venta",
    entrada: "1.07153",
    sl: "1.07320",
    tp: "1.06900",
    rr: "1.80",
    estado: "TP cerca",
    hora: "13:55",
    session: "Asia",
    risk: "Medio",
    probability: "79%",
    analysis:
      "La presión vendedora domina tras el rechazo en la resistencia. Se recomienda reducir tamaño si el precio llega a la zona clave.",
    plan: "PRO",
    direction: "Venta",
  },
  {
    id: "gbpusd-1215",
    symbol: "GBPUSD",
    market: "Forex",
    tipo: "Venta",
    entrada: "1.26840",
    sl: "1.27200",
    tp: "1.26200",
    rr: "1.77",
    estado: "Cerrada TP",
    hora: "12:15",
    session: "NY",
    risk: "Alto",
    probability: "95%",
    analysis:
      "Operación cerrada en ganancia tras objetivo alcanzado. La gestión siguió el plan y el precio respetó la estructura técnica.",
    plan: "ELITE",
    direction: "Venta",
  },
];

const categoryOptions = ["Todas", "Oro", "Forex", "Crypto"];
const statusOptions = ["Todas", "Activas", "TP cerca", "Cerradas"];
const sessionOptions = ["Todas", "Londres", "NY", "Asia"];
const riskOptions = ["Todas", "Bajo", "Medio", "Alto"];
const directionOptions = ["Todas", "Compra", "Venta"];

export default function AlertasPage() {
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [status, setStatus] = useState("Todas");
  const [search, setSearch] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [session, setSession] = useState("Todas");
  const [risk, setRisk] = useState("Todas");
  const [direction, setDirection] = useState("Todas");
  const [rrMin, setRrMin] = useState("0");
  const [selectedId, setSelectedId] = useState(demoAlerts[0]?.id ?? "");

  const filteredAlerts = useMemo(() => {
    const rrValue = parseFloat(rrMin) || 0;
    const statusKey = status === "Activas" ? "Activa" : status;

    return demoAlerts.filter((alert) => {
      const matchesCategory = activeCategory === "Todas" || alert.market === activeCategory;
      const matchesStatus = status === "Todas" || alert.estado.includes(statusKey);
      const matchesSearch = alert.symbol.toLowerCase().includes(search.toLowerCase());
      const matchesSession = session === "Todas" || alert.session === session;
      const matchesRisk = risk === "Todas" || alert.risk === risk;
      const matchesDirection = direction === "Todas" || alert.direction === direction;
      const matchesRr = parseFloat(alert.rr) >= rrValue;

      return (
        matchesCategory &&
        matchesStatus &&
        matchesSearch &&
        matchesSession &&
        matchesRisk &&
        matchesDirection &&
        matchesRr
      );
    });
  }, [activeCategory, status, search, session, risk, direction, rrMin]);

  const selectedAlert = filteredAlerts.find((alert) => alert.id === selectedId) ?? filteredAlerts[0] ?? demoAlerts[0];

  const handleClear = () => {
    setActiveCategory("Todas");
    setStatus("Todas");
    setSearch("");
    setSession("Todas");
    setRisk("Todas");
    setDirection("Todas");
    setRrMin("0");
    setAdvancedOpen(false);
  };

  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-[#06070B] via-[#07090F] to-[#0E1118] px-8 py-10 shadow-[0_40px_120px_rgba(212,175,55,0.14)]"
        >
          <div className="grid gap-8 xl:grid-cols-[1.5fr_0.95fr]">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#D4AF37]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">PRO ACTIVO</span>
                <span className="rounded-full bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-300">SALA EN VIVO</span>
                <span className="rounded-full bg-[#0B0F16] border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-300">RIESGO CONTROLADO</span>
                <span className="rounded-full bg-[#11151F] border border-[#D4AF37]/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">DEMO DATA</span>
              </div>
              <div className="max-w-3xl space-y-5">
                <p className="text-sm uppercase tracking-[0.32em] text-[#D4AF37]/70">Sala de alertas premium</p>
                <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">Sala de Alertas en Vivo</h1>
                <p className="max-w-xl text-lg leading-8 text-zinc-400">
                  Miembro PRO activo: acceso habilitado a señales premium. Recibe entradas, zonas de protección, objetivos y seguimiento operativo en una sala privada.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#10141D]/95 p-6 shadow-xl shadow-[#D4AF37]/10">
              <p className="text-xs uppercase tracking-[0.24em] text-[#D4AF37]">Control de sala</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Equipo CARVIPIX monitoreando la sesión</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Analistas, traders y gestión de riesgo vigilan cada señal, actualizando los parámetros en vivo y controlando la ejecución con disciplina.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-[#0B111A]/90 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Sesión</p>
                  <p className="mt-2 text-lg font-semibold text-white">Londres • NY</p>
                </div>
                <div className="rounded-[1.5rem] bg-[#0B111A]/90 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Riesgo</p>
                  <p className="mt-2 text-lg font-semibold text-[#D4AF37]">Controlado</p>
                </div>
              </div>

              <div className="mt-6 rounded-[1.75rem] border border-[#D4AF37]/20 bg-[#0A0F16]/90 p-5">
                <p className="text-sm text-zinc-400">Visión rápida</p>
                <ul className="mt-4 space-y-3 text-sm text-zinc-300">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#D4AF37]" />
                    Señales con objetivos y gestión en una sola vista.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#D4AF37]" />
                    Panel de detalle operativo para la alerta seleccionada.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#D4AF37]" />
                    Soporte premium para decisiones basadas en data demo.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
          <div className="space-y-6">
            <AlertFilters
              categories={categoryOptions}
              activeCategory={activeCategory}
              status={status}
              search={search}
              advancedOpen={advancedOpen}
              session={session}
              risk={risk}
              direction={direction}
              rrMin={rrMin}
              onCategoryChange={setActiveCategory}
              onSearchChange={setSearch}
              onStatusChange={setStatus}
              onToggleAdvanced={() => setAdvancedOpen((value) => !value)}
              onSessionChange={setSession}
              onRiskChange={setRisk}
              onDirectionChange={setDirection}
              onRrMinChange={setRrMin}
              onClear={handleClear}
            />

            <AlertStats />

            <AlertsTable alerts={filteredAlerts} selectedId={selectedId} onSelect={setSelectedId} />
          </div>

          <div className="space-y-6">
            <AlertDetails alert={selectedAlert} />

            <div className="rounded-[2rem] border border-white/10 bg-[#10141D]/90 p-6 shadow-xl shadow-[#D4AF37]/10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-[#D4AF37]">Gestión de sala</p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">Seguimiento premium</h3>
                </div>
                <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-[#D4AF37]">Activo</span>
              </div>

              <p className="mt-4 text-sm leading-7 text-zinc-400">
                El equipo revisa cada señal, ajusta niveles y mantiene el control de riesgo en todo momento. Este panel complementa el detalle operativo.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-black/20 p-4">
                  <p className="text-xs uppercase text-zinc-500">Actualizaciones</p>
                  <p className="mt-2 text-lg font-semibold text-white">24/7</p>
                </div>
                <div className="rounded-3xl bg-black/20 p-4">
                  <p className="text-xs uppercase text-zinc-500">Modo</p>
                  <p className="mt-2 text-lg font-semibold text-[#D4AF37]">Demo premium</p>
                </div>
              </div>
            </div>

            <AlertHistory />
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] border border-white/10 bg-[#0A1017]/90 p-6 text-sm text-zinc-400">
          <p className="max-w-3xl leading-7">
            Operar mercados financieros implica riesgo. Las señales tienen fines educativos e informativos y no constituyen asesoramiento financiero. Consulta siempre tu propio criterio antes de tomar decisiones.
          </p>
        </div>
      </div>
    </main>
  );
}
