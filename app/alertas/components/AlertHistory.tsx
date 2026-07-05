"use client";

import { CARVIPIXBadge, CARVIPIXCard, colors, spacing, typography, borders } from "../../design-system";

const defaultHistory = [
  { activo: "XAUUSD", resultado: "Ganada", pips: "+68 pips", fecha: "Hoy 11:20" },
  { activo: "BTCUSD", resultado: "Ganada", pips: "+420 pts", fecha: "Hoy 09:45" },
  { activo: "GBPUSD", resultado: "Perdida", pips: "-36 pips", fecha: "Ayer 18:10" },
  { activo: "EURUSD", resultado: "Ganada", pips: "+22 pips", fecha: "Ayer 14:05" },
];

type AlertHistoryItem = {
  activo: string;
  resultado: string;
  pips: string;
  fecha: string;
};

export default function AlertHistory({ history }: { history?: AlertHistoryItem[] }) {
  const safeHistory = history && history.length > 0 ? history : defaultHistory;

  return (
    <CARVIPIXCard variant="info" padding="16">
      <div style={{ marginBottom: spacing[12], display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing[12] }}>
        <div>
          <h2 style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.white.pure }}>Historial reciente</h2>
          <p style={{ marginTop: spacing[8], fontSize: typography.sizes.xs, color: colors.white.secondary }}>Últimas operaciones cerradas.</p>
        </div>
        <CARVIPIXBadge variant="premium">Último 7 días</CARVIPIXBadge>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[8] }}>
        {safeHistory.map((item) => (
          <div
            key={`${item.activo}-${item.fecha}`}
            style={{
              borderRadius: borders.radius.xl,
              border: `1px solid rgba(255, 255, 255, 0.1)`,
              backgroundColor: `rgba(0, 0, 0, 0.2)`,
              padding: spacing[12],
              transition: 'all 200ms ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(212, 175, 55, 0.3)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(255, 255, 255, 0.1)`;
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing[12] }}>
              <div>
                <p style={{ fontWeight: typography.weights.semibold, color: colors.white.pure }}>{item.activo}</p>
                <p style={{ fontSize: typography.sizes.xs, color: colors.white.secondary }}>{item.fecha}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: typography.weights.semibold, color: item.resultado === "Ganada" ? '#86EFAC' : '#F87171' }}>
                  {item.resultado}
                </p>
                <p style={{ fontSize: typography.sizes.xs, color: colors.white.secondary }}>{item.pips}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CARVIPIXCard>
  );
}
