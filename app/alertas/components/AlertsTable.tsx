"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { CARVIPIXCard, colors, spacing, typography, borders } from "../../design-system";

interface AlertRow {
  id: string;
  symbol: string;
  market: string;
  tipo: string;
  entrada: string;
  sl: string;
  tp: string;
  rr: string;
  estado: string;
  hora: string;
  session: string;
  risk: string;
  probability: string;
  analysis: string;
  plan: string;
  direction: string;
}

interface AlertsTableProps {
  alerts?: AlertRow[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

function getStatusStyles(status: string) {
  if (status.includes("Activa")) {
    return { backgroundColor: `rgba(34, 197, 94, 0.1)`, color: '#86EFAC', borderColor: `rgba(34, 197, 94, 0.1)` };
  }

  if (status.includes("TP")) {
    return { backgroundColor: `rgba(212, 175, 55, 0.1)`, color: colors.gold.primary, borderColor: `rgba(212, 175, 55, 0.1)` };
  }

  if (status.includes("Cerrada")) {
    return { backgroundColor: `rgba(255, 255, 255, 0.05)`, color: colors.white.secondary, borderColor: `rgba(255, 255, 255, 0.1)` };
  }

  return { backgroundColor: `rgba(255, 255, 255, 0.05)`, color: colors.white.secondary, borderColor: `rgba(255, 255, 255, 0.1)` };
}

export default function AlertsTable({ alerts, selectedId, onSelect }: AlertsTableProps) {
  const safeAlerts = alerts ?? [];
  const safeSelectedId = selectedId ?? "";
  const safeOnSelect = onSelect ?? (() => {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <CARVIPIXCard variant="elevated" padding="16">
        <div style={{ marginBottom: spacing[12], display: 'flex', flexDirection: 'column', gap: spacing[8], justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.white.pure }}>Alertas en vivo</h2>
            <p style={{ marginTop: spacing[8], fontSize: typography.sizes.sm, color: colors.white.secondary }}>Señales con niveles de entrada, protección y objetivo.</p>
          </div>
          <span style={{ borderRadius: '9999px', border: `1px solid rgba(212, 175, 55, 0.3)`, backgroundColor: `rgba(212, 175, 55, 0.1)`, paddingLeft: spacing[8], paddingRight: spacing[8], paddingTop: spacing[4], paddingBottom: spacing[4], fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.24em', color: colors.gold.primary, display: 'inline-block', width: 'fit-content' }}>
            {safeAlerts.length} señales activas
          </span>
        </div>

        <div style={{ display: 'grid', gap: spacing[16] }}>
          {safeAlerts.length === 0 ? (
            <div style={{ borderRadius: borders.radius.lg, border: `1px solid rgba(255, 255, 255, 0.1)`, backgroundColor: `rgba(11, 17, 26, 0.9)`, padding: spacing[32], textAlign: 'center', fontSize: typography.sizes.sm, color: colors.white.secondary }}>
              No hay alertas con los filtros seleccionados.
            </div>
          ) : (
            safeAlerts.map((alert) => {
              const isSelected = safeSelectedId === alert.id;
              const statusStyles = getStatusStyles(alert.estado);

              return (
                <motion.button
                  type="button"
                  key={alert.id}
                  onClick={() => safeOnSelect(alert.id)}
                  whileHover={{ y: -2 }}
                  style={{
                    width: '100%',
                    borderRadius: borders.radius.lg,
                    border: `1px solid ${isSelected ? 'rgba(212, 175, 55, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                    backgroundColor: isSelected ? `rgba(20, 26, 36, 1)` : `rgba(11, 17, 26, 0.9)`,
                    padding: spacing[12],
                    textAlign: 'left',
                    boxShadow: isSelected ? `0 12px 24px rgba(212, 175, 55, 0.15)` : 'none',
                    transition: 'all 300ms ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = `rgba(212, 175, 55, 0.4)`;
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 16px rgba(212, 175, 55, 0.1)`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = `rgba(255, 255, 255, 0.1)`;
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                    }
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[8] }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[8], justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing[8] }}>
                        <p style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.white.pure }}>{alert.symbol}</p>
                        <span style={{ borderRadius: '9999px', backgroundColor: `rgba(17, 23, 31, 1)`, paddingLeft: spacing[8], paddingRight: spacing[8], paddingTop: spacing[4], paddingBottom: spacing[4], fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', color: colors.white.secondary }}>
                          {alert.market}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing[8], fontSize: '12px', color: colors.white.secondary }}>
                        <span>{alert.hora}</span>
                        <span>•</span>
                        <span>{alert.session}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing[8], fontSize: '12px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: spacing[4],
                          borderRadius: '9999px',
                          paddingLeft: spacing[12],
                          paddingRight: spacing[12],
                          paddingTop: spacing[4],
                          paddingBottom: spacing[4],
                          fontSize: typography.sizes.xs,
                          fontWeight: typography.weights.semibold,
                          backgroundColor: alert.tipo === "Compra" ? `rgba(34, 197, 94, 0.1)` : `rgba(239, 68, 68, 0.1)`,
                          color: alert.tipo === "Compra" ? '#86EFAC' : '#FCA5A5',
                        }}
                      >
                        {alert.tipo === "Compra" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {alert.tipo}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: spacing[8], display: 'grid', gap: spacing[8], gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))' }}>
                    <div style={{ borderRadius: borders.radius.md, backgroundColor: `rgba(19, 25, 35, 0.9)`, padding: spacing[8] }}>
                      <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.16em', color: colors.white.secondary }}>Entrada</p>
                      <p style={{ marginTop: spacing[4], fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.white.pure, overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{alert.entrada}</p>
                    </div>
                    <div style={{ borderRadius: borders.radius.md, backgroundColor: `rgba(19, 25, 35, 0.9)`, padding: spacing[8] }}>
                      <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.16em', color: colors.white.secondary }}>SL</p>
                      <p style={{ marginTop: spacing[4], fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: '#F87171', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{alert.sl}</p>
                    </div>
                    <div style={{ borderRadius: borders.radius.md, backgroundColor: `rgba(19, 25, 35, 0.9)`, padding: spacing[8] }}>
                      <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.16em', color: colors.white.secondary }}>TP</p>
                      <p style={{ marginTop: spacing[4], fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: '#86EFAC', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{alert.tp}</p>
                    </div>
                  </div>

                  <div style={{ marginTop: spacing[16], display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing[12], justifyContent: 'space-between' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', borderRadius: '9999px', paddingLeft: spacing[16], paddingRight: spacing[16], paddingTop: spacing[4], paddingBottom: spacing[4], fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, ...statusStyles }}>
                      {alert.estado}
                    </span>
                    <span style={{ fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: '0.2em', color: colors.white.secondary }}>{alert.direction}</span>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>

        <div style={{ marginTop: spacing[24], borderRadius: borders.radius.lg, border: `1px solid rgba(255, 255, 255, 0.1)`, backgroundColor: `rgba(10, 15, 22, 0.9)`, padding: spacing[16], fontSize: typography.sizes.sm, color: colors.white.secondary }}>
          Selecciona una alerta para ver el detalle operativo o usa los filtros para refinar tu sala premium.
        </div>
      </CARVIPIXCard>
    </motion.div>
  );
}
