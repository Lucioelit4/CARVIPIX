"use client";

import { motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import AlertFilters from "./components/AlertFilters";
import AlertStats from "./components/AlertStats";
import AlertsTable from "./components/AlertsTable";
import AlertDetails from "./components/AlertDetails";
import AlertHistory from "./components/AlertHistory";
import { getAlerts } from "@/app/lib/data-helpers";
import { CARVIPIXCard, colors, spacing, typography, shadows, borders } from "../design-system";

// Data from modules - will be populated on mount
const defaultDemoAlerts = [
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
  const [demoAlerts, setDemoAlerts] = useState(defaultDemoAlerts);
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [status, setStatus] = useState("Todas");
  const [search, setSearch] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [session, setSession] = useState("Todas");
  const [risk, setRisk] = useState("Todas");
  const [direction, setDirection] = useState("Todas");
  const [rrMin, setRrMin] = useState("0");
  const [selectedId, setSelectedId] = useState("");

  // Load alerts from modules on mount
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const alerts = await getAlerts(10);
        if (alerts && alerts.length > 0) {
          // Transform module alerts to component format
          const transformedAlerts = alerts.map((alert: any, index: number) => ({
            id: alert.id,
            symbol: alert.symbol || "EURUSD",
            market: alert.type === "signal" ? "Forex" : "General",
            tipo: "Compra",
            entrada: "N/A",
            sl: "N/A",
            tp: "N/A",
            rr: "2.0",
            estado: alert.status === "active" ? "Activa" : alert.status,
            hora: new Date(alert.timestamp).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            session: "General",
            risk: alert.priority === "critical" || alert.priority === "high" ? "Alto" : alert.priority === "medium" ? "Medio" : "Bajo",
            probability: "85%",
            analysis: alert.description,
            plan: "PRO",
            direction: "Compra",
          }));
          setDemoAlerts(transformedAlerts);
          if (transformedAlerts.length > 0) {
            setSelectedId(transformedAlerts[0].id);
          }
        } else {
          setDemoAlerts(defaultDemoAlerts);
          setSelectedId(defaultDemoAlerts[0]?.id ?? "");
        }
      } catch (error) {
        console.log("Usando datos demo (módulos no disponibles)");
        setDemoAlerts(defaultDemoAlerts);
        setSelectedId(defaultDemoAlerts[0]?.id ?? "");
      }
    };

    loadAlerts();
  }, []);

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
    <main style={{ minHeight: '100vh', backgroundColor: colors.black.pure, color: colors.white.pure }}>
      <div style={{ marginLeft: 'auto', marginRight: 'auto', maxWidth: '80rem', paddingLeft: spacing[24], paddingRight: spacing[24], paddingTop: spacing[40], paddingBottom: spacing[40] }}>
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            marginBottom: spacing[40],
            overflow: 'hidden',
            borderRadius: borders.radius.xl,
            border: `1px solid rgba(255, 255, 255, 0.1)`,
            background: `linear-gradient(135deg, rgba(7, 10, 15, 1) 0%, rgba(7, 9, 15, 1) 50%, rgba(14, 17, 24, 1) 100%)`,
            padding: spacing[32],
            boxShadow: shadows.glow.lg,
          }}
        >
          <div style={{ display: 'grid', gap: spacing[32], gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 0.95fr)', gridAutoRows: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[24] }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing[12] }}>
                <span style={{ borderRadius: '9999px', backgroundColor: `rgba(212, 175, 55, 0.1)`, paddingLeft: spacing[16], paddingRight: spacing[16], paddingTop: spacing[8], paddingBottom: spacing[8], fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, textTransform: 'uppercase', letterSpacing: '0.22em', color: colors.gold.primary }}>PRO ACTIVO</span>
                <span style={{ borderRadius: '9999px', backgroundColor: `rgba(255, 255, 255, 0.05)`, paddingLeft: spacing[16], paddingRight: spacing[16], paddingTop: spacing[8], paddingBottom: spacing[8], fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, textTransform: 'uppercase', letterSpacing: '0.22em', color: colors.white.secondary }}>SALA EN VIVO</span>
                <span style={{ borderRadius: '9999px', backgroundColor: 'rgba(11, 15, 22, 1)', border: `1px solid rgba(255, 255, 255, 0.1)`, paddingLeft: spacing[16], paddingRight: spacing[16], paddingTop: spacing[8], paddingBottom: spacing[8], fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, textTransform: 'uppercase', letterSpacing: '0.22em', color: colors.white.secondary }}>RIESGO CONTROLADO</span>
                <span style={{ borderRadius: '9999px', backgroundColor: 'rgba(17, 21, 31, 1)', border: `1px solid rgba(212, 175, 55, 0.2)`, paddingLeft: spacing[16], paddingRight: spacing[16], paddingTop: spacing[8], paddingBottom: spacing[8], fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, textTransform: 'uppercase', letterSpacing: '0.22em', color: colors.gold.primary }}>DEMO DATA</span>
              </div>
              <div style={{ maxWidth: '48rem', display: 'flex', flexDirection: 'column', gap: spacing[16] }}>
                <p style={{ fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: '0.32em', color: `rgba(212, 175, 55, 0.7)` }}>Sala de alertas premium</p>
                <h1 style={{ fontSize: '3.75rem', fontWeight: typography.weights.bold, letterSpacing: '-0.02em', color: colors.white.pure, lineHeight: 1.15 }}>Sala de Alertas en Vivo</h1>
                <p style={{ maxWidth: '42rem', fontSize: typography.sizes.lg, lineHeight: 1.8, color: colors.white.secondary }}>
                  Miembro PRO activo: acceso habilitado a señales premium. Recibe entradas, zonas de protección, objetivos y seguimiento operativo en una sala privada.
                </p>
                <p style={{ marginTop: spacing[8], fontSize: typography.sizes.xs, color: colors.white.secondary }}>Entrada = precio sugerido | Protección (SL) = límite de riesgo | Objetivo (TP) = zona de ganancia</p>
              </div>
            </div>

            <CARVIPIXCard variant="elevated" padding="24">
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[12] }}>
                <p style={{ fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: '0.24em', color: colors.gold.primary }}>Control de sala</p>
                <h2 style={{ marginTop: spacing[12], fontSize: '1.5rem', fontWeight: typography.weights.semibold, color: colors.white.pure }}>Equipo CARVIPIX monitoreando</h2>
                <p style={{ marginTop: spacing[12], fontSize: typography.sizes.sm, lineHeight: 1.6, color: colors.white.secondary }}>
                  Analistas, traders y gestión de riesgo vigilan cada señal, actualizando los parámetros en vivo con disciplina.
                </p>

                <div style={{ marginTop: spacing[24], display: 'grid', gap: spacing[16], gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                  <div style={{ borderRadius: borders.radius.lg, backgroundColor: `rgba(11, 17, 26, 0.9)`, padding: spacing[16] }}>
                    <p style={{ fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: '0.2em', color: colors.white.secondary }}>Sesión</p>
                    <p style={{ marginTop: spacing[8], fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.white.pure }}>Londres • NY</p>
                  </div>
                  <div style={{ borderRadius: borders.radius.lg, backgroundColor: `rgba(11, 17, 26, 0.9)`, padding: spacing[16] }}>
                    <p style={{ fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: '0.2em', color: colors.white.secondary }}>Riesgo</p>
                    <p style={{ marginTop: spacing[8], fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.gold.primary }}>Controlado</p>
                  </div>
                </div>

                <div style={{ marginTop: spacing[24], borderRadius: borders.radius.lg, border: `1px solid rgba(212, 175, 55, 0.2)`, backgroundColor: `rgba(10, 15, 22, 0.9)`, padding: spacing[16] }}>
                  <p style={{ fontSize: typography.sizes.sm, color: colors.white.secondary }}>Visión rápida</p>
                  <ul style={{ marginTop: spacing[16], display: 'flex', flexDirection: 'column', gap: spacing[12], fontSize: typography.sizes.sm, color: colors.white.secondary }}>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[12] }}>
                      <span style={{ marginTop: spacing[4], minWidth: '10px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: colors.gold.primary, flexShrink: 0 }} />
                      Señales con objetivos y gestión en una sola vista.
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[12] }}>
                      <span style={{ marginTop: spacing[4], minWidth: '10px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: colors.gold.primary, flexShrink: 0 }} />
                      Panel de detalle operativo para la alerta seleccionada.
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[12] }}>
                      <span style={{ marginTop: spacing[4], minWidth: '10px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: colors.gold.primary, flexShrink: 0 }} />
                      Soporte premium para decisiones basadas en data demo.
                    </li>
                  </ul>
                </div>
              </div>
            </CARVIPIXCard>
          </div>
        </motion.section>

        <div style={{ display: 'grid', gap: spacing[24], gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 0.95fr)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[24] }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[24] }}>
            <AlertDetails alert={selectedAlert} />

            <CARVIPIXCard variant="elevated" padding="24">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing[16] }}>
                <div>
                  <p style={{ fontSize: typography.sizes.sm, textTransform: 'uppercase', letterSpacing: '0.24em', color: colors.gold.primary }}>Gestión de sala</p>
                  <h3 style={{ marginTop: spacing[12], fontSize: '1.5rem', fontWeight: typography.weights.semibold, color: colors.white.pure }}>Seguimiento premium</h3>
                </div>
                <span style={{ borderRadius: '9999px', backgroundColor: `rgba(212, 175, 55, 0.1)`, paddingLeft: spacing[12], paddingRight: spacing[12], paddingTop: spacing[4], paddingBottom: spacing[4], fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: '0.24em', color: colors.gold.primary, whiteSpace: 'nowrap' }}>Activo</span>
              </div>

              <p style={{ marginTop: spacing[16], fontSize: typography.sizes.sm, lineHeight: 1.7, color: colors.white.secondary }}>
                El equipo revisa cada señal, ajusta niveles y mantiene el control de riesgo en todo momento. Este panel complementa el detalle operativo.
              </p>

              <div style={{ marginTop: spacing[24], display: 'grid', gap: spacing[12], gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                <div style={{ borderRadius: borders.radius.lg, backgroundColor: `rgba(0, 0, 0, 0.2)`, padding: spacing[16] }}>
                  <p style={{ fontSize: typography.sizes.xs, textTransform: 'uppercase', color: colors.white.secondary }}>Actualizaciones</p>
                  <p style={{ marginTop: spacing[8], fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.white.pure }}>24/7</p>
                </div>
                <div style={{ borderRadius: borders.radius.lg, backgroundColor: `rgba(0, 0, 0, 0.2)`, padding: spacing[16] }}>
                  <p style={{ fontSize: typography.sizes.xs, textTransform: 'uppercase', color: colors.white.secondary }}>Modo</p>
                  <p style={{ marginTop: spacing[8], fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.gold.primary }}>Demo premium</p>
                </div>
              </div>
            </CARVIPIXCard>

            <AlertHistory />
          </div>
        </div>

        <div style={{ marginTop: spacing[24], borderRadius: borders.radius.lg, border: `1px solid rgba(255, 255, 255, 0.1)`, backgroundColor: `rgba(10, 16, 23, 0.9)`, padding: spacing[24], fontSize: typography.sizes.sm, color: colors.white.secondary }}>
          <p style={{ maxWidth: '48rem', lineHeight: 1.7 }}>
            Operar mercados financieros implica riesgo. Las señales tienen fines educativos e informativos y no constituyen asesoramiento financiero. Consulta siempre tu propio criterio antes de tomar decisiones.
          </p>
        </div>
      </div>
    </main>
  );
}
